'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

const LOGO = (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2 L12 9" stroke="#C49228" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 9 L7.5 3.5" stroke="#C49228" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M12 9 L16.5 3.5" stroke="#C49228" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M12 9 L10 6" stroke="#C49228" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M12 9 L14 6" stroke="#C49228" strokeWidth="1.3" strokeLinecap="round"/>
    <rect x="4.5" y="13" width="15" height="9.5" rx="1.5" stroke="#C49228" strokeWidth="1.5" fill="none"/>
    <line x1="4.5" y1="17.5" x2="19.5" y2="17.5" stroke="#C49228" strokeWidth="0.9" opacity="0.55"/>
    <line x1="12" y1="13" x2="12" y2="22.5" stroke="#C49228" strokeWidth="0.9" opacity="0.55"/>
    <line x1="9" y1="13" x2="9" y2="22.5" stroke="#C49228" strokeWidth="0.7" opacity="0.3"/>
    <line x1="15" y1="13" x2="15" y2="22.5" stroke="#C49228" strokeWidth="0.7" opacity="0.3"/>
  </svg>
)

const FEATURES = [
  {
    num: '01',
    label: 'Satellite Precision',
    body: 'Drop a pin on any property in the country. Tony sees exactly what you see — real topography, real cover, real edges.',
  },
  {
    num: '02',
    label: 'Paint Your Ground',
    body: 'Draw food plots, bedding, water, stand locations, and trails directly on the map with purpose-built habitat tools.',
  },
  {
    num: '03',
    label: 'Expert Analysis',
    body: "Lock your boundary and Tony delivers a ranked habitat audit. No generic tips — every recommendation is specific to your ground.",
  },
]

const STATS = [
  { value: '< $0.03', label: 'Per analysis' },
  { value: '50–2000', label: 'Acres supported' },
  { value: 'GPT-4o', label: 'Vision model' },
  { value: '< 30s', label: 'Time to audit' },
]

export default function LandingPage() {
  const bodyRef = useRef(false)

  useEffect(() => {
    if (!bodyRef.current) {
      document.body.classList.add('landing')
      document.body.style.overflowY = 'auto'
      document.body.style.height = 'auto'
      bodyRef.current = true
    }
    return () => {
      document.body.classList.remove('landing')
      document.body.style.overflowY = ''
      document.body.style.height = ''
    }
  }, [])

  return (
    <div style={{ background: '#080A07', color: '#F0E8D4', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 48px 100px',
        }}
      >
        {/* Grid texture */}
        <div
          className="grid-texture"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        {/* Gold radial glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(196,146,40,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1040, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 96 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {LOGO}
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,146,40,0.7)', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                  BuckGrid
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F0E8D4', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  Pro
                </div>
              </div>
            </div>

            <Link
              href="/buckgrid"
              style={{
                background: 'linear-gradient(135deg, #C49228 0%, #E8A820 100%)',
                color: '#0D0E09',
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '10px 22px',
                borderRadius: 10,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Open App
            </Link>
          </div>

          {/* Headline block */}
          <div style={{ maxWidth: 780 }}>
            <div className="fade-up fade-up-1" style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C49228', fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>
              AI Habitat Consulting · Whitetail Ground Management
            </div>

            <h1 className="fade-up fade-up-2" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(52px, 7.5vw, 88px)',
              fontWeight: 700,
              lineHeight: 1.0,
              color: '#F0E8D4',
              margin: '0 0 28px',
              letterSpacing: '-0.01em',
            }}>
              Know Your<br />
              <em style={{ color: '#C49228', fontStyle: 'italic' }}>Ground.</em>
            </h1>

            <p className="fade-up fade-up-3" style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: 'rgba(212,201,168,0.72)',
              maxWidth: 560,
              margin: '0 0 44px',
            }}>
              Tony analyzes your satellite map and tells you exactly where to put your food plot, stand, and water source. Like having a wildlife biologist on call — without the $300/hr bill.
            </p>

            <div className="fade-up fade-up-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/buckgrid"
                style={{
                  background: 'linear-gradient(135deg, #C49228 0%, #E8A820 55%, #C49228 100%)',
                  color: '#0D0E09',
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  padding: '16px 36px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  display: 'inline-block',
                  boxShadow: '0 16px 48px rgba(196,146,40,0.30)',
                }}
              >
                Analyze My Land
              </Link>
              <span style={{ fontSize: 12, color: 'rgba(212,201,168,0.45)', letterSpacing: '0.04em' }}>
                No account required. Free to start.
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="fade-up fade-up-5" style={{
            display: 'flex',
            gap: 0,
            marginTop: 96,
            borderTop: '1px solid rgba(196,146,40,0.12)',
            paddingTop: 40,
            flexWrap: 'wrap',
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                flex: '1 0 140px',
                paddingRight: 40,
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#E8A820', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(212,201,168,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{
        padding: '96px 48px',
        borderTop: '1px solid rgba(196,146,40,0.10)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C49228', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
            How It Works
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 700,
            color: '#F0E8D4',
            maxWidth: 520,
            lineHeight: 1.1,
            marginBottom: 72,
          }}>
            Four steps. One expert plan.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: '40px 36px',
                background: i % 2 === 0
                  ? 'rgba(17,20,9,0.60)'
                  : 'rgba(28,34,19,0.40)',
                borderTop: '1px solid rgba(196,146,40,0.12)',
                borderLeft: i === 0 ? '1px solid rgba(196,146,40,0.12)' : 'none',
                borderRight: '1px solid rgba(196,146,40,0.12)',
              }}>
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(196,146,40,0.5)', letterSpacing: '0.2em', marginBottom: 20 }}>
                  {f.num}
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#F0E8D4',
                  marginBottom: 14,
                  lineHeight: 1.2,
                }}>
                  {f.label}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(212,201,168,0.62)', lineHeight: 1.65 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TONY INTRO ── */}
      <section style={{
        padding: '96px 48px',
        borderTop: '1px solid rgba(196,146,40,0.10)',
        background: 'linear-gradient(180deg, rgba(17,20,9,0.6) 0%, rgba(8,10,7,0) 100%)',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C49228', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
              Meet Tony
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(30px, 3.5vw, 44px)',
              fontWeight: 700,
              color: '#F0E8D4',
              lineHeight: 1.1,
              marginBottom: 24,
            }}>
              Your land's AI consultant.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(212,201,168,0.65)', lineHeight: 1.7, marginBottom: 20 }}>
              Tony Greer is a GPT-4o vision model trained on whitetail habitat management. He reads terrain, identifies pinch points, pressure paths, and bedding-to-food transitions — the same things a $300/hr consultant looks for.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(212,201,168,0.65)', lineHeight: 1.7, marginBottom: 36 }}>
              The difference: Tony is available 24/7 and costs less than a box of broadheads per month.
            </p>
            <Link
              href="/buckgrid"
              style={{
                display: 'inline-block',
                border: '1px solid rgba(196,146,40,0.40)',
                color: '#E8A820',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '13px 28px',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              Try Tony Free
            </Link>
          </div>

          {/* Tony chat preview card */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(17,20,9,0.96) 0%, rgba(8,10,7,0.98) 100%)',
            border: '1px solid rgba(196,146,40,0.20)',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.50)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(196,146,40,0.10)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #1C2213, #263018)',
                border: '1px solid rgba(196,146,40,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2 L12 9" stroke="#C49228" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 9 L7.5 3.5" stroke="#C49228" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M12 9 L16.5 3.5" stroke="#C49228" strokeWidth="1.4" strokeLinecap="round"/>
                  <rect x="4.5" y="13" width="15" height="9.5" rx="1.5" stroke="#C49228" strokeWidth="1.4" fill="none"/>
                  <line x1="4.5" y1="17.5" x2="19.5" y2="17.5" stroke="#C49228" strokeWidth="0.9" opacity="0.5"/>
                  <line x1="12" y1="13" x2="12" y2="22.5" stroke="#C49228" strokeWidth="0.9" opacity="0.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F0E8D4', letterSpacing: '0.04em' }}>Tony Greer</div>
                <div style={{ fontSize: 10, color: 'rgba(196,146,40,0.70)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>AI Habitat Consultant</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#84cc16', boxShadow: '0 0 6px rgba(132,204,22,0.8)' }} />
                <span style={{ fontSize: 9, color: 'rgba(132,204,22,0.7)', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>LIVE</span>
              </div>
            </div>

            {/* Mock chat bubbles */}
            {[
              { role: 'tony', text: "Property locked at 180 acres. I can see 2 food plots, 1 bedding area, and a creek corridor. Give me your north food plot — that's your problem." },
              { role: 'user', text: "What's wrong with it?" },
              { role: 'tony', text: "You've got 400 yards of open approach with no cover transition. Deer won't enter before dark. Push the plot 60 yards east into that timber finger and add a soft edge. Stand goes in the hardwoods above it, wind-adjusted NW." },
            ].map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user'
                    ? 'rgba(196,146,40,0.18)'
                    : 'rgba(38,48,24,0.60)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(196,146,40,0.25)'
                    : '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: msg.role === 'user' ? '#E8A820' : 'rgba(212,201,168,0.85)',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '96px 48px 120px',
        borderTop: '1px solid rgba(196,146,40,0.10)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(196,146,40,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="grid-texture" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C49228', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
            No account required
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 700,
            color: '#F0E8D4',
            lineHeight: 1.05,
            marginBottom: 20,
          }}>
            Your land deserves a plan.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(212,201,168,0.6)', maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.6 }}>
            Search your property, paint your habitat, and get Tony's expert audit in under 60 seconds.
          </p>
          <Link
            href="/buckgrid"
            style={{
              background: 'linear-gradient(135deg, #C49228 0%, #E8A820 55%, #C49228 100%)',
              color: '#0D0E09',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              padding: '18px 48px',
              borderRadius: 16,
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 20px 60px rgba(196,146,40,0.35)',
            }}
          >
            Analyze My Land — Free
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid rgba(196,146,40,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L12 9" stroke="#C49228" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 9 L7.5 3.5" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 9 L16.5 3.5" stroke="#C49228" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="4.5" y="13" width="15" height="9.5" rx="1.5" stroke="#C49228" strokeWidth="1.4" fill="none"/>
            <line x1="4.5" y1="17.5" x2="19.5" y2="17.5" stroke="#C49228" strokeWidth="0.9" opacity="0.5"/>
            <line x1="12" y1="13" x2="12" y2="22.5" stroke="#C49228" strokeWidth="0.9" opacity="0.5"/>
          </svg>
          <span style={{ fontSize: 11, color: 'rgba(212,201,168,0.45)', letterSpacing: '0.12em' }}>
            BuckGrid Pro — Know Your Ground.
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(212,201,168,0.28)', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>
          © {new Date().getFullYear()} Neuradex AI
        </span>
      </footer>

    </div>
  )
}
