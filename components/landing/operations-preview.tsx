import { Activity, AlertTriangle, TrendingUp, BarChart3, Users } from 'lucide-react'

function MiniBar({ value, max = 100, color = 'var(--lp-accent)' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1 rounded-full bg-[var(--lp-bg)] flex-1">
      <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color, opacity: 0.7 }} />
    </div>
  )
}

export function OperationsPreview() {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] overflow-hidden shadow-xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
        <Activity className="h-4 w-4 text-[var(--lp-accent)]" />
        <span className="text-[13px] font-semibold text-[var(--lp-text)]">Operations Center</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Efficiency', value: '94.2%', trend: '+2.1%', icon: TrendingUp },
            { label: 'Active Teams', value: '12', trend: '+3', icon: Users },
            { label: 'Alerts', value: '3', trend: 'Active', icon: AlertTriangle },
          ].map((kpi) => (
            <div key={kpi.label} className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
              <div className="flex items-center gap-1.5 mb-2">
                <kpi.icon className="h-3 w-3 text-[var(--lp-accent)]" />
                <span className="text-[10px] text-[var(--lp-text-muted)] uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-lg font-semibold text-[var(--lp-text)]">{kpi.value}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
          <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Team Activity</span>
          <div className="mt-3 space-y-2.5">
            {[
              { name: 'Engineering', progress: 87, tasks: 24 },
              { name: 'Operations', progress: 92, tasks: 18 },
              { name: 'Sales', progress: 78, tasks: 31 },
              { name: 'Support', progress: 95, tasks: 12 },
            ].map((team) => (
              <div key={team.name} className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--lp-text-secondary)] w-20">{team.name}</span>
                <MiniBar value={team.progress} />
                <span className="text-[10px] text-[var(--lp-text-muted)] w-12 text-right">{team.tasks} tasks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
          <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Active Alerts</span>
          <div className="mt-2 space-y-1.5">
            {[
              { text: 'SLA breach risk on project Delta', level: 'high' },
              { text: 'Warehouse B capacity at 92%', level: 'medium' },
              { text: 'Pending vendor response — 48h', level: 'low' },
            ].map((alert) => (
              <div key={alert.text} className="flex items-center gap-2 py-1.5">
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${alert.level === 'high' ? 'bg-red-400' : alert.level === 'medium' ? 'bg-amber-400' : 'bg-[var(--lp-accent)]'}`} />
                <span className="text-[11px] text-[var(--lp-text-secondary)]">{alert.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
