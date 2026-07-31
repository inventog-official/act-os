import { Zap, CheckCircle2, Bell, GitBranch } from 'lucide-react'

const steps = [
  {
    label: 'Trigger',
    title: 'Inventory below threshold',
    description: 'When stock drops below reorder point',
    icon: Zap,
    color: 'var(--lp-accent)',
  },
  {
    label: 'Condition',
    title: 'Check supplier availability',
    description: 'Verify preferred supplier has stock',
    icon: GitBranch,
    color: 'var(--lp-accent-secondary)',
  },
  {
    label: 'Action',
    title: 'Create purchase order',
    description: 'Draft PO with optimal quantities',
    icon: CheckCircle2,
    color: '#22c55e',
  },
  {
    label: 'Notification',
    title: 'Notify procurement team',
    description: 'Alert team lead for approval',
    icon: Bell,
    color: '#a78bfa',
  },
]

export function WorkflowPreview() {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] overflow-hidden shadow-xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
        <Zap className="h-4 w-4 text-[var(--lp-accent)]" />
        <span className="text-[13px] font-semibold text-[var(--lp-text)]">Workflow Builder</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-medium">Active</span>
      </div>

      <div className="p-5">
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.label} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[19px] top-[48px] w-px h-[calc(100%-16px)]" style={{ background: `linear-gradient(to bottom, ${step.color}40, ${steps[i+1].color}40)` }} />
              )}

              <div className="flex gap-4 items-start pb-5">
                {/* Step icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--lp-border)]"
                  style={{ background: `${step.color}10`, borderColor: `${step.color}30` }}
                >
                  <step.icon className="h-4 w-4" style={{ color: step.color }} />
                </div>

                {/* Step content */}
                <div className="flex-1 p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: step.color }}>{step.label}</span>
                  </div>
                  <p className="text-[13px] font-medium text-[var(--lp-text)]">{step.title}</p>
                  <p className="text-[11px] text-[var(--lp-text-muted)] mt-0.5">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
