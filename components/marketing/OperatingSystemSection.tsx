'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Atmosphere } from './Atmosphere'
import { ActOSCore } from './ActOSCore'

const PASSING_SYSTEMS = [
  { step: '01', title: 'OPERATIONS', detail: 'Real-time deterministic execution across 100% of workflows.' },
  { step: '02', title: 'WORKFLOWS', detail: 'Autonomous event pipelines with sub-millisecond dispatch logic.' },
  { step: '03', title: 'INVENTORY', detail: 'Self-balancing supply chains and automated warehouse ledgers.' },
  { step: '04', title: 'PEOPLE', detail: 'Zero-friction squad coordination and continuous capacity mapping.' },
  { step: '05', title: 'INTELLIGENCE', detail: 'Enterprise context engine translating entropy into directives.' },
]

export function OperatingSystemSection() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - windowHeight || 1)))
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Current active passing system (0 to 4)
  const activeSysIdx = Math.min(4, Math.floor(scrollProgress * 5))
  const currentSys = PASSING_SYSTEMS[activeSysIdx]

  return (
    <section
      ref={containerRef}
      id="operating-system"
      className="relative min-h-[220vh] bg-black text-white"
    >
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between py-16 px-6 overflow-hidden">
        <Atmosphere variant="cosmic" intensity={0.75} />

        {/* Top Typography Phase Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <span className="lp-eyebrow mb-3 block">
            10 — THE OPERATING SYSTEM CLIMAX
          </span>
          <h2 className="lp-headline-massive tracking-tight text-balance">
            {scrollProgress < 0.33
              ? 'Everything connected.'
              : scrollProgress < 0.66
              ? 'Everything visible.'
              : 'Everything actionable.'}
          </h2>
        </div>

        {/* Central Immersive 3D ACT OS Core Visual */}
        <div className="relative z-10 w-full max-w-4xl h-[420px] flex items-center justify-center pointer-events-none">
          <ActOSCore
            className="w-full h-full"
            scrollProgress={scrollProgress}
            state={scrollProgress > 0.85 ? 'collapsed' : 'active'}
          />

          {/* Collapsing Brand Emblem Moment at End of Scroll */}
          {scrollProgress > 0.8 && (
            <div
              className="absolute flex flex-col items-center justify-center transition-all duration-700 pointer-events-auto"
              style={{
                transform: `scale(${Math.min(1, (scrollProgress - 0.8) * 5)})`,
                opacity: (scrollProgress - 0.8) * 5,
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl mb-4">
                <div className="w-6 h-6 rounded-md bg-black" />
              </div>
              <div className="font-mono text-xl font-bold tracking-widest text-white">
                ACT<span className="text-white/40">//</span>OS
              </div>
              <div className="font-mono text-[11px] text-neutral-400 mt-1 uppercase tracking-widest">
                THE BUSINESS OPERATING SYSTEM
              </div>
            </div>
          )}
        </div>

        {/* Bottom Orbiting System Milestone Bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="p-4 rounded-xl border border-white/15 bg-neutral-950/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-white text-black font-semibold text-[10px]">
                {currentSys.step}
              </span>
              <span className="text-white font-semibold tracking-wider">
                {currentSys.title}
              </span>
              <span className="hidden md:inline text-neutral-400 font-light font-sans text-xs">
                — {currentSys.detail}
              </span>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {PASSING_SYSTEMS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeSysIdx ? 'w-6 bg-white' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
