'use client'

import React from 'react'
import Link from 'next/link'
import { Atmosphere } from './Atmosphere'
import { ActOSCore } from './ActOSCore'

export function Hero() {
  return (
    <section className="relative min-h-[100vh] flex flex-col justify-between pt-32 pb-16 overflow-hidden bg-black text-white">
      {/* Background Atmosphere */}
      <Atmosphere variant="hero" intensity={0.85} />

      {/* 3D ActOSCore Canvas in background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-85 pointer-events-none">
        <ActOSCore className="w-full h-full max-w-6xl max-h-[850px]" />
      </div>

      {/* Main Content */}
      <div className="lp-container relative z-10 my-auto text-center flex flex-col items-center max-w-4xl mx-auto">
        {/* System Identifier */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
            ACT // OS — CORE ENGINE
          </span>
        </div>

        {/* Primary Headline */}
        <h1 className="lp-headline-massive mb-6 tracking-tight text-balance">
          Run your entire business from one intelligent system.
        </h1>

        {/* Supporting Copy */}
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10 text-balance">
          ACT OS connects the systems, people and decisions behind your business into a single, cohesive operating environment.
        </p>

        {/* Primary Action Buttons (Monochrome, Premium) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="lp-btn-primary w-full sm:w-auto min-w-[180px]"
          >
            <span>GET STARTED</span>
            <span className="font-mono text-xs ml-1">→</span>
          </Link>
          <Link
            href="#product"
            className="lp-btn-secondary w-full sm:w-auto min-w-[180px]"
          >
            EXPLORE ACT OS
          </Link>
        </div>
      </div>

      {/* Bottom Telemetry Ticker (Monochrome, Zero Icons) */}
      <div className="lp-container relative z-10 mt-12">
        <div className="pt-6 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
              LATENCY
            </div>
            <div className="font-mono text-sm text-white font-medium">
              &lt; 4ms <span className="text-neutral-500 text-xs">GLOBAL</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
              COHESION
            </div>
            <div className="font-mono text-sm text-white font-medium">
              100% <span className="text-neutral-500 text-xs">SYNCHRONIZED</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
              AUTOMATION
            </div>
            <div className="font-mono text-sm text-white font-medium">
              1.42M <span className="text-neutral-500 text-xs">EVENTS / HR</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
              REDUNDANCY
            </div>
            <div className="font-mono text-sm text-white font-medium">
              0% <span className="text-neutral-500 text-xs">SILO RATE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
