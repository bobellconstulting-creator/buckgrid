import type { FeatureType } from "./tony-prompt"
import { FEATURE_STYLES } from "./tony-prompt"

export interface TonyFeature {
  id: string
  type: FeatureType
  label: string
  priority: number
  reason: string
  geometry: {
    type: "Polygon" | "LineString" | "Point"
    coordinates: number[][] | number[][][] | number[]
  }
  style: {
    color: string
    fillOpacity: number
    weight: number
  }
}

export interface ParsedTonyResponse {
  analysis: string
  priorities: string[]
  thisWeek: string
  features: TonyFeature[]
  rawText: string
}

const VALID_GEOMETRY_TYPES = new Set(["Polygon", "LineString", "Point"])
const VALID_FEATURE_TYPES = new Set<string>([
  "buck_bedding", "doe_bedding", "sanctuary", "food_plot", "staging_area",
  "stand_site", "sneak_trail", "access_trail", "cover_strip", "pinch_point",
  "water", "shooting_lane",
])

function isValidFeature(f: unknown): f is Omit<TonyFeature, 'style'> {
  if (!f || typeof f !== 'object') return false
  const feature = f as Record<string, unknown>
  if (typeof feature.id !== 'string' || !feature.id) return false
  if (typeof feature.type !== 'string' || !VALID_FEATURE_TYPES.has(feature.type)) return false
  if (typeof feature.label !== 'string') return false
  const geo = feature.geometry as Record<string, unknown> | null | undefined
  if (!geo || typeof geo !== 'object') return false
  if (!VALID_GEOMETRY_TYPES.has(geo.type as string)) return false
  if (!Array.isArray(geo.coordinates)) return false
  return true
}

function normalizeFeaturesArray(rawFeatures: unknown[]): TonyFeature[] {
  const seenIds = new Set<string>()
  return rawFeatures
    .filter(isValidFeature)
    .map((f, idx) => {
      // Ensure unique IDs
      let id = f.id
      if (seenIds.has(id)) id = `${id}_${idx}`
      seenIds.add(id)

      const featureType = f.type as FeatureType
      const baseStyle = FEATURE_STYLES[featureType] ?? { color: "#ffffff", fillOpacity: 0.3, weight: 2 }
      const inlineStyle = (f as Record<string, unknown>).style as Partial<TonyFeature['style']> | undefined

      return {
        id,
        type: featureType,
        label: f.label || featureType.replace(/_/g, ' '),
        priority: typeof f.priority === 'number' ? f.priority : idx + 1,
        reason: typeof f.reason === 'string' ? f.reason : '',
        geometry: f.geometry,
        style: { ...baseStyle, ...(inlineStyle ?? {}) },
      }
    })
}

function tryParseFeatures(json: string): TonyFeature[] {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    const raw = parsed.features
    if (!Array.isArray(raw)) return []
    return normalizeFeaturesArray(raw)
  } catch {
    return []
  }
}

export function parseTonyResponse(rawText: string): ParsedTonyResponse {
  const result: ParsedTonyResponse = {
    analysis: "",
    priorities: [],
    thisWeek: "",
    features: [],
    rawText,
  }

  // Extract ANALYSIS section
  const analysisMatch = rawText.match(/ANALYSIS:\s*\n([\s\S]*?)(?=\nPRIORITIES:|$)/)
  if (analysisMatch) result.analysis = analysisMatch[1].trim()

  // Extract PRIORITIES section
  const prioritiesMatch = rawText.match(/PRIORITIES:\s*\n([\s\S]*?)(?=\nTHIS_WEEK:|$)/)
  if (prioritiesMatch) {
    result.priorities = prioritiesMatch[1]
      .trim()
      .split("\n")
      .filter((line) => /^\d+[\.\)]/.test(line.trim()))
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(Boolean)
  }

  // Extract THIS_WEEK section
  const thisWeekMatch = rawText.match(/THIS_WEEK:\s*\n([\s\S]*?)(?=\nDRAW_FEATURES:|$)/)
  if (thisWeekMatch) result.thisWeek = thisWeekMatch[1].trim()

  // Try multiple patterns to extract DRAW_FEATURES JSON
  // Pattern 1: standard ```json ... ``` block
  const jsonMatch = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    const features = tryParseFeatures(jsonMatch[1].trim())
    if (features.length > 0) {
      result.features = features
      return result
    }

    // Pattern 2: brace extraction fallback
    const block = jsonMatch[1]
    const openBrace = block.indexOf("{")
    const closeBrace = block.lastIndexOf("}")
    if (openBrace !== -1 && closeBrace > openBrace) {
      const trimmed = block.slice(openBrace, closeBrace + 1)
      result.features = tryParseFeatures(trimmed)
    }
  }

  // Pattern 3: raw JSON object anywhere in text (no code fence)
  if (result.features.length === 0) {
    const rawMatch = rawText.match(/"features"\s*:\s*\[[\s\S]*?\]/)
    if (rawMatch) {
      const wrapped = `{${rawMatch[0]}}`
      result.features = tryParseFeatures(wrapped)
    }
  }

  return result
}
