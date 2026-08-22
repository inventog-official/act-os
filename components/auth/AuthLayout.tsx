'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IoLogoStencil } from 'react-icons/io5'
import { Atmosphere } from '@/components/marketing/Atmosphere'
import { AuthVisual } from './AuthVisual'

interface AuthLayoutProps {
  children: ReactNode
  headline?: string
  subtitle?: string
}

export function AuthLayout({
  children,
  headline = 'Designed for seamless operations.',
  subtitle = 'The intelligence and elegance of macOS, built for your entire enterprise.',
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#007AFF] selection:text-white font-sans overflow-hidden">
      {/* Dynamic Apple Wallpaper Ambient Atmosphere */}
      <Atmosphere variant="cosmic" intensity={0.5} />

      {/* macOS Main Window Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative z-10 w-full max-w-5xl min-h-[640px] rounded-3xl overflow-hidden border border-white/[0.12] bg-[#16161A]/85 backdrop-blur-3xl shadow-[0_35px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col lg:flex-row"
      >
        {/* macOS Traffic Lights Window Header Bar */}
        <div className="absolute top-0 inset-x-0 h-11 flex items-center justify-between px-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/20" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/20" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/20" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACT OS System v2.4</span>
          </div>
        </div>

        {/* LEFT — Apple Visual Canvas & System Intro (Hidden on mobile) */}
        <div className="relative hidden lg:flex lg:w-[50%] flex-col justify-between p-10 pt-16 border-r border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white via-white/90 to-neutral-200 text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)] flex items-center justify-center transition-transform group-hover:scale-105">
              <IoLogoStencil className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white font-sans">
              ACT OS
            </span>
          </Link>

          {/* Centered Graphic Sphere */}
          <div className="my-auto flex items-center justify-center w-full h-[320px]">
            <AuthVisual />
          </div>

          {/* Narrative */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-medium text-white/70">
              <span>Apple-Grade Architecture</span>
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-white text-balance">
              {headline}
            </h2>
            <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-sm">
              {subtitle}
            </p>
          </div>
        </div>

        {/* RIGHT — Apple ID / Sign In Form Container */}
        <div className="relative w-full lg:w-[50%] flex flex-col justify-between p-6 sm:p-10 pt-16 sm:pt-16 bg-[#0E0E12]/80 backdrop-blur-xl">
          <div className="my-auto w-full max-w-[360px] mx-auto">
            {children}
          </div>

          {/* Footer Security Badges */}
          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500 font-sans">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              Secure Enclave Auth
            </span>
            <span>256-bit Encryption</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
