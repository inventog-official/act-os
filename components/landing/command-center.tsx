'use client'

import { Reveal } from '@/components/landing/reveal'
import { useEffect, useRef, useState } from 'react'
import {
  Search,
  DollarSign,
  Activity,
  Box,
  Users,
  ContactRound,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

const query = "What's happening across my business?"

const categories = [
  {
    label: 'Revenue',
    icon: DollarSign,
    insight: '$284K this month — on track for best quarter',
    status: 'positive',
  },
  {
    label: 'Operations',
    icon: Activity,
    insight: '94.2% efficiency — 2 alerts require attention',
    status: 'warning',
  },
  {
    label: 'Inventory',
    icon: Box,
    insight: '3 items below reorder threshold',
    status: 'warning',
  },
  {
    label: 'People',
    icon: Users,
    insight: '48 active — team velocity up 12%',
    status: 'positive',
  },
  {
    label: 'Customers',
    icon: ContactRound,
    insight: '7 new leads this week — 2 in negotiation',
    status: 'positive',
  },
]

export function CommandCenter() {
  const [typedText, setTypedText] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setTypedText(query)
      setShowResults(true)
      return
    }
    let i = 0
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setTypedText(query.slice(0, i))
        if (i >= query.length) {
          clearInterval(interval)
          setTimeout(() => setShowResults(true), 500)
        }
      }, 30)
      return () => clearInterval(interval)
    }, 600)
    return () => clearTimeout(startDelay)
  }, [isVisible])

  return (
    <section className="lp-section" style={{ background: 'var(--lp-bg)' }}>
      {/* Background glow */}
      <div className="lp-glow-subtle" style={{ width: '700px', height: '700px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />

      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center mb-12">
            <span className="lp-eyebrow">Command Center</span>
            <h2 className="lp-headline-display mt-4">
              Ask your business <span className="lp-text-gradient">anything.</span>
            </h2>
          </div>
        </Reveal>

        <div ref={ref} className="relative mx-auto max-w-2xl">
          <div
            className="rounded-2xl border border-[var(--lp-border-accent)] bg-[var(--lp-bg-secondary)] shadow-2xl shadow-black/50 overflow-hidden"
            style={{
              boxShadow: showResults
                ? '0 0 80px rgba(22,131,255,0.1), 0 25px 60px rgba(0,0,0,0.5)'
                : '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--lp-border)]">
              <Search className="h-5 w-5 text-[var(--lp-text-muted)]" />
              <div className="flex-1">
                <p className="text-[15px] text-[var(--lp-text)]">
                  {typedText}
                  {typedText.length < query.length && isVisible && (
                    <span
                      className="inline-block w-0.5 h-5 bg-[var(--lp-accent)] ml-0.5 align-middle"
                      style={{ animation: 'lp-typing-cursor 0.8s ease-in-out infinite' }}
                    />
                  )}
                </p>
              </div>
            </div>

            {/* Results */}
            {showResults && (
              <div className="p-5 space-y-3">
                {/* AI summary */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]"
                  style={{ animation: 'lp-slide-in-results 0.4s ease-out both' }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border" style={{ background: 'rgba(22,131,255,0.1)', borderColor: 'rgba(22,131,255,0.2)' }}>
                    <Sparkles className="h-3.5 w-3.5 text-[var(--lp-accent)]" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--lp-text-secondary)]">
                    Your business is performing well overall. Revenue is trending 18% above last quarter. 
                    Two operational areas need attention, and 3 inventory items are approaching reorder thresholds.
                  </p>
                </div>

                {/* Category cards */}
                {categories.map((cat, i) => (
                  <div
                    key={cat.label}
                    className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] transition-all hover:border-[var(--lp-border-accent)]"
                    style={{ animation: `lp-slide-in-results 0.3s ease-out ${(i + 1) * 100}ms both` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--lp-bg)] border border-[var(--lp-border)]">
                      <cat.icon className="h-4 w-4 text-[var(--lp-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold text-[var(--lp-text)]">{cat.label}</span>
                      <p className="text-[11px] text-[var(--lp-text-muted)] truncate">{cat.insight}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full shrink-0 ${cat.status === 'positive' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
