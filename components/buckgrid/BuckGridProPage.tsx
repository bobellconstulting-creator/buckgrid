'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
          'radial-gradient(circle at top left, rgba(166,109,22,0.16), transparent 26%), linear-gradient(180deg, #0c100c 0%, #0a0d09 100%)',
      }}
    >

      {/* Full-screen map — client-only to guarantee ref is set */}
      {!mounted && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d09' }}>
          <div style={{ color: 'rgba(217,164,65,0.6)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Loading map...</div>
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
          gap: 8,
          padding: '7px 14px',
          borderRadius: 999,
          background: 'rgba(10,12,10,0.82)',
          border: '1px solid rgba(217,164,65,0.22)',
          backdropFilter: 'blur(16px)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: '#d9a441', fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Playfair Display', serif" }}>
          BuckGrid Pro
        </span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#84cc16', boxShadow: '0 0 8px rgba(132,204,22,0.8)', flexShrink: 0 }} />
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
            background: 'rgba(10,12,10,0.92)',
            border: '1px solid rgba(217,164,65,0.24)',
            borderRight: 'none',
            color: '#f7f0de',
            padding: '14px 16px',
            borderRadius: '14px 0 0 14px',
            fontSize: 13,
            outline: 'none',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.24)',
          }}
        />
        <button
          onClick={searchAddress}
          disabled={searching}
          style={{
            background: 'linear-gradient(135deg, #d9a441 0%, #f6d58e 100%)',
            border: 'none',
            borderRadius: '0 14px 14px 0',
            color: '#17150f',
            fontWeight: 900,
            padding: '0 18px',
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
        className="glass"
        style={{
          position: 'absolute',
          left: 18,
          top: isMobile ? 130 : 72,
          bottom: isMobile ? 'auto' : 18,
          padding: 0,
          borderRadius: 20,
          width: isMobile ? 'calc(100vw - 36px)' : 214,
          zIndex: 2000,
          background: 'linear-gradient(180deg, rgba(14,18,14,0.94) 0%, rgba(10,12,10,0.98) 100%)',
          border: '1px solid rgba(217,164,65,0.16)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.32)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '60vh' : 'none',
        }}
      >
        {/* Scrollable content */}
        <div style={{ padding: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#d9a441', letterSpacing: '0.2em', marginBottom: 6, textTransform: 'uppercase' }}>
            BUCKGRID PRO
          </div>
          <div style={{ color: '#f7f0de', fontSize: 18, fontWeight: 700, lineHeight: 1.1, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Tools
          </div>
          <div style={{ color: 'rgba(237,227,197,0.68)', fontSize: 12, lineHeight: 1.55, marginBottom: 6 }}>
            Search address, draw BORDER, paint features, then Lock & Scan.
          </div>
          <ToolGrid
            tools={TOOLS}
            activeToolId={activeTool.id}
            brushSize={brushSize}
            onSelectTool={setActiveTool}
            onBrushSize={setBrushSize}
          />
        </div>

        {/* Pinned footer — always visible */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(217,164,65,0.1)', flexShrink: 0 }}>
          <button
            onClick={onLockBorder}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #d9a441 0%, #f6d58e 100%)',
              color: '#17150f',
              padding: '13px 0',
              borderRadius: 14,
              fontWeight: 900,
              cursor: 'pointer',
              border: 'none',
              fontSize: 11,
              letterSpacing: '0.18em',
              marginBottom: 8,
              textTransform: 'uppercase',
              boxShadow: '0 14px 30px rgba(217,164,65,0.24)',
            }}
          >
            Lock & Scan
          </button>
          <button
            onClick={() => { mapRef.current?.wipeAll(); setPropertyAcres(0); setTonyFeatures([]) }}
            style={{
              width: '100%',
              color: 'rgba(237,227,197,0.56)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '10px 0',
              cursor: 'pointer',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Wipe Canvas
          </button>
        </div>
      </div>

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

      {/* ── ACRES DISPLAY (bottom-left) ── */}
      <div
        className="glass"
        style={{
          position: 'absolute',
          left: 18,
          bottom: isMobile ? 18 : 18,
          padding: '14px 18px',
          borderRadius: 20,
          borderLeft: '4px solid #d9a441',
          zIndex: 2000,
          background: 'linear-gradient(180deg, rgba(14,18,14,0.95) 0%, rgba(10,12,10,0.98) 100%)',
          border: '1px solid rgba(217,164,65,0.16)',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(237,227,197,0.62)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
          Locked Footprint
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#d9a441', lineHeight: 1 }}>
          {propertyAcres > 0 ? propertyAcres.toLocaleString() : '—'}
          <span style={{ fontSize: 10, color: 'rgba(237,227,197,0.52)', marginLeft: 6, letterSpacing: '0.16em' }}>ACRES</span>
        </div>
        <div style={{ color: 'rgba(237,227,197,0.64)', fontSize: 12, marginTop: 4 }}>
          {propertyAcres > 0 ? 'Property locked. Ask Tony anything.' : 'Draw BORDER → Lock & Scan to start.'}
        </div>
      </div>
    </div>
  )
}
