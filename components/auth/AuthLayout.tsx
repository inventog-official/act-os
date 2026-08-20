'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { Atmosphere } from '@/components/marketing/Atmosphere'
import { AuthVisual } from './AuthVisual'

interface AuthLayoutProps {
  children: ReactNode
  headline?: string
  subtitle?: string
}

export function AuthLayout({
  children,
  headline = 'Your business, connected.',
  subtitle = 'Enter the operating system that brings your business together.',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col lg:flex-row overflow-x-hidden selection:bg-white selection:text-black">
      {/* LEFT — BRAND EXPERIENCE (55-60% on desktop) */}
      <div className="relative hidden lg:flex lg:w-[58%] min-h-screen bg-black flex-col justify-between p-12 lg:p-16 border-r border-white/[0.08] overflow-hidden">
        {/* Soft Colorful Gradient Atmosphere */}
        <Atmosphere variant="cosmic" intensity={0.4} />

        {/* Top Brand Logo */}
        <div className="relative z-10 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-6 h-6 rounded-[5px] bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-2.5 h-2.5 rounded-[1px] bg-black" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-widest text-white">
              ACT<span className="text-white/40">//</span>OS
            </span>
          </Link>
        </div>

        {/* Center Alive Procedural Visual */}
        <div className="relative z-10 my-auto flex items-center justify-center max-w-lg mx-auto w-full h-[480px]">
          <AuthVisual />
        </div>

        {/* Bottom Brand Narrative Copy */}
        <div className="relative z-10 max-w-lg">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">
            ACT OS — OPERATING ENVIRONMENT
          </div>
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-3 text-balance">
            {headline}
          </h2>
          <p className="text-sm lg:text-base text-neutral-400 font-light leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT — AUTHENTICATION FORM (42-45% on desktop) */}
      <div className="relative w-full lg:w-[42%] min-h-screen bg-[#050505] flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between pb-8 border-b border-white/[0.06] mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-[4px] bg-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-[1px] bg-black" />
            </div>
            <span className="font-mono text-xs font-semibold tracking-wider text-white">
              ACT<span className="text-white/40">//</span>OS
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-wider">
            KERNEL v2.4
          </span>
        </div>

        {/* Vertically Centered Form Container (Max-width: 420px) */}
        <div className="my-auto w-full max-w-[420px] mx-auto py-8">
          {children}
        </div>

        {/* Footer Technical Metadata */}
        <div className="w-full max-w-[420px] mx-auto pt-8 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-600">
          <span>SECURE KERNEL</span>
          <span>AES-256 ENCRYPTED</span>
        </div>
      </div>
    </div>
  )
}
