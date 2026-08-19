import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'

export function FinalCta() {
  return (
    <>
      {/* 22 — Final Statement */}
      <section className="relative py-28 sm:py-36 bg-black overflow-hidden border-t border-white/[0.08]">
        <GradientAtmosphere variant="subtle" intensity="ultra-low" />

        <div className="relative z-10 lp-container text-center">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6 block">ACT OS</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal max-w-3xl mx-auto">
              Run your business like a system.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] max-w-xl mx-auto font-normal leading-relaxed">
              One connected platform for operations, workflows and intelligence.
            </p>
          </Reveal>
          <Reveal variant="up" delay={300}>
            <div className="mt-10">
              <Link href="/register" className="lp-btn-primary">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 23 — Cinematic Final CTA */}
      <section className="relative py-36 sm:py-48 bg-black overflow-hidden">
        {/* Huge Blurred Expanded Gradient in background */}
        <GradientAtmosphere variant="hero" intensity="medium" />

        <div className="relative z-10 lp-container text-center">
          <Reveal variant="up">
            <h2 className="lp-headline-display text-white font-normal max-w-4xl mx-auto leading-tight">
              Your business deserves an operating system.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <p className="mt-8 text-base sm:text-lg text-[#A1A1A1] max-w-xl mx-auto font-normal leading-relaxed">
              Join leading organizations orchestrating people, data, and workflows on ACT OS.
            </p>
          </Reveal>
          <Reveal variant="up" delay={300}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="lp-btn-primary w-full sm:w-auto">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:contact@actos.io" className="lp-btn-secondary w-full sm:w-auto">
                Talk to our team
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
