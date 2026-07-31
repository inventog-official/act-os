import { Reveal } from '@/components/landing/reveal'
import { ArrowRight } from 'lucide-react'

type FeatureSectionProps = {
  eyebrow: string
  headline: string
  description: string
  reverse?: boolean
  children: React.ReactNode
}

export function FeatureSection({ eyebrow, headline, description, reverse, children }: FeatureSectionProps) {
  return (
    <section className="lp-section">
      <div className="lp-container">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reverse ? 'lg:direction-rtl' : ''}`}>
          {/* Text side */}
          <div className={reverse ? 'lg:order-2' : ''}>
            <Reveal variant={reverse ? 'right' : 'left'}>
              <span className="lp-eyebrow">{eyebrow}</span>
              <h2 className="lp-headline mt-4">{headline}</h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--lp-text-secondary)] max-w-lg">
                {description}
              </p>
              <div className="mt-8">
                <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lp-accent)] transition-colors hover:text-[var(--lp-accent-secondary)] group">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* UI side */}
          <div className={reverse ? 'lg:order-1' : ''}>
            <Reveal variant={reverse ? 'left' : 'right'} delay={200}>
              {children}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
