'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
  { name: 'Jan', revenue: 24000, expenses: 18000 },
  { name: 'Feb', revenue: 32000, expenses: 21000 },
  { name: 'Mar', revenue: 28000, expenses: 19000 },
  { name: 'Apr', revenue: 45000, expenses: 25000 },
  { name: 'May', revenue: 38000, expenses: 22000 },
  { name: 'Jun', revenue: 52000, expenses: 28000 },
  { name: 'Jul', revenue: 48000, expenses: 26000 },
  { name: 'Aug', revenue: 58000, expenses: 30000 },
  { name: 'Sep', revenue: 62000, expenses: 32000 },
  { name: 'Oct', revenue: 55000, expenses: 29000 },
  { name: 'Nov', revenue: 68000, expenses: 35000 },
  { name: 'Dec', revenue: 75000, expenses: 38000 },
]

export function RevenueChart() {
  return (
    <Card className="lg:col-span-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121216]/90 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight font-sans text-neutral-900 dark:text-white">
          Revenue Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="appleRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity={0.35} />
                  <stop offset="90%" stopColor="#007AFF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-black/[0.04] dark:text-white/[0.06]" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8E8E93' }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(20, 20, 24, 0.9)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 600, color: '#FFFFFF', marginBottom: 2 }}
                formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#007AFF"
                fill="url(#appleRevenueGradient)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#007AFF', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
