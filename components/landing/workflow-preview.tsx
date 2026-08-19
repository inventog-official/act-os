'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Zap, GitBranch, CheckCircle2, ArrowRight } from 'lucide-react'

const workflowSteps = [
  {
    step: 'TRIGGER',
    icon: Zap,
    title: 'Low Stock Threshold Reached',
    detail: 'Inventory levels drop below predefined safety margin for SKU-409.',
  },
  {
    step: 'CONDITION',
    icon: GitBranch,
    title: 'Verify Vendor Capacity & Price',
    detail: 'System matches preferred supplier SLA and ensures pricing conforms to PO budget.',
  },
  {
    step: 'ACTION',
    icon: CheckCircle2,
    title: 'Draft Purchase Order & Route Approval',
    detail: 'PO-2026-089 generated automatically with 1-click executive authorization.',
  },
]

export function WorkflowPreview() {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="lp-section bg-black" id="workflows">
      {/* Soft Orange -> Pink -> Violet Gradient Atmosphere */}
      <GradientAtmosphere variant="sunset" intensity="medium" />

      <div className="relative z-10 lp-container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6">WORKFLOWS</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal mt-3">
              Turn repetitive work into systems.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal max-w-2xl mx-auto">
              Build autonomous operational flows that trigger, validate, and execute across your teams without manual friction.
            </p>
          </Reveal>
        </div>

        {/* Workflow Diagram - Clean Monochrome */}
        <div ref={ref} className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.step}
                className="relative z-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${idx * 150}ms`,
                }}
              >
                <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.12] bg-[#0A0A0A] shadow-[0_20px_60px_rgba(0,0,0,0.8)] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black text-white">
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-mono text-[#666666] tracking-wider">
                        0{idx + 1}
                      </span>
                    </div>

                    <span className="text-[11px] uppercase tracking-wider text-[#A1A1A1] font-medium">
                      {step.step}
                    </span>
                    <h3 className="text-base font-normal text-white mt-1.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-[#A1A1A1] mt-3 leading-relaxed font-normal">
                      {step.detail}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center gap-2 text-[12px] text-[#666666]">
                    <span>Autonomous Execution</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
