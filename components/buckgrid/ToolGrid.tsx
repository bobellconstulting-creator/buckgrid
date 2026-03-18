'use client'

import React from 'react'
import type { Tool } from '@/lib/buckgrid/tools'

type Props = {
  tools: Tool[]
  activeToolId: string
  brushSize: number
  onSelectTool: (t: Tool) => void
  onBrushSize: (n: number) => void
}

function ToolGrid({ tools, activeToolId, brushSize, onSelectTool, onBrushSize }: Props) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 8.5, color: 'rgba(196,146,40,0.6)', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
          Field Protocol
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {[
            ['1', 'Search address above'],
            ['2', 'Draw BORDER over property'],
            ['3', 'Paint habitat features'],
            ['4', 'Lock & Scan for Tony\'s plan'],
          ].map(([num, label]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 17, height: 17, borderRadius: 5, background: 'rgba(196,146,40,0.12)', border: '1px solid rgba(196,146,40,0.30)', color: '#C49228', fontSize: 8.5, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{num}</span>
              <span style={{ color: 'rgba(212,201,168,0.55)', fontSize: 10.5, lineHeight: 1.3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '10px 0 14px' }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t)}
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              border: `1px solid ${activeToolId === t.id ? `${t.color}88` : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 72,
              background: activeToolId === t.id
                ? `linear-gradient(180deg, ${t.color}26 0%, rgba(17,20,16,0.96) 100%)`
                : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(14,18,15,0.94) 100%)',
              color: activeToolId === t.id ? '#f7f0de' : '#8f9684',
              transition: 'all 0.18s',
              letterSpacing: '0.08em',
              boxShadow: activeToolId === t.id ? `0 0 0 1px ${t.color}22 inset` : 'none',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(180deg, ${t.color}30 0%, rgba(17,20,16,0.1) 100%)`,
                border: `1px solid ${activeToolId === t.id ? `${t.color}66` : 'rgba(255,255,255,0.08)'}`,
                color: activeToolId === t.id ? '#fff5dc' : t.color,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {t.badge}
            </span>
            <span style={{ color: activeToolId === t.id ? t.color : '#c7ccb9' }}>{t.name}</span>
            <span style={{ color: 'rgba(237,227,197,0.52)', fontSize: 9, letterSpacing: '0.04em', textTransform: 'none' }}>
              {t.icon}
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 14, padding: '12px 12px 10px', borderRadius: 13, background: 'rgba(28,34,19,0.35)', border: '1px solid rgba(196,146,40,0.12)' }}>
        <div style={{ fontSize: 8.5, color: 'rgba(196,146,40,0.60)', marginBottom: 8, letterSpacing: '0.24em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
          Brush Coverage
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#D4C9A8', fontWeight: 600 }}>Radius</span>
          <span style={{ fontSize: 11, color: '#E8A820', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{brushSize}px</span>
        </div>
        <input
          type="range"
          min={10}
          max={150}
          value={brushSize}
          onChange={e => onBrushSize(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#C49228' }}
        />
      </div>

    </>
  )
}

export default React.memo(ToolGrid)
