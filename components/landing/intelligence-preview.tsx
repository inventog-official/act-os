import { Sparkles, TrendingDown, ArrowRight, BarChart3, Clock } from 'lucide-react'

export function IntelligencePreview() {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] overflow-hidden shadow-xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--lp-accent)]" />
        <span className="text-[13px] font-semibold text-[var(--lp-text)]">Business Intelligence</span>
      </div>

      <div className="p-5 space-y-4">
        {/* User query */}
        <div className="flex justify-end">
          <div className="px-4 py-2.5 rounded-xl rounded-br-sm bg-[var(--lp-surface-elevated)] border border-[var(--lp-border)] max-w-[85%]">
            <p className="text-[13px] text-[var(--lp-text)]">Why did operational efficiency drop this week?</p>
          </div>
        </div>

        {/* AI response */}
        <div className="space-y-3">
          {/* Explanation */}
          <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: 'rgba(22,131,255,0.1)' }}>
                <Sparkles className="h-3 w-3 text-[var(--lp-accent)]" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--lp-accent)] uppercase tracking-wider">Analysis</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--lp-text-secondary)]">
              Operational efficiency decreased by 6.3% this week primarily due to two factors: a supply chain delay affecting Warehouse B 
              throughput, and an unplanned system maintenance window on Wednesday that reduced processing capacity by 4 hours.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Efficiency', value: '87.9%', delta: '-6.3%', icon: TrendingDown },
              { label: 'Throughput', value: '1,240', delta: '-180 units', icon: BarChart3 },
              { label: 'Downtime', value: '4.2h', delta: '+3.8h', icon: Clock },
            ].map((m) => (
              <div key={m.label} className="p-2.5 rounded-lg bg-[var(--lp-bg)] border border-[var(--lp-border)]">
                <m.icon className="h-3 w-3 text-[var(--lp-text-muted)] mb-1.5" />
                <p className="text-sm font-semibold text-[var(--lp-text)]">{m.value}</p>
                <p className="text-[10px] text-red-400">{m.delta}</p>
                <p className="text-[10px] text-[var(--lp-text-muted)]">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Recommended actions */}
          <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <span className="text-[10px] font-semibold text-[var(--lp-accent)] uppercase tracking-wider">Recommended Actions</span>
            <div className="mt-2 space-y-1.5">
              {[
                'Redistribute inventory from Warehouse A to cover shortfall',
                'Schedule preventive maintenance during low-traffic windows',
                'Review supplier SLA for affected deliveries',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-[var(--lp-accent)]" />
                  <span className="text-[11px] text-[var(--lp-text-secondary)]">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
