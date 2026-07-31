'use client'

import { Reveal } from '@/components/landing/reveal'
import { useEffect, useRef, useState } from 'react'

const stages = [
  {
    title: 'START',
    description: 'Core operations',
    items: ['Tasks', 'Teams', 'Projects'],
  },
  {
    title: 'SCALE',
    description: 'Growth tools',
    items: ['Automation', 'Inventory', 'CRM', 'Analytics'],
  },
  {
    title: 'OPERATE',
    description: 'Full control',
    items: ['Intelligence', 'Advanced Workflows', 'Executive Control'],
  },
]

export function ScaleSection() {
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

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="lp-eyebrow">Scale</span>
            <h2 className="lp-headline mt-4">
              Built for where your business <span className="lp-text-gradient">is going.</span>
            </h2>
          </div>
        </Reveal>

        <div ref={ref} className="relative max-w-4xl mx-auto">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0">
            <div
              className="h-full transition-all duration-1000"
              style={{
                background: isVisible
                  ? 'linear-gradient(to right, transparent, var(--lp-accent), transparent)'
                  : 'transparent',
                opacity: isVisible ? 0.3 : 0,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {stages.map((stage, i) => (
              <div
                key={stage.title}
                className="text-center transition-all duration-700"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${i * 200}ms`,
                }}
              >
                {/* Stage indicator */}
                <div className="flex justify-center mb-6">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-700"
                    style={{
                      background: i === 2 ? 'var(--lp-accent)' : 'var(--lp-surface)',
                      borderColor: i === 2 ? 'var(--lp-accent)' : 'var(--lp-border)',
                      boxShadow: i === 2 && isVisible ? '0 0 40px rgba(22,131,255,0.2)' : 'none',
                    }}
                  >
                    <span className={`text-xs font-bold tracking-wider ${i === 2 ? 'text-white' : 'text-[var(--lp-text-muted)]'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold tracking-wider text-[var(--lp-text)] mb-1">{stage.title}</h3>
                <p className="text-[13px] text-[var(--lp-text-muted)] mb-4">{stage.description}</p>

                <div className="space-y-2">
                  {stage.items.map((item) => (
                    <div
                      key={item}
                      className="px-3 py-2 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[12px] text-[var(--lp-text-secondary)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
