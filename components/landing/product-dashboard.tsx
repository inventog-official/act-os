'use client'

import { useEffect, useRef, useState } from 'react'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

/* Monochrome Sparkline Chart */
function MonochromeSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 48
  const w = 240
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function ProductDashboard() {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative px-4 sm:px-6 -mt-10 sm:-mt-16 pb-20 sm:pb-32 overflow-hidden">
      {/* Abstract Colorful Light Field Behind the Monochrome Product */}
      <GradientAtmosphere variant="cosmic" intensity="medium" />

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-5xl transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(40px)',
        }}
      >
        {/* Main Dashboard Frame - Pure Black / White / Gray UI */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0A0A0A] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[12px] font-normal text-[#666666]">ACT OS · Operations Console</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#A1A1A1] flex items-center gap-1.5 font-normal">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live Sync
              </span>
            </div>
          </div>

          {/* Clean Dashboard Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue */}
              <div className="p-5 rounded-xl bg-black border border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] text-[#666666] uppercase tracking-wider mb-2">
                  <span>Revenue (MRR)</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#A1A1A1]" />
                </div>
                <div className="text-2xl font-normal text-white tracking-tight">$284,500</div>
                <div className="text-[12px] text-[#A1A1A1] mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12.4% this month
                </div>
              </div>

              {/* Operations Health */}
              <div className="p-5 rounded-xl bg-black border border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] text-[#666666] uppercase tracking-wider mb-2">
                  <span>Operations</span>
                  <Activity className="h-3.5 w-3.5 text-[#A1A1A1]" />
                </div>
                <div className="text-2xl font-normal text-white tracking-tight">99.4%</div>
                <div className="text-[12px] text-[#A1A1A1] mt-1">42/42 workflows active</div>
              </div>

              {/* Active Tasks */}
              <div className="p-5 rounded-xl bg-black border border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] text-[#666666] uppercase tracking-wider mb-2">
                  <span>Pending Tasks</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#A1A1A1]" />
                </div>
                <div className="text-2xl font-normal text-white tracking-tight">14</div>
                <div className="text-[12px] text-[#A1A1A1] mt-1">3 require executive review</div>
              </div>

              {/* Inventory Status */}
              <div className="p-5 rounded-xl bg-black border border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] text-[#666666] uppercase tracking-wider mb-2">
                  <span>Inventory SKUs</span>
                  <span className="text-[10px] text-[#A1A1A1] px-1.5 py-0.5 rounded border border-white/[0.1]">Healthy</span>
                </div>
                <div className="text-2xl font-normal text-white tracking-tight">12,840</div>
                <div className="text-[12px] text-[#A1A1A1] mt-1">2 reorders scheduled</div>
              </div>
            </div>

            {/* Middle Row: Revenue Chart & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Trend Visual */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-black border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[11px] text-[#666666] uppercase tracking-wider font-medium">Performance Velocity</span>
                      <p className="text-lg font-normal text-white mt-0.5">Enterprise ARR Trajectory</p>
                    </div>
                    <span className="text-[12px] text-[#A1A1A1]">Past 12 Months</span>
                  </div>
                  <div className="py-4">
                    <MonochromeSparkline data={[24, 30, 28, 42, 48, 45, 62, 70, 68, 85, 92, 108]} />
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.05] text-[11px] text-[#666666]">
                  <span>Q1</span>
                  <span>Q2</span>
                  <span>Q3</span>
                  <span>Q4 Projected</span>
                </div>
              </div>

              {/* Task List */}
              <div className="p-6 rounded-xl bg-black border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] text-[#666666] uppercase tracking-wider font-medium">Critical Action Items</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Authorize Q3 vendor disbursement', tag: 'Finance' },
                    { title: 'Review inventory threshold: SKU-884', tag: 'Inventory' },
                    { title: 'Approve hiring offer: Head of Ops', tag: 'HR' },
                    { title: 'Sync enterprise pipeline with CRM', tag: 'Sales' },
                  ].map((task) => (
                    <div key={task.title} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <div className="h-3.5 w-3.5 rounded-[4px] border border-white/20 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white truncate font-normal">{task.title}</p>
                        <span className="text-[11px] text-[#666666]">{task.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Embedded AI Insight */}
            <div className="p-5 rounded-xl bg-black border border-white/[0.08] flex items-start sm:items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.15] bg-[#111111] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-white uppercase tracking-wider">AI Executive Brief</span>
                  <span className="text-[10px] text-[#666666]">· 2 minutes ago</span>
                </div>
                <p className="text-[13px] text-[#A1A1A1] mt-0.5 leading-relaxed font-normal">
                  Operations are tracking 14% ahead of projection. Recommended action: Approve auto-replenishment for high-velocity SKUs to prevent stock bottleneck next week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
