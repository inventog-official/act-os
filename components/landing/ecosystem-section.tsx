'use client'

import { Reveal } from '@/components/landing/reveal'
import { useEffect, useRef, useState } from 'react'

const nodes = [
  { label: 'Operations', angle: 0 },
  { label: 'People', angle: 45 },
  { label: 'Customers', angle: 90 },
  { label: 'Projects', angle: 135 },
  { label: 'Inventory', angle: 180 },
  { label: 'Finance', angle: 225 },
  { label: 'Automation', angle: 270 },
  { label: 'Intelligence', angle: 315 },
]

export function EcosystemSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const radius = 180

  return (
    <section className="lp-section" style={{ background: 'var(--lp-bg-secondary)' }} id="platform">
      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center mb-20">
            <span className="lp-eyebrow">Platform</span>
            <h2 className="lp-headline mt-4">
              One system. <span className="lp-text-gradient">Every moving part.</span>
            </h2>
          </div>
        </Reveal>

        <div ref={ref} className="relative mx-auto" style={{ width: '100%', maxWidth: '500px', aspectRatio: '1/1' }}>
          {/* Orbit ring */}
          <div className="absolute inset-[15%] rounded-full border border-[var(--lp-border)]" />
          <div className="absolute inset-[30%] rounded-full border border-[var(--lp-border)] opacity-50" />

          {/* Center node */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--lp-accent)] shadow-xl transition-all duration-700"
              style={{
                boxShadow: isVisible ? '0 0 60px rgba(22,131,255,0.3), 0 0 120px rgba(22,131,255,0.1)' : 'none',
              }}
            >
              <span className="text-sm font-bold text-white tracking-tight">ACT OS</span>
            </div>
          </div>

          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
            {nodes.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180
              const nx = 250 + radius * Math.cos(rad)
              const ny = 250 + radius * Math.sin(rad)
              return (
                <line
                  key={i}
                  x1="250"
                  y1="250"
                  x2={nx}
                  y2={ny}
                  stroke="var(--lp-accent)"
                  strokeWidth="1"
                  strokeOpacity={isVisible ? '0.25' : '0'}
                  strokeDasharray="4 4"
                  className="transition-all duration-1000"
                  style={{
                    animation: isVisible ? 'lp-dash-flow 2s linear infinite' : 'none',
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              )
            })}
          </svg>

          {/* Outer nodes */}
          {nodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180
            const x = 50 + (radius / 250) * 50 * Math.cos(rad)
            const y = 50 + (radius / 250) * 50 * Math.sin(rad)
            return (
              <div
                key={node.label}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  opacity: isVisible ? 1 : 0,
                  transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0.8})`,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className="px-3.5 py-2 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] shadow-md shadow-black/20 whitespace-nowrap transition-all hover:border-[var(--lp-border-accent)] hover:shadow-[0_0_20px_rgba(22,131,255,0.1)]">
                  <span className="text-[12px] font-medium text-[var(--lp-text-secondary)]">{node.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
