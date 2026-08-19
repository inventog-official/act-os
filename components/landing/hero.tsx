import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Reveal } from '@/components/landing/reveal'

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-36 pb-20 sm:pt-44 sm:pb-28 overflow-hidden bg-black">
      {/* Abstract Colorful Light Field in background */}
      <GradientAtmosphere variant="hero" intensity="medium" />

      <div className="relative z-10 lp-container text-center">
        {/* Eyebrow */}
        <Reveal variant="up" delay={0}>
          <div className="flex justify-center mb-6 sm:mb-8">
            <span className="lp-eyebrow">
              THE BUSINESS OPERATING SYSTEM
            </span>
          </div>
        </Reveal>

        {/* Clean Large White Headline */}
        <Reveal variant="up" delay={120}>
          <h1 className="lp-headline-display mx-auto max-w-4xl font-normal text-white">
            Run your entire business from one intelligent system.
          </h1>
        </Reveal>

        {/* Supporting Copy */}
        <Reveal variant="up" delay={240}>
          <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-[#A1A1A1] font-normal">
            ACT OS connects operations, workflows, people, inventory and intelligence into one connected business operating system.
          </p>
        </Reveal>

        {/* Monochrome Buttons */}
        <Reveal variant="up" delay={360}>
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/register" className="lp-btn-primary w-full sm:w-auto">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#platform" className="lp-btn-secondary w-full sm:w-auto">
              Explore ACT OS
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
