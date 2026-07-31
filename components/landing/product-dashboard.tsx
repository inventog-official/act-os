'use client'

import { Reveal } from '@/components/landing/reveal'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Bell,
  Box,
  Zap,
} from 'lucide-react'

/* ── Mini chart (sparkline) ─────────────────────────────── */
function Sparkline({ data, color = 'var(--lp-accent)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 32
  const w = 100
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

/* ── KPI Card ──────────────────────────────────────────── */
function KpiCard({ label, value, change, trend, icon: Icon }: {
  label: string; value: string; change: string; trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">{label}</span>
        <Icon className="h-3.5 w-3.5 text-[var(--lp-text-muted)]" />
      </div>
      <span className="text-xl font-semibold text-[var(--lp-text)] tracking-tight">{value}</span>
      <span className={`text-[11px] font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change} vs last month
      </span>
    </div>
  )
}

/* ── Task row ──────────────────────────────────────────── */
function TaskRow({ title, status, priority }: { title: string; status: string; priority: 'high' | 'medium' | 'low' }) {
  const priorityColors = { high: 'bg-red-400/20 text-red-400', medium: 'bg-amber-400/20 text-amber-400', low: 'bg-emerald-400/20 text-emerald-400' }
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--lp-border)] last:border-0">
      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${status === 'done' ? 'text-emerald-400' : 'text-[var(--lp-text-muted)]'}`} />
      <span className="text-[12px] text-[var(--lp-text-secondary)] flex-1 truncate">{title}</span>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColors[priority]}`}>{priority}</span>
    </div>
  )
}

/* ── Notification row ──────────────────────────────────── */
function NotifRow({ text, time, icon: Icon }: { text: string; time: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[var(--lp-border)] last:border-0">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--lp-surface-elevated)]">
        <Icon className="h-3 w-3 text-[var(--lp-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--lp-text-secondary)] leading-snug truncate">{text}</p>
        <p className="text-[10px] text-[var(--lp-text-muted)]">{time}</p>
      </div>
    </div>
  )
}

export function ProductDashboard() {
  return (
    <Reveal variant="up" delay={500}>
      <div className="relative mx-auto max-w-5xl mt-[-2rem] px-4 sm:px-0">
        {/* Atmospheric glow behind dashboard */}
        <div className="lp-glow" style={{ width: '600px', height: '400px', left: '50%', top: '30%', transform: 'translate(-50%, -50%)' }} />

        {/* Dashboard frame */}
        <div className="relative rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--lp-border)] bg-[var(--lp-surface)]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md bg-[var(--lp-bg)] border border-[var(--lp-border)] text-[11px] text-[var(--lp-text-muted)]">
                app.actos.io/dashboard
              </div>
            </div>
            <div className="w-12" />
          </div>

          {/* Dashboard content */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--lp-text)]">Executive Overview</h3>
                <p className="text-[11px] text-[var(--lp-text-muted)]">Monday, August 19 2026</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                  All systems operational
                </span>
              </div>
            </div>

            {/* KPI Cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Revenue" value="$284,500" change="+12.5%" trend="up" icon={DollarSign} />
              <KpiCard label="Active Users" value="1,247" change="+8.2%" trend="up" icon={Users} />
              <KpiCard label="Operations" value="94.2%" change="+2.1%" trend="up" icon={Activity} />
              <KpiCard label="Inventory" value="12,840" change="-3.1%" trend="down" icon={Box} />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Revenue chart */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Revenue Trend</span>
                  <span className="text-[11px] text-[var(--lp-text-muted)]">Last 12 months</span>
                </div>
                <Sparkline data={[32, 38, 35, 42, 40, 55, 48, 60, 58, 72, 68, 85]} />
                <div className="flex justify-between mt-2 text-[10px] text-[var(--lp-text-muted)]">
                  <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span>
                  <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                </div>
              </div>

              {/* Operations health */}
              <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Operations Health</span>
                <div className="mt-3 space-y-3">
                  {[
                    { label: 'Uptime', value: '99.9%', bar: 99 },
                    { label: 'Workflow Success', value: '96.4%', bar: 96 },
                    { label: 'SLA Compliance', value: '98.1%', bar: 98 },
                    { label: 'Task Completion', value: '87.3%', bar: 87 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--lp-text-secondary)]">{item.label}</span>
                        <span className="text-[var(--lp-text)] font-medium">{item.value}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-[var(--lp-bg)]">
                        <div className="h-full rounded-full bg-[var(--lp-accent)]" style={{ width: `${item.bar}%`, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Third row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Tasks */}
              <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Tasks</span>
                  <span className="text-[10px] text-[var(--lp-accent)]">12 active</span>
                </div>
                <TaskRow title="Review Q3 budget proposal" status="pending" priority="high" />
                <TaskRow title="Approve vendor contract" status="pending" priority="high" />
                <TaskRow title="Update inventory forecast" status="pending" priority="medium" />
                <TaskRow title="Onboard new team member" status="done" priority="low" />
              </div>

              {/* AI Insights */}
              <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="h-3 w-3 text-[var(--lp-accent)]" />
                  <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">AI Insights</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { text: 'Revenue growth accelerating — projected +18% next quarter', icon: TrendingUp },
                    { text: '3 inventory items approaching reorder threshold', icon: AlertTriangle },
                    { text: 'Team velocity improved 12% this sprint', icon: Zap },
                  ].map((insight) => (
                    <div key={insight.text} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--lp-bg)] border border-[var(--lp-border)]">
                      <insight.icon className="h-3 w-3 shrink-0 mt-0.5 text-[var(--lp-accent)]" />
                      <p className="text-[11px] leading-snug text-[var(--lp-text-secondary)]">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Notifications</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--lp-accent)] text-[9px] font-bold text-white">4</span>
                </div>
                <NotifRow text="Purchase order PO-2026-089 approved" time="2 min ago" icon={CheckCircle2} />
                <NotifRow text="Low stock alert: MacBook Pro 16&quot;" time="15 min ago" icon={AlertTriangle} />
                <NotifRow text="Meeting: Q3 Planning in 30 minutes" time="28 min ago" icon={Clock} />
                <NotifRow text="New lead assigned: TechCorp Inc." time="1 hr ago" icon={Bell} />
              </div>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--lp-bg)] to-transparent pointer-events-none" />
        </div>
      </div>
    </Reveal>
  )
}
