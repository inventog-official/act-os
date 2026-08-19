'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'

const disconnectedTools = [
  { label: 'CRM', initialX: -140, initialY: -50 },
  { label: 'SPREADSHEETS', initialX: 150, initialY: -70 },
  { label: 'TASKS', initialX: -180, initialY: 60 },
  { label: 'INVENTORY', initialX: 160, initialY: 50 },
  { label: 'ANALYTICS', initialX: 0, initialY: -110 },
]

export function ProblemSection() {
  const [inView, setInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="lp-section bg-black" id="solutions">
      {/* Expanding sunset/violet gradient behind the convergence */}
      <GradientAtmosphere variant="sunset" intensity="medium" />

      <div className="relative z-10 lp-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6">THE PROBLEM</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal mt-3">
              Your business shouldn’t live across disconnected tools.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal max-w-2xl mx-auto">
              Disconnected tools create fragmented information and unnecessary complexity.
            </p>
          </Reveal>
        </div>

        {/* Interactive Convergence Visual */}
        <div
          ref={containerRef}
          className="relative mx-auto max-w-2xl h-[360px] sm:h-[420px] flex items-center justify-center"
        >
          {/* Disconnected Labels Moving in */}
          {disconnectedTools.map((tool) => (
            <div
              key={tool.label}
              className="absolute transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: inView
                  ? 'translate(0px, 0px) scale(0.7)'
                  : `translate(${tool.initialX}px, ${tool.initialY}px) scale(1)`,
                opacity: inView ? 0 : 1,
              }}
            >
              <div className="px-5 py-2.5 rounded-full border border-white/20 bg-black/80 backdrop-blur-md text-[11px] sm:text-[12px] font-medium tracking-[0.14em] text-white">
                {tool.label}
              </div>
            </div>
          ))}

          {/* Central ACT OS Convergence Node */}
          <div
            className="transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col items-center justify-center text-center"
            style={{
              opacity: inView ? 1 : 0.2,
              transform: inView ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-white/30 bg-[#0A0A0A] shadow-[0_0_60px_rgba(255,255,255,0.1)] flex items-center justify-center mb-4">
              <span className="text-xl sm:text-2xl font-normal text-white tracking-tight">ACT OS</span>
            </div>
            <span className="text-[12px] text-[#A1A1A1] tracking-wider uppercase">Unified Business Intelligence</span>
          </div>
        </div>
      </div>
    </section>
  )
}
