'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Atmosphere } from './Atmosphere'

export function ProductSection() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [zoomProgress, setZoomProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'operations' | 'inventory' | 'ai'>('overview')

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.9)))
      setZoomProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Interpolated visual values
  const scale = 0.88 + zoomProgress * 0.12
  const blur = Math.max(0, (1 - zoomProgress) * 10)
  const opacity = 0.3 + zoomProgress * 0.7

  return (
    <section
      ref={containerRef}
      id="product"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-24"
    >
      <Atmosphere variant="ocean" intensity={0.7} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          03 — UNIFIED INTERFACE
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          See your business clearly.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          The actual ACT OS command dashboard. Clean, dense, deterministic, and live.
        </p>
      </div>

      {/* Interactive Transforming Product Cockpit */}
      <div
        className="lp-container relative z-10 max-w-6xl mx-auto transition-all duration-300 ease-out"
        style={{
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity,
        }}
      >
        <div className="rounded-2xl border border-white/20 bg-neutral-950/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <span className="font-mono text-xs text-white/50 pl-2 border-l border-white/10">
                ACT // OS — ENTERPRISE CONSOLE
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
              {(['overview', 'revenue', 'operations', 'inventory', 'ai'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-[6px] font-mono text-xs uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="font-mono text-xs text-emerald-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </div>
          </div>

          {/* Body Dashboard View */}
          <div className="p-6 md:p-8 space-y-6">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  ARR (ANNUAL RUN RATE)
                </div>
                <div className="text-2xl font-light text-white">$4.82M</div>
                <div className="font-mono text-[10px] text-neutral-400 mt-1">
                  +18.4% VS LAST QUARTER
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  OPERATIONS EFFICIENCY
                </div>
                <div className="text-2xl font-light text-white">99.4%</div>
                <div className="font-mono text-[10px] text-neutral-400 mt-1">
                  142 PIPELINES ACTIVE
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  INVENTORY VELOCITY
                </div>
                <div className="text-2xl font-light text-white">2.4d</div>
                <div className="font-mono text-[10px] text-neutral-400 mt-1">
                  ZERO STOCKOUTS
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  AI DECISION ACCURACY
                </div>
                <div className="text-2xl font-light text-white">99.8%</div>
                <div className="font-mono text-[10px] text-neutral-400 mt-1">
                  1,840 REASONINGS / DAY
                </div>
              </div>
            </div>

            {/* Main Interactive Grid View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Main Process & Telemetry Stream */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-xs text-white uppercase tracking-widest">
                      REAL-TIME ENTERPRISE REVENUE FLUX
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      ROLLING 30-DAY TELEMETRY
                    </span>
                  </div>

                  {/* Simulated High-Density ASCII/Geometric Waveform */}
                  <div className="h-44 flex items-end gap-1 pt-4 px-2">
                    {[45, 52, 48, 65, 72, 68, 80, 85, 90, 84, 94, 98, 92, 100, 96, 105, 112, 108, 120, 124, 118, 130, 135, 142].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full bg-white/20 group-hover:bg-white transition-all rounded-t-[2px]"
                          style={{ height: `${(v / 150) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-3 border-t border-white/10 mt-2">
                    <span>DAY 01</span>
                    <span>DAY 15</span>
                    <span>TODAY (ALL SYSTEMS SYNCHRONIZED)</span>
                  </div>
                </div>

                {/* Sub-grid of recent actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">
                      AUTOMATED DISPATCHES
                    </div>
                    <div className="space-y-2 text-xs font-mono text-neutral-300">
                      <div className="flex justify-between">
                        <span>INV_REORDER #9901</span>
                        <span className="text-white">COMPLETED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAYROLL_SYNC_04</span>
                        <span className="text-white">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">
                      ACTIVE SYSTEM NODES
                    </div>
                    <div className="space-y-2 text-xs font-mono text-neutral-300">
                      <div className="flex justify-between">
                        <span>CLUSTER_US_EAST</span>
                        <span className="text-emerald-400">100% HEALTH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CLUSTER_EU_CENTRAL</span>
                        <span className="text-emerald-400">100% HEALTH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: AI Directive Context Engine */}
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="font-mono text-xs text-white uppercase tracking-widest">
                      ACT OS DIRECTIVE ENGINE
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
                      <div className="font-mono text-[10px] text-neutral-400 mb-1">
                        OPPORTUNITY DETECTED
                      </div>
                      <p className="text-neutral-200 leading-relaxed">
                        Q3 bulk supplier discount expires in 48 hours. Auto-purchasing 450 units saves $18,400 with 98% sell-through probability.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
                      <div className="font-mono text-[10px] text-neutral-400 mb-1">
                        RESOURCE ALLOCATION
                      </div>
                      <p className="text-neutral-200 leading-relaxed">
                        Engineering sprint capacity exceeds velocity. Rebalanced 3 critical client deliverables to maintain 100% SLA.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 font-mono text-[10px] text-neutral-500">
                  SYSTEM STATUS: AUTONOMOUS REASONING ENGAGED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
