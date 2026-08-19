'use client'

import React, { useState, useEffect } from 'react'
import { Atmosphere } from './Atmosphere'

const WORKFLOW_STEPS = [
  {
    tag: 'TRIGGER',
    title: 'Inbound Signal',
    detail: 'Enterprise event received (Deal Won, Inventory Below Threshold, or Invoice Past Due).',
    latency: '0ms',
  },
  {
    tag: 'DECISION',
    title: 'Contextual Evaluation',
    detail: 'Multi-variable policy engine validates margin requirements, SLA timelines, and inventory stock.',
    latency: '1.4ms',
  },
  {
    tag: 'ACTION',
    title: 'Orchestrated Dispatch',
    detail: 'Tasks auto-assigned to engineering squad, purchase orders released to supplier, client ledger updated.',
    latency: '3.2ms',
  },
  {
    tag: 'RESULT',
    title: 'Verified Execution',
    detail: 'Proof-of-execution recorded to tamper-evident audit ledger with zero human intervention.',
    latency: '0.8ms',
  },
]

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % (WORKFLOW_STEPS.length + 1))
    }, 2200)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      id="workflows"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden"
    >
      <Atmosphere variant="nebula" intensity={0.6} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          05 — AUTONOMOUS WORKFLOWS
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Turn work into systems.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Replace manual meetings and fragmented spreadsheets with deterministic, self-executing business logic.
        </p>
      </div>

      {/* 3D Flow Architecture Pipeline */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="bg-neutral-950/80 border border-white/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
          {/* Top Workflow Status */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />
              <span className="font-mono text-xs text-white uppercase tracking-widest">
                PIPELINE ID // FLOW-9982-SYNCHRONOUS
              </span>
            </div>
            <div className="font-mono text-xs text-neutral-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: {activeStep === 4 ? 'FULLY AUTOMATED' : 'EXECUTING FLOW'}
            </div>
          </div>

          {/* Stepped Dimensional Path Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-8 relative">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCurrent = activeStep === idx
              const isPassed = activeStep > idx || activeStep === 4

              return (
                <div
                  key={step.tag}
                  className={`p-5 rounded-xl border transition-all duration-500 relative flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-white/[0.12] border-white/60 shadow-xl scale-105 z-10'
                      : isPassed
                      ? 'bg-white/[0.04] border-white/30 text-white'
                      : 'bg-black/40 border-white/[0.08] text-neutral-500'
                  }`}
                >
                  {/* Top tag & Latency */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                        {step.tag}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">{step.latency}</span>
                    </div>
                    <div className="text-base font-medium text-white mb-2">{step.title}</div>
                    <div className="text-xs text-neutral-400 leading-relaxed font-light">
                      {step.detail}
                    </div>
                  </div>

                  {/* Flow Status Light */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-500">PHASE 0{idx + 1}</span>
                    <span className={isPassed ? 'text-emerald-400' : 'text-neutral-600'}>
                      {isPassed ? 'COMPLETED' : isCurrent ? 'PROCESSING' : 'QUEUED'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Final Automated Outcome Banner */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="text-neutral-400">
              TOTAL CYCLE TIME: <strong className="text-white">5.4 MILLISECONDS</strong>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider">
              {activeStep === 4 ? 'STATUS: CONTINUOUSLY RUNNING IN BACKGROUND' : 'STATE: PIPELINE SYNCHRONIZED'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
