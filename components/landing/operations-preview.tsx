'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Activity, Clock, Check, ArrowRight } from 'lucide-react'

export function OperationsPreview() {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="lp-section bg-[#050505]" id="operations">
      {/* Soft Cyan -> Blue -> Violet Gradient Atmosphere */}
      <GradientAtmosphere variant="aurora" intensity="low" />

      <div className="relative z-10 lp-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5">
            <Reveal variant="left">
              <span className="lp-eyebrow mb-4 sm:mb-6">OPERATIONS</span>
              <h2 className="lp-headline text-white font-normal mt-3">
                See what’s happening across your business.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal">
                A real-time operational cockpit that gives teams and leaders a single source of truth without noise or fragmentation.
              </p>
              <div className="mt-8">
                <a
                  href="#platform"
                  className="inline-flex items-center gap-2 text-[14px] text-white hover:text-[#A1A1A1] transition-colors"
                >
                  Explore operational telemetry
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right Dashboard Mockup - Monochrome with Slide Reveal */}
          <div
            ref={ref}
            className="lg:col-span-7 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateX(0)' : 'translateX(40px)',
            }}
          >
            <div className="rounded-2xl border border-white/[0.12] bg-[#0A0A0A] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[13px] font-normal text-white">System Telemetry Matrix</span>
                </div>
                <span className="text-[11px] text-[#666666] font-mono">NODE 01-PROD</span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="p-4 rounded-xl bg-black border border-white/[0.06]">
                  <span className="text-[11px] uppercase tracking-wider text-[#666666]">System Uptime</span>
                  <div className="text-2xl font-normal text-white mt-1">99.98%</div>
                  <span className="text-[11px] text-[#A1A1A1] mt-1 block">Past 90 days</span>
                </div>
                <div className="p-4 rounded-xl bg-black border border-white/[0.06]">
                  <span className="text-[11px] uppercase tracking-wider text-[#666666]">Active Tasks</span>
                  <div className="text-2xl font-normal text-white mt-1">128 / 142</div>
                  <span className="text-[11px] text-[#A1A1A1] mt-1 block">90% completed on time</span>
                </div>
              </div>

              {/* Department Velocity Rows */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] uppercase tracking-wider text-[#666666] block mb-2 font-medium">
                  Operational Throughput
                </span>
                {[
                  { dept: 'Core Engineering', rate: '94%', load: '18 active issues' },
                  { dept: 'Global Logistics', rate: '98%', load: '24 shipments cleared' },
                  { dept: 'Finance & Invoicing', rate: '100%', load: '0 overdue accounts' },
                ].map((row) => (
                  <div
                    key={row.dept}
                    className="flex items-center justify-between p-3 rounded-lg bg-black border border-white/[0.04] text-[12px]"
                  >
                    <span className="text-white font-normal">{row.dept}</span>
                    <div className="flex items-center gap-4 text-[#A1A1A1]">
                      <span>{row.load}</span>
                      <span className="font-mono text-white px-2 py-0.5 rounded bg-white/[0.06]">{row.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
