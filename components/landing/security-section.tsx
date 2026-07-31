import { Reveal } from '@/components/landing/reveal'
import { Shield, Lock, Eye, GitBranch, Database } from 'lucide-react'

const items = [
  { title: 'Secure access', description: 'End-to-end encryption for all data in transit and at rest.', icon: Shield },
  { title: 'Role-based permissions', description: 'Fine-grained access control per module, action, and data scope.', icon: Lock },
  { title: 'Audit visibility', description: 'Every action logged with full traceability across all modules.', icon: Eye },
  { title: 'Controlled workflows', description: 'Approval chains and escalation policies built into every process.', icon: GitBranch },
  { title: 'Data protection', description: 'Row-level security on every table. Your data stays yours.', icon: Database },
]

export function SecuritySection() {
  return (
    <section className="lp-section" style={{ background: 'var(--lp-bg-secondary)' }} id="resources">
      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="lp-eyebrow">Security</span>
            <h2 className="lp-headline mt-4">
              Built for <span className="lp-text-gradient">serious businesses.</span>
            </h2>
          </div>
        </Reveal>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {items.map((item, i) => (
            <Reveal key={item.title} variant="up" delay={i * 80}>
              <div className="group text-center p-5 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] transition-all duration-300 hover:border-[var(--lp-border-accent)] hover:shadow-[0_0_30px_rgba(22,131,255,0.06)] h-full">
                <div className="flex justify-center mb-3">
                  <item.icon className="h-5 w-5 text-[var(--lp-text-muted)] transition-colors group-hover:text-[var(--lp-accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[13px] font-semibold text-[var(--lp-text)] mb-1.5">{item.title}</h3>
                <p className="text-[11px] leading-relaxed text-[var(--lp-text-muted)]">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
