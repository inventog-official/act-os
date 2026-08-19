import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'

const items = [
  'ONE SYSTEM',
  'CONNECTED OPERATIONS',
  'REAL-TIME INTELLIGENCE',
  'AUTOMATION',
]

export function TrustStrip() {
  return (
    <section className="relative border-y border-white/[0.08] bg-black py-16 sm:py-20 overflow-hidden">
      {/* Subtle Ambient Glow */}
      <GradientAtmosphere variant="subtle" intensity="low" />

      <div className="relative z-10 lp-container">
        <Reveal variant="fade">
          <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-8 sm:gap-x-14 md:gap-x-20">
            {items.map((item, i) => (
              <div key={item} className="flex items-center">
                {i > 0 && (
                  <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-white/20 mr-8 sm:mr-14 md:mr-20" />
                )}
                <span className="text-[12px] sm:text-[13px] font-medium tracking-[0.18em] text-[#A1A1A1] transition-colors duration-200 hover:text-white">
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
