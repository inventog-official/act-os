'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Search, ArrowRight } from 'lucide-react'

const queryText = 'What needs my attention today?'

const insights = [
  {
    category: 'OPERATIONS',
    headline: 'Engineering SLA variance detected',
    detail: 'Sprint 24 velocity dipped 4% due to API dependency hold. Resolved 2 hours ago.',
  },
  {
    category: 'INVENTORY',
    headline: '3 core hardware SKUs below safety stock',
    detail: 'Automated purchase request PR-2026-089 prepared for vendor TechDistro.',
  },
  {
    category: 'TASKS',
    headline: '4 executive sign-offs pending review',
    detail: '2 enterprise quotes ($48k, $120k) and 2 contractor agreements.',
  },
  {
    category: 'REVENUE',
    headline: 'Monthly recurring revenue tracking +12.4%',
    detail: 'Enterprise expansion on schedule to surpass Q3 milestone by $34,000.',
  },
]

export function CommandCenter() {
  const [typed, setTyped] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          setInView(true)
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setTyped(queryText)
      setShowResults(true)
      return
    }

    let i = 0
    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setTyped(queryText.slice(0, i))
        if (i >= queryText.length) {
          clearInterval(interval)
          setTimeout(() => setShowResults(true), 400)
        }
      }, 35)
      return () => clearInterval(interval)
    }, 500)

    return () => clearTimeout(delayTimer)
  }, [inView])

  return (
    <section className="lp-section bg-black" id="intelligence">
      {/* Soft Purple -> Pink -> Orange Atmospheric Gradient */}
      <GradientAtmosphere variant="sunset" intensity="medium" />

      <div className="relative z-10 lp-container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6">INTELLIGENCE</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal mt-3">
              Ask your business anything.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal max-w-2xl mx-auto">
              Natural language intelligence that analyzes your live cross-department data and surfaces critical business context.
            </p>
          </Reveal>
        </div>

        {/* Monochrome Command Center */}
        <div ref={ref} className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-white/[0.12] bg-[#0A0A0A] shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Input Bar */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.08] bg-black/60">
              <Search className="h-5 w-5 text-[#666666] shrink-0" />
              <div className="flex-1 text-[15px] font-normal text-white flex items-center">
                {typed.length === 0 && !inView && (
                  <span className="text-[#666666]">Ask ACT OS anything…</span>
                )}
                <span>{typed}</span>
                {typed.length < queryText.length && inView && (
                  <span className="inline-block w-0.5 h-5 bg-white ml-1 animate-[lp-blink_0.8s_ease-in-out_infinite]" />
                )}
              </div>
            </div>

            {/* Staggered Intelligence Results */}
            <div className="p-6 sm:p-8 space-y-4">
              {insights.map((item, idx) => (
                <div
                  key={item.category}
                  className="p-5 rounded-xl bg-black border border-white/[0.06] transition-all duration-500 hover:border-white/[0.2]"
                  style={{
                    opacity: showResults ? 1 : 0,
                    transform: showResults ? 'translateY(0)' : 'translateY(16px)',
                    transitionDelay: `${idx * 90}ms`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium tracking-wider text-[#666666] uppercase">
                      {item.category}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#666666]" />
                  </div>
                  <h4 className="text-[14px] font-normal text-white">{item.headline}</h4>
                  <p className="text-[12px] text-[#A1A1A1] mt-1 leading-relaxed font-normal">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
