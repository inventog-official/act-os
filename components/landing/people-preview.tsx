import { Users, CheckCircle2, Clock, Star, ArrowRight } from 'lucide-react'

export function PeoplePreview() {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] overflow-hidden shadow-xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
        <Users className="h-4 w-4 text-[var(--lp-accent)]" />
        <span className="text-[13px] font-semibold text-[var(--lp-text)]">Team Overview</span>
        <span className="ml-auto text-[10px] text-[var(--lp-text-muted)]">48 active members</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Workload distribution */}
        <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
          <span className="text-[10px] font-semibold text-[var(--lp-text-muted)] uppercase tracking-wider">Workload Distribution</span>
          <div className="mt-3 space-y-2.5">
            {[
              { name: 'Sarah Chen', role: 'Engineering Lead', tasks: 8, completed: 6 },
              { name: 'Marcus Rivera', role: 'Operations Manager', tasks: 12, completed: 9 },
              { name: 'Aisha Patel', role: 'Product Manager', tasks: 6, completed: 5 },
              { name: 'James Kim', role: 'Design Lead', tasks: 5, completed: 3 },
            ].map((person) => (
              <div key={person.name} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--lp-surface-elevated)] border border-[var(--lp-border)] text-[10px] font-semibold text-[var(--lp-accent)]">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--lp-text)] truncate">{person.name}</span>
                    <span className="text-[10px] text-[var(--lp-text-muted)]">{person.completed}/{person.tasks}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--lp-bg)]">
                    <div className="h-full rounded-full bg-[var(--lp-accent)]" style={{ width: `${(person.completed / person.tasks) * 100}%`, opacity: 0.6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals & performance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3 w-3 text-[var(--lp-accent)]" />
              <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Approvals</span>
            </div>
            <div className="space-y-1.5">
              {[
                { text: 'Leave request — A. Patel', time: '2h ago' },
                { text: 'Expense claim — J. Kim', time: '4h ago' },
                { text: 'Access request — New hire', time: '1d ago' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-1.5 py-1">
                  <Clock className="h-2.5 w-2.5 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="text-[10px] text-[var(--lp-text-secondary)] leading-snug">{item.text}</p>
                    <p className="text-[9px] text-[var(--lp-text-muted)]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3 w-3 text-[var(--lp-accent)]" />
              <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Performance</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'On-time delivery', value: '94%' },
                { label: 'Goal completion', value: '87%' },
                { label: 'Team satisfaction', value: '4.6/5' },
              ].map((metric) => (
                <div key={metric.label} className="flex justify-between text-[11px]">
                  <span className="text-[var(--lp-text-secondary)]">{metric.label}</span>
                  <span className="text-[var(--lp-text)] font-medium">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
