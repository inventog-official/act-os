import { Reveal } from '@/components/landing/reveal'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FinalCta() {
  return (
    <>
      {/* Cinematic CTA */}
      <section className="lp-section relative" style={{ paddingBlock: 'var(--lp-space-4xl)' }}>
        <div className="lp-glow" style={{ width: '600px', height: '600px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />

        <div className="lp-container relative z-10 text-center">
          <Reveal variant="up">
            <h2 className="lp-headline-display mx-auto max-w-3xl">
              Run your business <span className="lp-text-gradient">like a system.</span>
            </h2>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--lp-text-secondary)]">
              Bring your operations, workflows and intelligence into one connected platform.
            </p>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="lp-btn-primary w-full sm:w-auto">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:hello@actos.io" className="lp-btn-secondary w-full sm:w-auto">
                Talk to our team
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final statement */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="lp-glow-subtle" style={{ width: '500px', height: '500px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
        <div className="relative z-10 text-center px-6">
          <Reveal variant="fade">
            <p className="text-[var(--lp-text-muted)] text-sm mb-4 tracking-wide">Your business deserves an operating system.</p>
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-[var(--lp-text)]">ACT OS</h2>
            <div className="mt-8">
              <Link href="/register" className="lp-btn-primary">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
