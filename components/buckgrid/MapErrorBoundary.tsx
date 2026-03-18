'use client'

import React, { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[BuckGrid] Map error:', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0a0d09', zIndex: 1,
          gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>🗺️</div>
          <div style={{ color: '#f0e8d4', fontSize: 15, fontWeight: 700 }}>Map failed to load</div>
          <div style={{ color: 'rgba(237,227,197,0.5)', fontSize: 12, maxWidth: 300, textAlign: 'center' }}>
            {this.state.message || 'Refresh the page to try again.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{
              background: 'linear-gradient(135deg, #c4922a, #e8b84b)',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              color: '#17150f', fontWeight: 800, cursor: 'pointer', fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
