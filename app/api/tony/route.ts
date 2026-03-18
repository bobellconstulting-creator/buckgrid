import OpenAI from "openai"
import { TONY_SYSTEM_PROMPT } from "@/lib/tony-prompt"
import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta/openai"

type ModelConfig = { provider: string; apiKey: string; model: string; baseURL: string | undefined }

function getModelConfigs(): ModelConfig[] {
  const configs: ModelConfig[] = []
  const googleKey = process.env.NEURADEX_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (googleKey) configs.push({ provider: "google", apiKey: googleKey, model: "gemini-2.0-flash", baseURL: GOOGLE_BASE })
  if (process.env.OPENAI_API_KEY) configs.push({ provider: "openai", apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o", baseURL: undefined })
  return configs
}

interface TonyRequestBody {
  imageBase64?: string
  boundaryGeoJSON: object
  mapBounds: { sw: [number, number]; ne: [number, number] }
  acreage: number
  region: string
  state: string
  messages?: Array<{ role: "user" | "assistant"; content: string }>
  stream?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: TonyRequestBody = await req.json()
    const { imageBase64, boundaryGeoJSON, mapBounds, acreage, region, state, messages, stream = true } = body

    const configs = getModelConfigs()
    if (!configs.length) return new Response("No AI model configured", { status: 500 })

    // Build user content (shared across model attempts)
    const userContent: OpenAI.ChatCompletionContentPart[] = []
    if (imageBase64) {
      userContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}`, detail: "high" } })
    }
    userContent.push({
      type: "text",
      text: `Property Details:
- Size: ${acreage} acres
- Region: ${region}
- State: ${state}
- Map Bounds SW [lng,lat]: [${mapBounds.sw[0].toFixed(6)}, ${mapBounds.sw[1].toFixed(6)}]
- Map Bounds NE [lng,lat]: [${mapBounds.ne[0].toFixed(6)}, ${mapBounds.ne[1].toFixed(6)}]
- Property Boundary GeoJSON: ${JSON.stringify(boundaryGeoJSON)}

Analyze this satellite image and provide your full habitat consultation.
Follow the exact response format in your instructions.
ALL coordinates in DRAW_FEATURES must fall strictly within the map bounds above.
Coordinates are [longitude, latitude] — longitude always first.`.trim(),
    })

    const conversationMessages: OpenAI.ChatCompletionMessageParam[] = [
      ...(messages?.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })) ?? []),
      { role: "user", content: userContent },
    ]
    const allMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: TONY_SYSTEM_PROMPT },
      ...conversationMessages,
    ]

    let lastError = ""
    for (const cfg of configs) {
      try {
        const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, timeout: 45000 })

        if (!stream) {
          const completion = await client.chat.completions.create({ model: cfg.model, max_tokens: 1200, messages: allMessages })
          const reply = completion.choices[0]?.message?.content || "No reply."
          return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json" } })
        }

        const streamResult = await client.chat.completions.create({ model: cfg.model, max_tokens: 4096, stream: true, messages: allMessages })
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResult) {
                const text = chunk.choices[0]?.delta?.content ?? ""
                if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            } catch (e) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e instanceof Error ? e.message : "stream error" })}\n\n`))
            } finally {
              controller.close()
            }
          },
        })
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
        })
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        console.error(`[Tony] ${cfg.provider} failed:`, lastError)
      }
    }

    return new Response(JSON.stringify({ error: `All models failed: ${lastError}` }), { status: 500, headers: { "Content-Type": "application/json" } })
  } catch (err) {
    console.error("[Tony API] Error:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
