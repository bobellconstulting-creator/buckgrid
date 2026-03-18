'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import ToolGrid from './ToolGrid'
import TonyChat, { type TonyChatHandle } from './TonyChat'
import { TOOLS, type Tool } from '@/lib/buckgrid/tools'
import MapContainer, { type MapContainerHandle } from './MapContainer'
import type { TonyFeature, ParsedTonyResponse } from '@/lib/parse-tony-response'
import MapErrorBoundary from './MapErrorBoundary'

export default function BuckGridProPage() {
  const mapRef = useRef<MapContainerHandle>(null)
  const chatRef = useRef<TonyChatHandle>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>(TOOLS[0])
  const [brushSize, setBrushSize] = useState(30)
  const [propertyAcres, setPropertyAcres] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchLabel, setSearchLabel] = useState('')
  const [tonyFeatures, setTonyFeatures] = useState<TonyFeature[]>([])
  const [viewportWidth, setViewportWidth] = useState(1600)
  const isMobile = viewportWidth < 960

  useEffect(() => {
    setMounted(true)
    const syncViewport = () => setViewportWidth(window.innerWidth)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const onLockBorder = useCallback(async () => {
    const result = await mapRef.current?.lockBoundary()
    if (!result) {
      chatRef.current?.addTonyMessage("Map is still loading — give it a second and try again.")
      return
    }
    if (result.acres === 0) {
      chatRef.current?.addTonyMessage("Zoom in to your property first, draw a BORDER rectangle over it, then click Lock & Scan.")
      return
    }
    setPropertyAcres(result.acres)

    const { summary } = result
    const parts: string[] = []
    if (summary.food > 0)    parts.push(`${summary.food} food plot${summary.food > 1 ? 's' : ''}`)
    if (summary.bedding > 0) parts.push(`${summary.bedding} bedding area${summary.bedding > 1 ? 's' : ''}`)
    if (summary.water > 0)   parts.push(`${summary.water} water source${summary.water > 1 ? 's' : ''}`)
    if (summary.path > 0)    parts.push(`${summary.path} trail${summary.path > 1 ? 's' : ''}`)
    if (summary.stand > 0)   parts.push(`${summary.stand} stand${summary.stand > 1 ? 's' : ''}`)

    const layerLine = parts.length > 0 ? ` I can see ${parts.join(', ')}.` : ''
    const contextPrompt =
      `Property locked at ${result.acres} acres.${layerLine}` +
      (result.pathYards > 0 ? ` Total trail: ${result.pathYards} yds.` : '') +
      ` Give me a quick habitat audit.`

    setActiveTool(TOOLS[0])
    chatRef.current?.triggerScan(contextPrompt)
  }, [])

  const captureMap = useCallback(async () => {
    const el = mapRef.current?.getCaptureElement()
    if (!el) return
    try {
      const canvas = await html2canvas(el, { useCORS: true, allowTaint: true, scale: 2, logging: false })
      const link = document.createElement('a')
      link.download = `buckgrid-map-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.warn('[BuckGrid] Capture failed:', err)
    }
  }, [])

  const searchAddress = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok && typeof data?.lat === 'number' && typeof data?.lon === 'number') {
        setSearchLabel(data.label || q)
        setActiveTool(TOOLS[1])  // switch to BORDER tool so user can draw immediately
        if (data.boundingbox) {
          mapRef.current?.fitBounds({
            south: data.boundingbox.south,
            west: data.boundingbox.west,
            north: data.boundingbox.north,
            east: data.boundingbox.east,
          })
        } else {
          mapRef.current?.flyTo([data.lat, data.lon], 14)
        }
        chatRef.current?.addTonyMessage(`Found ${data.label?.split(',').slice(0, 2).join(',') || q}. BORDER tool is active — drag a rectangle over your property, then click Lock & Scan.`)
      } else {
        setSearchError(data?.error || 'Address not found')
        setTimeout(() => setSearchError(''), 3000)
      }
    } catch {
      setSearchError('Search failed')
      setTimeout(() => setSearchError(''), 3000)
    }
    setSearching(false)
  }, [searchQuery])

  return (
    <div
      style={{
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        background:
          'radial-gradient(circle at top left, rgba(196,146,40,0.10), transparent 30%), linear-gradient(180deg, #080a07 0%, #080a07 100%)',
      }}
    >

      {/* Full-screen map — client-only to guarantee ref is set */}
      {!mounted && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a07' }}>
          <div style={{ color: 'rgba(196,146,40,0.6)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Loading map...</div>
        </div>
      )}
      {mounted && (
        <MapErrorBoundary>
          <MapContainer ref={mapRef} activeTool={activeTool} brushSize={brushSize} tonyFeatures={tonyFeatures} />
        </MapErrorBoundary>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(8,11,8,0.55) 0%, rgba(8,11,8,0.08) 30%, rgba(8,11,8,0.04) 60%, rgba(8,11,8,0.45) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── BRAND PILL (top-left) ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 18,
          zIndex: 2000,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 15px 7px 11px',
          borderRadius: 999,
          background: 'rgba(8,10,7,0.88)',
          border: '1px solid rgba(196,146,40,0.28)',
          backdropFilter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      >
        {/* BuckGrid logo mark — antler tines + grid */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path d="M12 2 L12 8" stroke="#C49228" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 8 L8 4" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 8 L16 4" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 8 L10 6" stroke="#C49228" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M12 8 L14 6" stroke="#C49228" strokeWidth="1.2" strokeLinecap="round"/>
          <rect x="5" y="13" width="14" height="9" rx="1.5" stroke="#C49228" strokeWidth="1.5" fill="none"/>
          <line x1="5" y1="17" x2="19" y2="17" stroke="#C49228" strokeWidth="1" opacity="0.6"/>
          <line x1="12" y1="13" x2="12" y2="22" stroke="#C49228" strokeWidth="1" opacity="0.6"/>
        </svg>
        <span style={{ color: '#E8A820', fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
          BuckGrid Pro
        </span>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#84cc16', boxShadow: '0 0 6px rgba(132,204,22,0.9)', flexShrink: 0 }} />
      </div>

      {/* ── ADDRESS SEARCH BAR ── */}
      <div style={{
        position: 'absolute',
        top: isMobile ? 70 : 16,
        left: isMobile ? 18 : 246,
        right: isMobile ? 18 : 370,
        zIndex: 2001,
        display: 'flex',
        gap: 0,
      }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchAddress()}
          placeholder="Search address or property..."
          style={{
            flex: 1,
            background: 'rgba(8,10,7,0.94)',
            border: '1px solid rgba(196,146,40,0.26)',
            borderRight: 'none',
            color: '#F0E8D4',
            padding: '14px 16px',
            borderRadius: '14px 0 0 14px',
            fontSize: 13,
            outline: 'none',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.30)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={searchAddress}
          disabled={searching}
          style={{
            background: 'linear-gradient(135deg, #C49228 0%, #E8A820 100%)',
            border: 'none',
            borderRadius: '0 14px 14px 0',
            color: '#0D0E09',
            fontWeight: 900,
            padding: '0 20px',
            cursor: searching ? 'wait' : 'pointer',
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {searching ? '…' : '🔍'}
        </button>
        {searchError && (
          <div style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            background: 'rgba(180,30,30,0.95)',
            color: '#fff',
            fontSize: 11,
            padding: '5px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}>
            {searchError}
          </div>
        )}
      </div>

      {/* ── TOOL PANEL (left) ── */}
      <div
        style={{
          position: 'absolute',
          left: 18,
          top: isMobile ? 130 : 72,
          bottom: isMobile ? 'auto' : 18,
          padding: 0,
          borderRadius: 20,
          width: isMobile ? 'calc(100vw - 36px)' : 214,
          zIndex: 2000,
          background: 'linear-gradient(180deg, rgba(17,20,9,0.96) 0%, rgba(8,10,7,0.99) 100%)',
          border: '1px solid rgba(196,146,40,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.44), inset 0 1px 0 rgba(196,146,40,0.08)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '60vh' : 'none',
        }}
      >
        {/* Panel header — branded */}
        <div style={{
          padding: '16px 14px 14px',
          background: 'linear-gradient(180deg, rgba(28,34,19,0.90) 0%, rgba(17,20,9,0.60) 100%)',
          borderBottom: '1px solid rgba(196,146,40,0.14)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(145deg, #1C2213 0%, #263018 100%)',
              border: '1px solid rgba(196,146,40,0.32)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L12 9" stroke="#C49228" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 9 L7.5 3.5" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 9 L16.5 3.5" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 9 L10 6" stroke="#C49228" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M12 9 L14 6" stroke="#C49228" strokeWidth="1.2" strokeLinecap="round"/>
                <rect x="4.5" y="13" width="15" height="9.5" rx="1.5" stroke="#C49228" strokeWidth="1.5" fill="none"/>
                <line x1="4.5" y1="17.5" x2="19.5" y2="17.5" stroke="#C49228" strokeWidth="0.9" opacity="0.55"/>
                <line x1="12" y1="13" x2="12" y2="22.5" stroke="#C49228" strokeWidth="0.9" opacity="0.55"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(196,146,40,0.65)', letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                BuckGrid Pro
              </div>
              <div style={{ color: '#F0E8D4', fontSize: 15, fontWeight: 700, lineHeight: 1.15, fontFamily: "'Playfair Display', serif", marginTop: 2 }}>
                Habitat Tools
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(196,146,40,0.30) 0%, transparent 100%)', marginBottom: 10 }} />
          <div style={{ color: 'rgba(212,201,168,0.55)', fontSize: 11, lineHeight: 1.5 }}>
            Search → Border → Paint → Lock & Scan
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '12px 14px 4px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <ToolGrid
            tools={TOOLS}
            activeToolId={activeTool.id}
            brushSize={brushSize}
            onSelectTool={setActiveTool}
            onBrushSize={setBrushSize}
          />
        </div>

        {/* Pinned footer — always visible */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(196,146,40,0.12)', flexShrink: 0 }}>
          <button
            onClick={onLockBorder}
            className="btn-lock-scan"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #C49228 0%, #E8A820 55%, #C49228 100%)',
              color: '#0D0E09',
              padding: '13px 0',
              borderRadius: 14,
              fontWeight: 900,
              cursor: 'pointer',
              border: 'none',
              fontSize: 11,
              letterSpacing: '0.20em',
              marginBottom: 8,
              textTransform: 'uppercase',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            Lock &amp; Scan
          </button>
          <button
            onClick={() => { mapRef.current?.wipeAll(); setPropertyAcres(0); setTonyFeatures([]) }}
            style={{
              width: '100%',
              color: 'rgba(212,201,168,0.5)',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '10px 0',
              cursor: 'pointer',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Wipe Canvas
          </button>
        </div>
      </div>

      {/* ── CAPTURE BUTTON (top-right, left of Tony) ── */}
      <button
        onClick={captureMap}
        title="Save map snapshot"
        style={{
          position: 'absolute',
          top: 16,
          right: isMobile ? 18 : 366,
          zIndex: 2001,
          background: 'rgba(8,10,7,0.90)',
          border: '1px solid rgba(196,146,40,0.26)',
          borderRadius: 12,
          color: '#C49228',
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
          fontSize: 18,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        📷
      </button>

      {/* ── TONY CHAT (right) ── */}
      <TonyChat
        ref={chatRef}
        getCaptureTarget={() => mapRef.current?.getCaptureElement() ?? null}
        getSpatialContext={() => ({
          ...(mapRef.current?.getSpatialContext() ?? {
            acreage: propertyAcres,
            boundaryGeoJSON: null,
            mapBounds: null,
            layers: [],
          }),
          locationLabel: searchLabel,
        })}
        onTonyResponse={useCallback((parsed: ParsedTonyResponse) => setTonyFeatures(parsed.features), [])}
      />

      {/* ── ACRES DISPLAY (bottom-center) ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 18,
          padding: '13px 18px',
          borderRadius: 18,
          borderLeft: '3px solid #C49228',
          zIndex: 2000,
          background: 'linear-gradient(180deg, rgba(17,20,9,0.96) 0%, rgba(8,10,7,0.99) 100%)',
          border: '1px solid rgba(196,146,40,0.20)',
          borderLeftWidth: 3,
          boxShadow: '0 16px 48px rgba(0,0,0,0.40)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(196,146,40,0.65)', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 5, fontFamily: "'DM Mono', monospace" }}>
          Locked Footprint
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#E8A820', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
          {propertyAcres > 0 ? propertyAcres.toLocaleString() : '—'}
          <span style={{ fontSize: 9, color: 'rgba(212,201,168,0.5)', marginLeft: 7, letterSpacing: '0.2em', fontFamily: "'DM Sans', sans-serif" }}>ACRES</span>
        </div>
        <div style={{ color: 'rgba(212,201,168,0.58)', fontSize: 11, marginTop: 5 }}>
          {propertyAcres > 0 ? 'Property locked. Ask Tony anything.' : 'Draw BORDER → Lock & Scan to start.'}
        </div>
      </div>
    </div>
  )
}
