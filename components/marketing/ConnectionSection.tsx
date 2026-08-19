'use client'

import React, { useState } from 'react'
import { Atmosphere } from './Atmosphere'

const SYSTEM_NODES = [
  {
    id: 'ops',
    name: 'OPERATIONS',
    metric: '99.98% UPTIME',
    status: 'REAL-TIME TELEMETRY',
    throughput: '42,890 evt/min',
    description: 'Autonomous process monitoring and cross-departmental SLA orchestration.',
  },
  {
    id: 'people',
    name: 'PEOPLE',
    metric: '100% CAPACITY MAPPED',
    status: 'WORKFORCE MESH',
    throughput: '14 squads synced',
    description: 'Dynamic role delegation, talent velocity tracking, and objective alignment.',
  },
  {
    id: 'workflows',
    name: 'WORKFLOWS',
    metric: '1,420 AUTO ACTIONS/S',
    status: 'EVENT PIPELINE',
    throughput: '0 ms queue delay',
    description: 'Self-healing trigger-decision pipelines spanning all enterprise endpoints.',
  },
  {
    id: 'inventory',
    name: 'INVENTORY',
    metric: 'REAL-TIME LEDGER',
    status: 'SUPPLY ORCHESTRATION',
    throughput: '34 hubs synced',
    description: 'Automated reorder triggers, demand prediction, and multi-warehouse control.',
  },
  {
    id: 'intelligence',
    name: 'INTELLIGENCE',
    metric: 'CONTINUOUS CONTEXT',
    status: 'REASONING CORE',
    throughput: '100% data fidelity',
    description: 'Contextual synthesis converting enterprise signal noise into actionable directives.',
  },
]

export function ConnectionSection() {
  const [activeNode, setActiveNode] = useState(0)

  return (
    <section
      id="architecture"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden"
    >
      <Atmosphere variant="aurora" intensity={0.65} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          02 — SYSTEM ARCHITECTURE
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          One system. Every moving part.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Five enterprise disciplines united under a single deterministic operating kernel.
        </p>
      </div>

      {/* 3D Interconnected System Visualizer */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive Radial Architecture Selector */}
          <div className="lg:col-span-5 space-y-3">
            {SYSTEM_NODES.map((node, idx) => (
              <div
                key={node.id}
                onClick={() => setActiveNode(idx)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  activeNode === idx
                    ? 'bg-white/[0.08] border-white/40 shadow-xl translate-x-2'
                    : 'bg-neutral-950/60 border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeNode === idx ? 'bg-white scale-125' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="font-mono text-xs font-semibold text-white tracking-widest">
                      {node.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {node.throughput}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-neutral-400">
                  {node.status} · <span className="text-white/80">{node.metric}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Structural Neural Engine Display (Monochrome 3D Schematic) */}
          <div className="lg:col-span-7 bg-neutral-950/80 border border-white/15 rounded-2xl p-8 backdrop-blur-xl relative min-h-[380px] flex flex-col justify-between">
            {/* Top Bar Technical Metadata */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white" />
                <span className="font-mono text-xs text-white uppercase tracking-widest">
                  KERNEL NODE // {SYSTEM_NODES[activeNode].name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE LINK
              </div>
            </div>

            {/* Middle Structural Dynamic Pathway Graphic */}
            <div className="my-8 relative py-6">
              <div className="text-2xl font-light text-white tracking-tight mb-4">
                {SYSTEM_NODES[activeNode].description}
              </div>

              {/* Data Bus Stream Simulation */}
              <div className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-4 font-mono text-xs text-neutral-300 space-y-2">
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>DISPATCH_BUS: SYNCHRONOUS</span>
                  <span>IOPS: 124,000</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-2/3 animate-pulse" />
                </div>
                <div className="flex justify-between text-[10px] text-white/60">
                  <span>PACKET_VERIFICATION: SHA-256</span>
                  <span>ENCRYPTION: HARDWARE AES</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>STATUS: {SYSTEM_NODES[activeNode].status}</span>
              <span>COHESION RATING: 100.0%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
