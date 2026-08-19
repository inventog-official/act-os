'use client'

import React from 'react'
import { Atmosphere } from './Atmosphere'

export function ControlSection() {
  return (
    <section
      id="control"
      className="lp-section min-h-[90vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-24"
    >
      <Atmosphere variant="subtle" intensity={0.4} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          11 — DETERMINISTIC CONTROL
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Run your business like a system.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Predictable execution. Zero data silos. Total operational visibility across every department.
        </p>
      </div>

      {/* Pristine Executive Monochrome Cockpit */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/15 bg-neutral-950/90 backdrop-blur-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />
              <span className="font-mono text-xs text-white uppercase tracking-widest">
                ACT // OS — EXECUTIVE AUDIT COCKPIT
              </span>
            </div>
            <div className="font-mono text-xs text-neutral-400">
              STATUS: <strong className="text-emerald-400">NOMINAL</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                FINANCIAL HEALTH
              </div>
              <div className="text-2xl font-light text-white">$4,820,400</div>
              <div className="font-mono text-xs text-emerald-400">+18.4% ARR NET FLUX</div>
              <p className="text-xs text-neutral-400 font-light leading-relaxed pt-2 border-t border-white/10">
                100% receivables verified. Auto-reconciliation completed for 1,840 ledger entries.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                EXECUTION VELOCITY
              </div>
              <div className="text-2xl font-light text-white">99.98%</div>
              <div className="font-mono text-xs text-emerald-400">SLA PRESERVED</div>
              <p className="text-xs text-neutral-400 font-light leading-relaxed pt-2 border-t border-white/10">
                Zero missed project deadlines. Autonomous load distribution active across 14 squads.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                SYSTEM INTEGRITY
              </div>
              <div className="text-2xl font-light text-white">0 SILOS</div>
              <div className="font-mono text-xs text-white">HARDWARE AES ENCRYPTED</div>
              <p className="text-xs text-neutral-400 font-light leading-relaxed pt-2 border-t border-white/10">
                All departments bound to single deterministic PostgreSQL &amp; Supabase kernel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
