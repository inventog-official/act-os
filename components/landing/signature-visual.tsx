'use client'

import { Reveal } from '@/components/landing/reveal'

export function SignatureVisual() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-black overflow-hidden py-32 sm:py-48">
      {/* Huge Multi-Color Universe of Data Light Field */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
        {/* Core Cosmic Flare: Violet -> Magenta -> Orange -> Cyan */}
        <div
          className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full blur-[160px] opacity-75 sm:opacity-85"
          style={{
            background:
              'radial-gradient(circle at 45% 45%, rgba(168, 85, 247, 0.28) 0%, rgba(236, 72, 153, 0.20) 30%, rgba(249, 115, 22, 0.16) 55%, rgba(6, 182, 212, 0.10) 75%, transparent 100%)',
            animation: 'lp-atm-drift-1 26s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[450px] sm:w-[700px] h-[450px] sm:h-[700px] rounded-full blur-[140px] opacity-60"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.20) 0%, rgba(139, 92, 246, 0.16) 40%, rgba(244, 63, 94, 0.12) 70%, transparent 95%)',
            animation: 'lp-atm-drift-2 30s ease-in-out infinite',
          }}
        />
      </div>

      {/* Pure White Central Typography */}
      <div className="relative z-10 lp-container text-center">
        <Reveal variant="fade">
          <span className="lp-eyebrow mb-6 sm:mb-8 block">THE UNIFIED OPERATING SYSTEM</span>
        </Reveal>
        <Reveal variant="up" delay={150}>
          <h2 className="lp-headline-massive text-white font-normal tracking-tight">
            ACT OS
          </h2>
        </Reveal>
        <Reveal variant="up" delay={300}>
          <p className="mt-8 text-base sm:text-lg text-[#A1A1A1] max-w-xl mx-auto font-normal leading-relaxed">
            One intelligent foundation for every moving part of modern enterprise operations.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
