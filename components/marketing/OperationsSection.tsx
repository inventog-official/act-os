'use client'

import React, { useState } from 'react'
import { Atmosphere } from './Atmosphere'

interface OperationalState {
  id: string
  step: string
  title: string
  summary: string
  statusTag: string
  latency: string
  throughput: string
  health: number // 0 to 100
  logSnippet: string
}

const STATES: OperationalState[] = [
  {
    id: 'overview',
    step: '01',
    title: 'Comprehensive Ecosystem Overview',
    summary: 'ACT OS maintains a unified operational model across all endpoints, warehouses, billing pipes, and team rosters in real time.',
    statusTag: 'STEADY_STATE',
    latency: '3.8ms',
    throughput: '88,240 msg/sec',
    health: 99.8,
    logSnippet: '[KERNEL] All 42 enterprise subsystems operational. Zero unresolved queues.',
  },
  {
    id: 'performance',
    step: '02',
    title: 'Autonomous Performance Optimization',
    summary: 'Sub-millisecond bottlenecks are identified and bypassed before they impact customers, financial close, or inventory shipments.',
    statusTag: 'BURST_OPTIMIZATION',
    latency: '1.2ms',
    throughput: '142,500 msg/sec',
    health: 100,
    logSnippet: '[DISPATCH] Dynamic scale applied to EU-West inventory sync. Cache hit ratio 99.94%.',
  },
  {
    id: 'alert',
    step: '03',
    title: 'Pre-emptive Anomaly Detection',
    summary: 'Deviation patterns trigger instant contextual alarms, isolating the anomaly without stalling healthy enterprise pipelines.',
    statusTag: 'ANOMALY_CONTAINED',
    latency: '4.1ms',
    throughput: '91,000 msg/sec',
    health: 96.4,
    logSnippet: '[ANOMALY] Supply delay detected in Pacific freight corridor. Impact contained to batch #4401.',
  },
  {
    id: 'resolution',
    step: '04',
    title: 'Self-Executing Resolution',
    summary: 'Automated corrective procedures re-route tasks, re-allocate suppliers, and notify stakeholders in under 120 milliseconds.',
    statusTag: 'AUTOMATED_RESTORED',
    latency: '2.4ms',
    throughput: '110,400 msg/sec',
    health: 100,
    logSnippet: '[RESOLVED] Backup vendor contracted automatically. Delivery ETA preserved within 0.2% variance.',
  },
]

export function OperationsSection() {
  const [activeStateIndex, setActiveStateIndex] = useState(0)
  const current = STATES[activeStateIndex]

  return (
    <section
      id="operations"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden"
    >
      <Atmosphere variant="solar" intensity={0.55} />

      <div className="lp-container relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Sticky Narrative Controls */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
            <div>
              <span className="lp-eyebrow mb-3 block">
                04 — REAL-TIME TELEMETRY
              </span>
              <h2 className="lp-headline-display tracking-tight text-balance mb-4">
                Know what’s happening.
              </h2>
              <p className="text-lg text-neutral-400 font-light leading-relaxed">
                Transform passive retrospective reporting into proactive operational control.
              </p>
            </div>

            {/* Step Selector Buttons */}
            <div className="space-y-3">
              {STATES.map((st, idx) => (
                <div
                  key={st.id}
                  onClick={() => setActiveStateIndex(idx)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    activeStateIndex === idx
                      ? 'bg-white/[0.08] border-white/40 shadow-lg translate-x-2'
                      : 'bg-neutral-950/50 border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-white/50">{st.step}</span>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                      {st.statusTag}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{st.title}</div>
                  <div className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                    {st.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Transforming Operational Interface */}
          <div className="lg:col-span-7 bg-neutral-950/80 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />
                <span className="font-mono text-xs text-white uppercase tracking-widest">
                  OPERATIONAL KERNEL // {current.statusTag}
                </span>
              </div>
              <span className="font-mono text-xs text-neutral-400">
                HEALTH: <strong className="text-white">{current.health}%</strong>
              </span>
            </div>

            {/* Health Waveform Matrix */}
            <div className="my-6 space-y-4">
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>SYSTEM LATENCY: <strong className="text-white">{current.latency}</strong></span>
                <span>THROUGHPUT: <strong className="text-white">{current.throughput}</strong></span>
              </div>

              {/* Dynamic Waveform Graph */}
              <div className="h-32 bg-black/60 border border-white/10 rounded-xl p-4 flex items-end gap-1.5 overflow-hidden">
                {Array.from({ length: 32 }, (_, i) => {
                  const base = current.health > 98 ? 65 : 40
                  const variance = Math.sin(i * 0.5 + activeStateIndex) * 25
                  const h = Math.max(15, Math.min(100, base + variance))
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-white/30 rounded-t-[2px] transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        backgroundColor: i === 18 && current.health < 98 ? '#FFFFFF' : undefined,
                      }}
                    />
                  )
                })}
              </div>

              {/* Live Terminal Log Stream */}
              <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-xs text-neutral-300 space-y-1">
                <div className="text-[10px] text-neutral-500 flex justify-between">
                  <span>AUDIT STREAM</span>
                  <span>UTC {new Date().toISOString().slice(11, 19)}</span>
                </div>
                <div className="text-emerald-400 text-[11px] font-semibold">
                  &gt; {current.logSnippet}
                </div>
              </div>
            </div>

            {/* Sub-Metric Panels */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/10">
                <div className="text-[9px] text-neutral-500">PACKET LOSS</div>
                <div className="text-xs text-white font-medium">0.000%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/10">
                <div className="text-[9px] text-neutral-500">CONCURRENCY</div>
                <div className="text-xs text-white font-medium">10,240 THREADS</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/10">
                <div className="text-[9px] text-neutral-500">AUTO-FAILOVER</div>
                <div className="text-xs text-emerald-400 font-medium">ARMED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
