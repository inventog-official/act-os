'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Atmosphere } from './Atmosphere'

interface ChaosFragment {
  id: string
  label: string
  type: string
  initialPos: { x: number; y: number; rot: number }
  alignedPos: { x: number; y: number }
  meta: string
}

const FRAGMENTS: ChaosFragment[] = [
  {
    id: 'doc-1',
    label: 'CONTRACT_V4_FINAL.PDF',
    type: 'DOCUMENT',
    initialPos: { x: -38, y: -28, rot: -14 },
    alignedPos: { x: -24, y: -16 },
    meta: 'LEGAL // UNBOUND',
  },
  {
    id: 'task-1',
    label: 'DEPLOY PROD INFRASTRUCTURE',
    type: 'TASK',
    initialPos: { x: 36, y: -34, rot: 18 },
    alignedPos: { x: 24, y: -16 },
    meta: 'ENG // BACKLOG',
  },
  {
    id: 'data-1',
    label: 'MRR_PROJECTION_2026',
    type: 'DATA',
    initialPos: { x: -44, y: 18, rot: 22 },
    alignedPos: { x: -24, y: 16 },
    meta: 'FINANCE // SHEET 4',
  },
  {
    id: 'inv-1',
    label: 'SKU-88402 (OUT OF STOCK)',
    type: 'INVENTORY',
    initialPos: { x: 42, y: 22, rot: -16 },
    alignedPos: { x: 24, y: 16 },
    meta: 'WAREHOUSE 02 // ISOLATED',
  },
  {
    id: 'flow-1',
    label: 'CLIENT ONBOARDING FLOW',
    type: 'WORKFLOW',
    initialPos: { x: 0, y: -45, rot: -8 },
    alignedPos: { x: 0, y: -26 },
    meta: 'MANUAL EMAIL THREAD',
  },
  {
    id: 'ppl-1',
    label: 'LEAD ARCHITECT // 12 TICKETS',
    type: 'PEOPLE',
    initialPos: { x: 0, y: 44, rot: 12 },
    alignedPos: { x: 0, y: 26 },
    meta: 'CAPACITY OVERLOAD',
  },
]

export function ChaosSection() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [convergence, setConvergence] = useState(0) // 0: scattered, 1: converged

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // Progress from 0 to 1 as it scrolls through viewport
      const totalDist = windowHeight + rect.height
      const currentPos = windowHeight - rect.top
      const p = Math.max(0, Math.min(1, currentPos / (totalDist * 0.75)))
      setConvergence(p)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={containerRef}
      id="chaos"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden"
    >
      {/* Background Atmosphere - gradually appears as convergence increases */}
      <Atmosphere variant="cosmic" intensity={0.4 + convergence * 0.5} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          01 — THE SYSTEMIC PROBLEM
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Your business is already a system.
        </h2>
        <p className="text-xl md:text-2xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          It’s just scattered across too many isolated places.
        </p>
      </div>

      {/* Floating 3D Monochrome Fragments Grid / Convergence Canvas */}
      <div className="lp-container relative z-10 w-full max-w-5xl mx-auto min-h-[460px] flex items-center justify-center">
        {/* Central Attraction Core Ring */}
        <div
          className="absolute w-36 h-36 rounded-full border border-white/20 flex items-center justify-center transition-all duration-700 pointer-events-none"
          style={{
            transform: `scale(${0.6 + convergence * 0.5})`,
            opacity: convergence > 0.1 ? convergence : 0.05,
            boxShadow: `0 0 ${40 * convergence}px rgba(255, 255, 255, 0.1)`,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <div className="absolute font-mono text-[9px] text-white/50 tracking-widest uppercase">
            {convergence > 0.7 ? 'ALIGNED' : 'SYNCHRONIZING'}
          </div>
        </div>

        {/* Floating Fragments (Calculated 3D transforms based on convergence) */}
        <div className="relative w-full h-[400px] flex items-center justify-center">
          {FRAGMENTS.map((frag) => {
            const currentX = frag.initialPos.x * (1 - convergence) + frag.alignedPos.x * convergence
            const currentY = frag.initialPos.y * (1 - convergence) + frag.alignedPos.y * convergence
            const currentRot = frag.initialPos.rot * (1 - convergence)

            return (
              <div
                key={frag.id}
                className="absolute transition-transform duration-300 ease-out select-none"
                style={{
                  transform: `translate3d(${currentX * 6.5}px, ${currentY * 4.2}px, 0) rotate(${currentRot}deg)`,
                }}
              >
                <div
                  className={`px-4 py-3 rounded-lg border backdrop-blur-md transition-all duration-500 ${
                    convergence > 0.6
                      ? 'bg-white/[0.07] border-white/30 shadow-lg text-white'
                      : 'bg-neutral-950/80 border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase">
                      {frag.type}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        convergence > 0.6 ? 'bg-white' : 'bg-neutral-600'
                      }`}
                    />
                  </div>
                  <div className="font-mono text-xs font-semibold text-white tracking-wide">
                    {frag.label}
                  </div>
                  <div className="font-mono text-[9px] text-neutral-500 mt-1">
                    {frag.meta}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* State Switch Indicator */}
      <div className="lp-container relative z-10 mt-12 text-center">
        <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-md">
          <span
            className={`font-mono text-xs tracking-wider transition-colors duration-300 ${
              convergence < 0.5 ? 'text-white font-semibold' : 'text-neutral-600'
            }`}
          >
            01 SCATTERED
          </span>
          <span className="font-mono text-xs text-neutral-600">→</span>
          <span
            className={`font-mono text-xs tracking-wider transition-colors duration-300 ${
              convergence >= 0.5 ? 'text-white font-semibold' : 'text-neutral-600'
            }`}
          >
            02 CONNECTED
          </span>
        </div>
      </div>
    </section>
  )
}
