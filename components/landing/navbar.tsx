'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Menu, X, ArrowRight } from 'lucide-react'
import { IoLogoStencil } from 'react-icons/io5'

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Resources', href: '#resources' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-black/75 backdrop-blur-xl border-b border-white/[0.08] py-3.5'
            : 'bg-transparent py-5 sm:py-6'
        )}
      >
        <nav className="lp-container flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="ACT OS Home">
            <div className="w-6 h-6 rounded-[7px] bg-white text-black flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
              <IoLogoStencil className="w-3.5 h-3.5" />
            </div>
            <span className="text-[16px] font-semibold tracking-tight text-white font-sans">
              ACT OS
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-normal text-[#A1A1A1] transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-[13px] font-normal text-[#A1A1A1] transition-colors duration-200 hover:text-white px-2 py-1"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-[38px] px-4 rounded-[8px] bg-white text-black text-[13px] font-medium transition-all duration-200 hover:bg-[#EBEBEB] hover:translate-y-[-1px] active:translate-y-0"
            >
              Get started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-[8px] text-[#A1A1A1] hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile Fullscreen Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black md:hidden flex flex-col pt-24 px-6 pb-10"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-2xl font-normal text-[#A1A1A1] transition-colors hover:text-white border-b border-white/[0.06]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <Link
              href="/register"
              className="lp-btn-primary w-full"
              onClick={() => setMobileOpen(false)}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="lp-btn-secondary w-full"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
