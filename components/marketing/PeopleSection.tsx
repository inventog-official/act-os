'use client'

import React, { useState } from 'react'
import { Atmosphere } from './Atmosphere'

interface SquadNode {
  code: string
  lead: string
  focus: string
  activeSprints: number
  capacityUtil: number
  keyDeliverables: string[]
}

const SQUADS: SquadNode[] = [
  {
    code: 'CORE_ENGINEERING',
    lead: 'ARCH_LEAD_01',
    focus: 'Kernel & Distributed Sync',
    activeSprints: 4,
    capacityUtil: 84,
    keyDeliverables: ['Multi-region database sharding', 'Postgres RLS audit policy', 'Real-time telemetry event bus'],
  },
  {
    code: 'PRODUCT_EXPERIENCE',
    lead: 'DESIGN_LEAD_04',
    focus: 'Monochrome Interaction Layer',
    activeSprints: 3,
    capacityUtil: 78,
    keyDeliverables: ['Command Center terminal UX', 'Telemetry dashboard density', 'Mobile responsiveness audit'],
  },
  {
    code: 'ENTERPRISE_OPERATIONS',
    lead: 'OPS_LEAD_09',
    focus: 'Cross-functional Execution',
    activeSprints: 5,
    capacityUtil: 91,
    keyDeliverables: ['Supply chain auto-reorder rule', 'Multi-currency invoice ledger', 'HR onboarding pipeline'],
  },
  {
    code: 'INTELLIGENCE_REASONING',
    lead: 'ML_LEAD_02',
    focus: 'Contextual Directives',
    activeSprints: 3,
    capacityUtil: 82,
    keyDeliverables: ['Anomaly prediction model', 'Autonomous margin optimizer', 'Natural language semantic parser'],
  },
]

export function PeopleSection() {
  const [selectedSquad, setSelectedSquad] = useState<SquadNode>(SQUADS[0])

  return (
    <section
      id="people"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-24"
    >
      <Atmosphere variant="cosmic" intensity={0.55} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          09 — WORKFORCE COORDINATION
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Know who is doing what.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Zero ambiguity. Real-time capacity mapping, objective alignment, and cross-team execution velocity.
        </p>
      </div>

      {/* Abstract Organizational Network Grid (No Avatars, Pure Geometric Mesh) */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Squad Roster */}
          <div className="lg:col-span-6 space-y-3">
            {SQUADS.map((sq) => (
              <div
                key={sq.code}
                onClick={() => setSelectedSquad(sq)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedSquad.code === sq.code
                    ? 'bg-white/[0.1] border-white/40 shadow-lg translate-x-2'
                    : 'bg-neutral-950/60 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedSquad.code === sq.code ? 'bg-white' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="font-mono text-xs font-semibold text-white tracking-widest">
                      {sq.code}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {sq.capacityUtil}% LOAD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400 font-light">
                  <span>{sq.focus}</span>
                  <span className="font-mono text-[10px] text-neutral-500">{sq.lead}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Active Deliverables & Responsibility Mesh */}
          <div className="lg:col-span-6 bg-neutral-950/85 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-mono text-xs text-white uppercase tracking-widest">
                EXECUTION MESH // {selectedSquad.code}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                {selectedSquad.activeSprints} SPRINTS ACTIVE
              </span>
            </div>

            <div className="space-y-4">
              <div className="font-mono text-xs text-neutral-400">
                CORE RESPONSIBILITY: <strong className="text-white">{selectedSquad.focus}</strong>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  ACTIVE CRITICAL DELIVERABLES
                </div>
                {selectedSquad.keyDeliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono text-neutral-200"
                  >
                    <span>{item}</span>
                    <span className="text-[10px] text-emerald-400">ON TRACK</span>
                  </div>
                ))}
              </div>

              {/* Capacity bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>CAPACITY ALLOCATION</span>
                  <span>{selectedSquad.capacityUtil}% (OPTIMAL VELOCITY)</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-500"
                    style={{ width: `${selectedSquad.capacityUtil}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 font-mono text-[10px] text-neutral-500 flex justify-between">
              <span>ORCHESTRATION: DECENTRALIZED</span>
              <span>STATE: SYNCHRONIZED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
