'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Check, Shield, Zap, ArrowRight } from 'lucide-react'

export function EcosystemSection() {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="lp-section bg-black" id="platform">
      {/* Subtle Violet / Blue Atmospheric Backdrop */}
      <GradientAtmosphere variant="violet" intensity="low" />

      <div className="relative z-10 lp-container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6">ONE SYSTEM</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal mt-3">
              Everything connected.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal max-w-2xl mx-auto">
              Every workflow, approval, revenue event, and inventory change synchronizes continuously across your organization.
            </p>
          </Reveal>
        </div>

        {/* Large Monochrome ACT OS Connected Architecture Interface */}
        <div
          ref={ref}
          className="relative mx-auto max-w-5xl rounded-2xl border border-white/[0.12] bg-[#0A0A0A] p-6 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(50px)',
          }}
        >
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-white/[0.08] gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#666666] font-medium">Platform Architecture</span>
              <p className="text-xl font-normal text-white mt-1">Unified Data & Operations Core</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[12px] text-white border border-white/20 bg-white/[0.04]">
                Enterprise Zero-Latency Mesh
              </span>
            </div>
          </div>

          {/* Connected Capabilities Grid - Pure Monochrome */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {/* Core Column 1: Operations */}
            <div className="p-6 rounded-xl bg-black border border-white/[0.08] flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-medium">01 · Operations</span>
                <h3 className="text-base font-normal text-white mt-2">Continuous Observability</h3>
                <p className="text-[13px] text-[#A1A1A1] mt-2 leading-relaxed font-normal">
                  Real-time status across active tasks, cross-department handoffs, and resource capacity.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-[12px] text-[#A1A1A1]">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white shrink-0" /> Unified Org Matrix
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white shrink-0" /> Automated SLA Tracking
                </li>
              </ul>
            </div>

            {/* Core Column 2: Automation */}
            <div className="p-6 rounded-xl bg-black border border-white/[0.08] flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-medium">02 · Automation</span>
                <h3 className="text-base font-normal text-white mt-2">Autonomous Workflows</h3>
                <p className="text-[13px] text-[#A1A1A1] mt-2 leading-relaxed font-normal">
                  Self-executing triggers and approval chains that move inventory, finance, and CRM forward.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-[12px] text-[#A1A1A1]">
                <li className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-white shrink-0" /> Zero-Code Pipeline Editor
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white shrink-0" /> Multi-Step Routing
                </li>
              </ul>
            </div>

            {/* Core Column 3: Intelligence */}
            <div className="p-6 rounded-xl bg-black border border-white/[0.08] flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#666666] font-medium">03 · Intelligence</span>
                <h3 className="text-base font-normal text-white mt-2">Contextual AI Assistant</h3>
                <p className="text-[13px] text-[#A1A1A1] mt-2 leading-relaxed font-normal">
                  Deep context over your whole business history to surface anomalies, priorities, and answers.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-[12px] text-[#A1A1A1]">
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-white shrink-0" /> Role-Based Security
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white shrink-0" /> Instant Natural Language Queries
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
