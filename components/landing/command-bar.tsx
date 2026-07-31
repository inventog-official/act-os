'use client'

import { useEffect, useState, useRef } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { Search, AlertTriangle, Clock, CheckCircle2, Activity } from 'lucide-react'

const results = [
  { icon: AlertTriangle, label: '3 inventory alerts', color: 'text-amber-400', delay: 0 },
  { icon: CheckCircle2, label: '2 pending approvals', color: 'text-[var(--lp-accent)]', delay: 150 },
  { icon: Clock, label: '4 overdue tasks', color: 'text-red-400', delay: 300 },
  { icon: Activity, label: '1 operational anomaly', color: 'text-purple-400', delay: 450 },
]

const query = 'Show me everything that needs my attention.'

export function CommandBar() {
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
      { threshold: 0.3 }
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
          setTimeout(() => setShowResults(true), 400)
        }
      }, 35)
      return () => clearInterval(interval)
    }, 800)
    return () => clearTimeout(startDelay)
  }, [isVisible])

  return (
    <Reveal variant="up" delay={700}>
      <div ref={ref} className="relative mx-auto max-w-xl mt-8 px-4 sm:px-0">
        <div className="rounded-xl border border-[var(--lp-border-accent)] bg-[var(--lp-surface)] shadow-xl shadow-black/40 overflow-hidden" style={{ animation: isVisible ? 'lp-counter-glow 4s ease-in-out infinite' : 'none' }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--lp-border)]">
            <Search className="h-3.5 w-3.5 text-[var(--lp-text-muted)]" />
            <span className="text-[12px] text-[var(--lp-text-muted)]">⌘ Search ACT OS</span>
          </div>

          {/* Query */}
          <div className="px-4 py-3 border-b border-[var(--lp-border)]">
            <p className="text-sm text-[var(--lp-text)]">
              {typedText}
              {typedText.length < query.length && (
                <span className="inline-block w-0.5 h-4 bg-[var(--lp-accent)] ml-0.5 align-middle" style={{ animation: 'lp-typing-cursor 0.8s ease-in-out infinite' }} />
              )}
            </p>
          </div>

          {/* Results */}
          {showResults && (
            <div className="px-4 py-3 space-y-2">
              {results.map((r, i) => (
                <div
                  key={r.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--lp-bg)] border border-[var(--lp-border)] transition-colors hover:border-[var(--lp-border-accent)]"
                  style={{ animation: `lp-slide-in-results 0.3s ease-out ${r.delay}ms both` }}
                >
                  <r.icon className={`h-4 w-4 shrink-0 ${r.color}`} />
                  <span className="text-[13px] text-[var(--lp-text-secondary)]">{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  )
}
