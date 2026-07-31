import { Reveal } from '@/components/landing/reveal'
import { LayoutGrid, Table2, CheckSquare, Box, BarChart3, MessageSquare } from 'lucide-react'

const fragments = [
  { label: 'CRM', icon: LayoutGrid, x: 5, y: 10 },
  { label: 'Spreadsheets', icon: Table2, x: 55, y: 5 },
  { label: 'Tasks', icon: CheckSquare, x: 85, y: 35 },
  { label: 'Inventory', icon: Box, x: 70, y: 70 },
  { label: 'Analytics', icon: BarChart3, x: 15, y: 65 },
  { label: 'Communication', icon: MessageSquare, x: 40, y: 80 },
]

export function ProblemSection() {
  return (
    <section className="lp-section" id="solutions">
      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="lp-headline">
              Your business is too important to run across <span className="lp-text-gradient">disconnected tools.</span>
            </h2>
          </div>
        </Reveal>

        <div className="relative max-w-4xl mx-auto">
          {/* Scattered fragments */}
          <div className="relative h-[320px] sm:h-[380px]">
            {fragments.map((frag, i) => (
              <Reveal key={frag.label} variant="fade" delay={i * 100}>
                <div
                  className="absolute group"
                  style={{
                    left: `${frag.x}%`,
                    top: `${frag.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] shadow-lg shadow-black/20 transition-all duration-300 group-hover:border-[var(--lp-border-accent)]">
                    <frag.icon className="h-4 w-4 text-[var(--lp-text-muted)]" />
                    <span className="text-[12px] font-medium text-[var(--lp-text-secondary)] whitespace-nowrap">{frag.label}</span>
                  </div>
                  {/* Disconnected line stub */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-[var(--lp-border)] opacity-40" />
                </div>
              </Reveal>
            ))}

            {/* Center convergence target */}
            <Reveal variant="zoom" delay={700}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--lp-accent)]" style={{ boxShadow: '0 10px 25px rgba(22,131,255,0.2)' }}>
                  <span className="text-xs font-bold text-white tracking-tight">ACT OS</span>
                  {/* Connecting lines (purely decorative via SVG) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ left: '-200%', top: '-200%', width: '500%', height: '500%' }}>
                    {fragments.map((frag, i) => {
                      const cx = 50
                      const cy = 50
                      const fx = ((frag.x - 50) / 50) * 200 + 50
                      const fy = ((frag.y - 50) / 50) * 200 + 50
                      return (
                        <line
                          key={i}
                          x1={`${cx}%`}
                          y1={`${cy}%`}
                          x2={`${fx}%`}
                          y2={`${fy}%`}
                          stroke="var(--lp-accent)"
                          strokeWidth="1"
                          strokeOpacity="0.15"
                          strokeDasharray="4 4"
                        />
                      )
                    })}
                  </svg>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Transition text */}
          <Reveal variant="up" delay={900}>
            <p className="text-center text-sm text-[var(--lp-text-muted)] mt-8">
              <span className="text-[var(--lp-text-secondary)]">Disconnected</span>
              <span className="mx-3 inline-block w-8 h-px bg-[var(--lp-accent)] align-middle opacity-50" />
              <span className="text-[var(--lp-accent)] font-medium">Connected</span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
