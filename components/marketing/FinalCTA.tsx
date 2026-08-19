'use client'

import React from 'react'
import Link from 'next/link'
import { Atmosphere } from './Atmosphere'

export function FinalCTA() {
  return (
    <section className="relative min-h-[90vh] bg-black text-white flex flex-col justify-center items-center text-center overflow-hidden py-32">
      {/* Subtle Atmospheric Light */}
      <Atmosphere variant="hero" intensity={0.65} />

      <div className="lp-container relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Brand Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl mb-8">
          <div className="w-6 h-6 rounded-md bg-black" />
        </div>

        {/* Small Label */}
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-white/50 mb-6">
          ACT // OS
        </div>

        {/* Final Statement */}
        <h2 className="lp-headline-massive mb-10 tracking-tight text-balance max-w-3xl">
          Your business deserves an operating system.
        </h2>

        {/* CTA Button (Monochrome, Premium) */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="lp-btn-primary min-w-[200px] h-[52px] text-sm"
          >
            <span>GET STARTED</span>
            <span className="font-mono text-xs ml-1">→</span>
          </Link>
          <Link
            href="/login"
            className="lp-btn-secondary min-w-[200px] h-[52px] text-sm"
          >
            SIGN IN TO CONSOLE
          </Link>
        </div>
      </div>
    </section>
  )
}
