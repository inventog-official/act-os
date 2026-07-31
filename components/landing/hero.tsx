import { Reveal } from '@/components/landing/reveal'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 lp-grid-bg" style={{
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)',
      }} />
      <div className="lp-glow-subtle" style={{ width: '800px', height: '800px', left: '50%', top: '15%', transform: 'translate(-50%, -50%)' }} />
      <div className="lp-glow" style={{ width: '400px', height: '400px', left: '50%', top: '60%', transform: 'translate(-50%, -50%)', opacity: 0.4 }} />

      <div className="relative z-10 lp-container text-center">
        {/* Eyebrow */}
        <Reveal variant="up">
          <div className="flex justify-center mb-6">
            <span className="lp-eyebrow inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--lp-border-accent)] bg-[rgba(22,131,255,0.06)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)] animate-pulse-soft" />
              THE BUSINESS OPERATING SYSTEM
            </span>
          </div>
        </Reveal>

        {/* Headline */}
        <Reveal variant="up" delay={100}>
          <h1 className="lp-headline-display mx-auto max-w-4xl">
            Run your entire business
            <br />
            from <span className="lp-text-gradient">one intelligent</span> system.
          </h1>
        </Reveal>

        {/* Supporting copy */}
        <Reveal variant="up" delay={200}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--lp-text-secondary)]">
            ACT OS connects operations, workflows, people, inventory and business intelligence into one unified operating system.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal variant="up" delay={300}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="lp-btn-primary w-full sm:w-auto">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#platform" className="lp-btn-secondary w-full sm:w-auto">
              Explore ACT OS
            </a>
          </div>
        </Reveal>

        {/* Credibility */}
        <Reveal variant="fade" delay={400}>
          <p className="mt-6 text-xs text-[var(--lp-text-muted)] tracking-wide">
            One system. Every moving part.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
