import { Reveal } from '@/components/landing/reveal'

const items = [
  'ONE SYSTEM',
  'REAL-TIME OPERATIONS',
  'CONNECTED WORKFLOWS',
  'BUSINESS INTELLIGENCE',
  'AUTOMATION',
]

export function TrustStrip() {
  return (
    <section className="relative border-y border-[var(--lp-border)]" style={{ background: 'var(--lp-bg-secondary)' }}>
      <div className="lp-container">
        <Reveal variant="fade">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-8 sm:py-6 sm:gap-x-0">
            {items.map((item, i) => (
              <div key={item} className="flex items-center">
                {i > 0 && (
                  <div className="hidden sm:block h-4 w-px bg-[var(--lp-border)] mx-8" />
                )}
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] text-[var(--lp-text-muted)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
