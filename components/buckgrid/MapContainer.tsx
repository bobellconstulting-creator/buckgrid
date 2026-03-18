'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { useMapDrawing, type LayerSummary, type LockResult } from '@/lib/buckgrid/useMapDrawing'
import type { TonyFeature } from '@/lib/parse-tony-response'
import 'leaflet/dist/leaflet.css'

export interface MapContainerHandle {
  lockBoundary: () => Promise<LockResult>
  wipeAll: () => void
  getCaptureElement: () => HTMLDivElement | null
  flyTo: (center: [number, number], zoom: number) => void
  fitBounds: (bounds: { south: number; west: number; north: number; east: number }) => void
  getSpatialContext: () => {
    acreage: number
    boundaryGeoJSON: any | null
    mapBounds: { sw: [number, number]; ne: [number, number] } | null
    layers: any[]
  }
}

interface Props {
  activeTool: any
  brushSize: number
  tonyFeatures: TonyFeature[]
}

const MapContainer = forwardRef<MapContainerHandle, Props>(({ activeTool, brushSize, tonyFeatures }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { api } = useMapDrawing({ containerRef, activeTool: activeTool.id, brushSize, tonyFeatures })

  useImperativeHandle(ref, () => ({
    lockBoundary: () => {
      const result = api.lockAndBake()
      return Promise.resolve(result as any)
    },
    wipeAll: () => api.clearAll(),
    getCaptureElement: () => containerRef.current,
    flyTo: (center, zoom) => api.flyTo(center, zoom),
    fitBounds: (bounds) => api.fitBounds(bounds),
    getSpatialContext: () => api.getSpatialContext(),
  }))

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
})

MapContainer.displayName = 'MapContainer'
export default MapContainer
