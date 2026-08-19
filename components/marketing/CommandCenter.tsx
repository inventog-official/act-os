'use client'

import React, { useState, useEffect } from 'react'
import { Atmosphere } from './Atmosphere'

interface CommandResponse {
  query: string
  executionTime: string
  subsystems: { name: string; finding: string; metric: string }[]
  directive: string
}

const COMMAND_SCENARIOS: CommandResponse[] = [
  {
    query: "What's happening across my business?",
    executionTime: '8ms',
    subsystems: [
      { name: 'OPERATIONS', finding: '18 Active Sprints on schedule', metric: '100% SLA' },
      { name: 'FINANCE', finding: 'MRR tracking at +18.4% growth', metric: '$401K/mo' },
      { name: 'INVENTORY', finding: 'All 34 regional hubs balanced', metric: '2.4d cycle' },
      { name: 'PEOPLE', finding: 'Zero overloaded engineers', metric: '82% load' },
    ],
    directive: 'All systems operating within optimal variance. Next critical milestone: Q3 tax filing in 14 days.',
  },
  {
    query: 'Simulate supply chain risk across Q3 deliveries',
    executionTime: '12ms',
    subsystems: [
      { name: 'FREIGHT', finding: 'Pacific shipping lane 48h delay risk', metric: 'HIGH RISK' },
      { name: 'SUPPLIER 02', finding: 'Secondary supplier stock confirmed', metric: '+1,200 UNITS' },
      { name: 'CASH FLOW', finding: 'Backup procurement impact: +$1,400', metric: 'NEGLIGIBLE' },
      { name: 'DELIVERY', finding: 'Customer commitments preserved', metric: '100% ON TIME' },
    ],
    directive: 'Auto-routed 40% of replenishment to air-freight backup. Guaranteed delivery dates intact.',
  },
  {
    query: 'Optimize cash collection cycle for enterprise accounts',
    executionTime: '6ms',
    subsystems: [
      { name: 'OUTSTANDING', finding: '3 Enterprise invoices past net-30', metric: '$84,500 DUE' },
      { name: 'FOLLOW-UP', finding: 'Dynamic reminder dispatched with payment link', metric: 'SENT' },
      { name: 'DISCOUNT', finding: 'Early-settlement 2% applied dynamically', metric: 'ACCEPTED' },
      { name: 'SETTLEMENT', finding: 'Expected realization within 48 hours', metric: '$82,810' },
    ],
    directive: 'DSO reduced by 4.2 days. Enterprise cash flow posture upgraded to Excellent.',
  },
]

export function CommandCenter() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [typedQuery, setTypedQuery] = useState('')
  const scenario = COMMAND_SCENARIOS[scenarioIdx]

  // Typewriter effect
  useEffect(() => {
    let index = 0
    const fullText = scenario.query
    setTypedQuery('')

    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedQuery(fullText.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 40)

    const nextTimeout = setTimeout(() => {
      setScenarioIdx((prev) => (prev + 1) % COMMAND_SCENARIOS.length)
    }, 6500)

    return () => {
      clearInterval(interval)
      clearTimeout(nextTimeout)
    }
  }, [scenarioIdx])

  return (
    <section
      id="command"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-24"
    >
      <Atmosphere variant="aurora" intensity={0.7} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          07 — CENTRAL COMMAND
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Ask ACT OS anything.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Natural language interface backed by a real-time deterministic enterprise execution kernel.
        </p>
      </div>

      {/* Command Center Console (No Chat Bubbles, Pure Terminal Telemetry) */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/20 bg-neutral-950/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Top Search / Command Input Bar */}
          <div className="relative flex items-center gap-4 p-4 rounded-xl border border-white/20 bg-black/80">
            <span className="font-mono text-xs text-white/50 pl-1 select-none">&gt;</span>
            <div className="flex-1 font-mono text-sm md:text-base text-white">
              {typedQuery}
              <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-neutral-500">
              <span>LATENCY: {scenario.executionTime}</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white">ENTER</span>
            </div>
          </div>

          {/* Structured Telemetry Response Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenario.subsystems.map((sub) => (
              <div
                key={sub.name}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                    {sub.name}
                  </div>
                  <div className="text-xs text-neutral-300 font-light leading-relaxed mb-3">
                    {sub.finding}
                  </div>
                </div>
                <div className="font-mono text-xs text-white font-semibold pt-2 border-t border-white/10">
                  {sub.metric}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Directive Summary Card */}
          <div className="p-4 rounded-xl border border-white/15 bg-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <div>
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  SYNTHESIZED DIRECTIVE
                </div>
                <div className="text-sm font-medium text-white mt-0.5">
                  {scenario.directive}
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 self-end sm:self-center shrink-0">
              [ 100% VERIFIED ]
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
