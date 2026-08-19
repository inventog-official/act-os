'use client'

import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10 py-16">
      <div className="lp-container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-16 border-b border-white/[0.08]">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-[4px] bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-[1px] bg-black" />
              </div>
              <span className="font-mono text-sm font-semibold tracking-wider text-white">
                ACT<span className="text-white/40">//</span>OS
              </span>
            </Link>
            <p className="text-sm text-neutral-400 max-w-sm font-light leading-relaxed">
              The intelligent operating system for running a business. Real-time deterministic operations, people, inventory, and workflows.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          {/* Systems Col */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-neutral-500 uppercase tracking-widest">SYSTEMS</div>
            <ul className="space-y-2 text-neutral-300 font-sans text-sm">
              <li><Link href="#operations" className="hover:text-white transition-colors">Operations</Link></li>
              <li><Link href="#workflows" className="hover:text-white transition-colors">Workflows</Link></li>
              <li><Link href="#inventory" className="hover:text-white transition-colors">Inventory</Link></li>
              <li><Link href="#people" className="hover:text-white transition-colors">Workforce</Link></li>
              <li><Link href="#intelligence" className="hover:text-white transition-colors">Intelligence</Link></li>
            </ul>
          </div>

          {/* Platform Col */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-neutral-500 uppercase tracking-widest">PLATFORM</div>
            <ul className="space-y-2 text-neutral-300 font-sans text-sm">
              <li><Link href="#architecture" className="hover:text-white transition-colors">Kernel Architecture</Link></li>
              <li><Link href="#command" className="hover:text-white transition-colors">Command Engine</Link></li>
              <li><Link href="#product" className="hover:text-white transition-colors">Telemetry Cockpit</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Enterprise Cloud</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Security &amp; RLS</Link></li>
            </ul>
          </div>

          {/* Access Col */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-neutral-500 uppercase tracking-widest">ACCESS</div>
            <ul className="space-y-2 text-neutral-300 font-sans text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/forgot-password" className="hover:text-white transition-colors">Account Recovery</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div>
            &copy; {new Date().getFullYear()} ACT OS INC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span>DETERMINISTIC KERNEL</span>
            <span>HARDWARE AES-256</span>
            <span>POSTGRESQL // DRIZZLE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
