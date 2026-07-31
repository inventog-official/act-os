'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Menu, X, ArrowRight } from 'lucide-react'

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
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          'fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[1280px] -translate-x-1/2 rounded-2xl transition-all duration-300',
          scrolled
            ? 'top-2 bg-[rgba(3,6,9,0.88)] shadow-lg shadow-black/30 py-2.5 border border-[rgba(100,160,220,0.15)]'
            : 'bg-[rgba(3,6,9,0.6)] py-3 border border-[rgba(100,160,220,0.08)]'
        )}
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <nav className="flex items-center justify-between px-5 sm:px-6" aria-label="Main navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="ACT OS Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lp-accent)] transition-shadow group-hover:shadow-[0_0_20px_rgba(22,131,255,0.4)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[var(--lp-text)]">ACT OS</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-[13px] font-medium text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)] rounded-lg hover:bg-[rgba(100,160,220,0.06)]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-[13px] font-medium text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="lp-btn-primary !h-9 !px-5 !text-[13px] !rounded-lg"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--lp-border)] text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--lp-bg)] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="flex flex-col pt-24 px-6 pb-8 h-full">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3.5 text-lg font-medium text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)] rounded-xl hover:bg-[var(--lp-surface)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/register"
                className="lp-btn-primary w-full !rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="lp-btn-secondary w-full !rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
