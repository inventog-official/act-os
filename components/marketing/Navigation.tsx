'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { IoLogoStencil } from 'react-icons/io5'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-xl border-b border-white/[0.08] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="lp-container flex items-center justify-between">
        {/* Brand Mark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-[7px] bg-white text-black flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
            <IoLogoStencil className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white font-sans">
            ACT OS
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium tracking-wide bg-white/[0.06] text-white/70 border border-white/[0.1]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v2.4
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/70">
          <Link href="#architecture" className="hover:text-white transition-colors duration-150">
            Architecture
          </Link>
          <Link href="#operations" className="hover:text-white transition-colors duration-150">
            Operations
          </Link>
          <Link href="#workflows" className="hover:text-white transition-colors duration-150">
            Workflows
          </Link>
          <Link href="#intelligence" className="hover:text-white transition-colors duration-150">
            Intelligence
          </Link>
          <Link href="#command" className="hover:text-white transition-colors duration-150">
            Command
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-[13px] font-medium text-black bg-white rounded-[8px] hover:bg-neutral-200 hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button (geometric bars, zero icons) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-white/80 hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span
              className={`w-full h-0.5 bg-white transition-transform duration-200 ${
                mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`w-full h-0.5 bg-white transition-opacity duration-200 ${
                mobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-full h-0.5 bg-white transition-transform duration-200 ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-black/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-white/80">
            <Link
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Architecture
            </Link>
            <Link
              href="#operations"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Operations
            </Link>
            <Link
              href="#workflows"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Workflows
            </Link>
            <Link
              href="#intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Intelligence
            </Link>
            <Link
              href="#command"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Command
            </Link>
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full text-center py-2.5 text-sm font-medium border border-white/20 rounded-[8px] text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="w-full text-center py-2.5 text-sm font-medium bg-white text-black rounded-[8px]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
