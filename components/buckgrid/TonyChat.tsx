'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { parseTonyResponse, type ParsedTonyResponse } from '@/lib/parse-tony-response'

export type TonyChatHandle = {
  addTonyMessage: (text: string) => void
  triggerScan: (prompt: string) => void
}

type Message = { role: 'tony' | 'user'; text: string }

type SpatialContext = {
  acreage: number
  boundaryGeoJSON: unknown | null
  mapBounds: { sw: [number, number]; ne: [number, number] } | null
  layers: unknown[]
  locationLabel?: string
}

/** Strip raw section headers + JSON block, return clean chat-ready text */
function formatForDisplay(parsed: ParsedTonyResponse): string {
  const parts: string[] = []
  if (parsed.analysis) parts.push(parsed.analysis)
  if (parsed.priorities.length > 0) {
    parts.push('\nPriorities:')
    parsed.priorities.forEach((p, i) => parts.push(`${i + 1}. ${p}`))
  }
  if (parsed.thisWeek) parts.push(`\n→ This week: ${parsed.thisWeek}`)
  if (parsed.features.length > 0) {
    parts.push(`\n✓ ${parsed.features.length} features drawn on your map.`)
  }
  return parts.join('\n').trim() || parsed.rawText
}

const TonyChat = forwardRef<TonyChatHandle, {
  getCaptureTarget: () => HTMLElement | null
  getSpatialContext: () => SpatialContext
  onTonyResponse?: (parsed: ParsedTonyResponse) => void
}>(
  ({ getCaptureTarget, getSpatialContext, onTonyResponse }, ref) => {
    const [chat, setChat] = useState<Message[]>([
      { role: 'tony', text: "Search an address above to find your land. Then draw a BORDER rectangle over the property and click 'Lock & Scan' — I'll audit the habitat and build your plan." },
    ])
    const [input, setInput] = useState('')
    const [isOpen, setIsOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    const [viewportWidth, setViewportWidth] = useState(1600)
    const scrollRef = useRef<HTMLDivElement>(null)
    const quickPrompts = [
      'Best early-season stand?',
      'Where should the sanctuary go?',
      'What should I build this week?',
    ]

    useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [chat])

    useEffect(() => {
      const syncViewport = () => setViewportWidth(window.innerWidth)
      syncViewport()
      window.addEventListener('resize', syncViewport)
      return () => window.removeEventListener('resize', syncViewport)
    }, [])

    const isMobile = viewportWidth < 960

    const captureMap = useCallback(async (): Promise<string | null> => {
      const target = getCaptureTarget()
      if (!target) return null
      try {
        const canvas = await html2canvas(target, {
          useCORS: true,
          allowTaint: true,
          scale: 1.5,
          logging: false,
        })
        return canvas.toDataURL('image/png').replace('data:image/png;base64,', '')
      } catch (err) {
        console.warn('[BuckGrid] Map capture failed (CORS or tile issue):', err)
        return null
      }
    }, [getCaptureTarget])

    const askTony = useCallback(async (prompt: string) => {
      const spatial = getSpatialContext()
      const imageBase64 = await captureMap()

      if (spatial.boundaryGeoJSON && spatial.mapBounds) {
        const res = await fetch('/api/tony', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            boundaryGeoJSON: spatial.boundaryGeoJSON,
            mapBounds: spatial.mapBounds,
            acreage: spatial.acreage,
            region: spatial.locationLabel || 'Unknown region',
            state: spatial.locationLabel || 'Unknown state',
            messages: [{ role: 'user', content: `${prompt}\n\nVisible drawn layers: ${JSON.stringify(spatial.layers)}` }],
            stream: true,
          }),
        })
        if (res.ok) {
          return { res, streamed: true as const }
        }
      }

      // Fallback: no boundary locked or tony API failed
      const fallbackRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          imageDataUrl: imageBase64 ? `data:image/png;base64,${imageBase64}` : undefined,
        }),
      })
      return { res: fallbackRes, streamed: false as const }
    }, [getSpatialContext, captureMap])

    const readStreamedReply = async (res: Response, onChunk: (text: string) => void): Promise<string> => {
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      if (!reader) return ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const line = event.split('\n').find((entry) => entry.startsWith('data: '))
          if (!line) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue

          try {
            const parsed = JSON.parse(payload) as { text?: string }
            const text = typeof parsed?.text === 'string' ? parsed.text : ''
            if (text) {
              fullText += text
              onChunk(text)
            }
          } catch {
            // malformed SSE chunk — skip
          }
        }
      }

      // Flush any remaining buffer
      if (buffer.trim()) {
        const line = buffer.split('\n').find((entry) => entry.startsWith('data: '))
        if (line) {
          const payload = line.slice(6)
          if (payload && payload !== '[DONE]') {
            try {
              const parsed = JSON.parse(payload) as { text?: string }
              if (typeof parsed?.text === 'string' && parsed.text) {
                fullText += parsed.text
                onChunk(parsed.text)
              }
            } catch { /* ignore */ }
          }
        }
      }

      return fullText
    }

    const emitTonyResponse = useCallback((reply: string): string => {
      const parsed = parseTonyResponse(reply)
      onTonyResponse?.(parsed)
      return formatForDisplay(parsed)
    }, [onTonyResponse])

    const runPrompt = useCallback(async (prompt: string) => {
      if (!prompt.trim() || loading) return

      setLoading(true)
      setChat(p => [...p, { role: 'user', text: prompt }])

      try {
        const { res, streamed } = await askTony(prompt)

        if (streamed) {
          if (!res.ok) throw new Error('Tony request failed')

          let reply = ''
          // Add empty tony message that we'll fill via streaming
          setChat(p => [...p, { role: 'tony', text: '' }])

          reply = await readStreamedReply(res, (chunk) => {
            setChat(p => {
              const next = [...p]
              const last = next[next.length - 1]
              if (last?.role === 'tony') {
                next[next.length - 1] = { ...last, text: `${last.text}${chunk}` }
              }
              return next
            })
          })

          // Replace streamed raw text with clean formatted version
          const displayText = reply.trim() ? emitTonyResponse(reply) : 'No reply.'
          setChat(p => {
            const next = [...p]
            next[next.length - 1] = { role: 'tony', text: displayText }
            return next
          })
        } else {
          const data = await res.json() as { reply?: string }
          const text = emitTonyResponse(data.reply || 'No reply.')
          setChat(p => [...p, { role: 'tony', text }])
        }
      } catch {
        setChat(p => [...p, {
          role: 'tony',
          text: "I'm up, but the live model path failed. Ask again after locking the property or use one of the quick prompts.",
        }])
      }

      setLoading(false)
    }, [loading, askTony, emitTonyResponse])

    useImperativeHandle(ref, () => ({
      addTonyMessage: (text: string) => setChat(p => [...p, { role: 'tony', text }]),
      triggerScan: async (contextPrompt: string) => {
        if (loading) return
        setLoading(true)
        setChat(p => [...p, { role: 'tony', text: 'Analyzing terrain & cover...' }])
        try {
          const { res, streamed } = await askTony(contextPrompt)
          if (streamed) {
            if (!res.ok) throw new Error('Tony request failed')

            let reply = ''
            setChat(p => {
              const next = [...p]
              next[next.length - 1] = { role: 'tony', text: '' }
              return next
            })

            reply = await readStreamedReply(res, (chunk) => {
              setChat(p => {
                const next = [...p]
                const last = next[next.length - 1]
                if (last?.role === 'tony') {
                  next[next.length - 1] = { ...last, text: `${last.text}${chunk}` }
                }
                return next
              })
            })

            const displayText = emitTonyResponse(reply || 'Connection error.')
            setChat(p => {
              const next = [...p]
              next[next.length - 1] = { role: 'tony', text: displayText }
              return next
            })
          } else {
            const data = await res.json() as { reply?: string }
            const text = emitTonyResponse(data.reply || 'Connection error.')
            setChat(p => {
              const next = [...p]
              next[next.length - 1] = { role: 'tony', text: text }
              return next
            })
          }
        } catch {
          setChat(p => [...p, {
            role: 'tony',
            text: "The live vision lane missed, but the property is still locked. Ask for one move at a time and I'll give you the best non-visual guidance I can.",
          }])
        }
        setLoading(false)
      },
    }), [loading, askTony, emitTonyResponse])

    const send = async () => {
      const msg = input.trim()
      setInput('')
      await runPrompt(msg)
    }

    return (
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: isMobile ? 'auto' : 12,
          bottom: isMobile ? 12 : 'auto',
          width: isOpen ? (isMobile ? 'calc(100vw - 24px)' : 'min(340px, calc(100vw - 24px))') : 54,
          borderRadius: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '70vh' : 'calc(100vh - 24px)',
          transition: 'width 0.25s ease',
          zIndex: 2000,
          background: 'linear-gradient(180deg, rgba(15,20,14,0.98) 0%, rgba(8,12,8,0.99) 100%)',
          border: '1px solid rgba(217,164,65,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(217,164,65,0.08) inset',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '14px 18px 12px',
            background: 'linear-gradient(180deg, rgba(22,28,20,0.98) 0%, rgba(14,18,13,0.98) 100%)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderBottom: '1px solid rgba(217,164,65,0.12)',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🦌</span>
            {isOpen && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#d9a441', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  TONY
                </div>
                <div style={{ fontSize: 9, color: 'rgba(237,227,197,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Elite Habitat Intelligence
                </div>
              </div>
            )}
          </div>
          {isOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#84cc16', boxShadow: '0 0 8px rgba(132,204,22,0.8)', display: 'block' }} />
              <span style={{ fontSize: 9, color: 'rgba(237,227,197,0.35)', letterSpacing: '0.1em' }}>ONLINE</span>
            </div>
          )}
        </div>

        {isOpen && (
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '14px 14px 10px',
                minHeight: 160,
                maxHeight: isMobile ? 300 : 440,
              }}
            >
              {chat.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {m.role === 'tony' && (
                    <div style={{ fontSize: 9, color: '#d9a441', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', paddingLeft: 2 }}>
                      Tony
                    </div>
                  )}
                  <div
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background: m.role === 'user'
                        ? 'linear-gradient(135deg, #c4922a 0%, #e8b84b 100%)'
                        : 'rgba(255,255,255,0.04)',
                      color: m.role === 'user' ? '#17150f' : '#f0e8d4',
                      padding: '10px 13px',
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      fontSize: 12,
                      maxWidth: '92%',
                      lineHeight: 1.7,
                      border: m.role === 'user' ? 'none' : '1px solid rgba(217,164,65,0.14)',
                      borderLeft: m.role === 'tony' ? '2px solid rgba(217,164,65,0.5)' : undefined,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
                  <div style={{
                    display: 'flex', gap: 4,
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#d9a441',
                        opacity: 0.6,
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                  <div style={{ color: 'rgba(217,164,65,0.6)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Tony is reading the terrain...
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => !loading && runPrompt(prompt)}
                  disabled={loading}
                  style={{
                    background: 'rgba(217,164,65,0.08)',
                    border: '1px solid rgba(217,164,65,0.2)',
                    color: '#d9a441',
                    borderRadius: 999,
                    padding: '6px 11px',
                    fontSize: 10.5,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.15s',
                    letterSpacing: '0.02em',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                padding: '10px 12px 12px',
                display: 'flex',
                gap: 8,
                background: 'rgba(8,12,8,0.98)',
                flexShrink: 0,
                borderTop: '1px solid rgba(217,164,65,0.1)',
              }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask Tony where to hunt, build, or improve..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(217,164,65,0.18)',
                  color: '#f0e8d4',
                  padding: '11px 13px',
                  borderRadius: 14,
                  fontSize: 12,
                  outline: 'none',
                  opacity: loading ? 0.6 : 1,
                }}
              />
              <button
                onClick={send}
                disabled={loading}
                style={{
                  background: loading
                    ? 'rgba(217,164,65,0.3)'
                    : 'linear-gradient(135deg, #c4922a 0%, #e8b84b 100%)',
                  border: 'none',
                  borderRadius: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#17150f',
                  fontWeight: 'bold',
                  padding: '0 16px',
                  fontSize: 14,
                  flexShrink: 0,
                  transition: 'background 0.2s',
                  boxShadow: loading ? 'none' : '0 8px 20px rgba(217,164,65,0.25)',
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.85); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    )
  }
)

TonyChat.displayName = 'TonyChat'
export default React.memo(TonyChat)
