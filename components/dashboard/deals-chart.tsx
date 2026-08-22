'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
  { stage: 'New', value: 85000, fill: '#0A84FF' },
  { stage: 'Qualified', value: 120000, fill: '#5E5CE6' },
  { stage: 'Proposal', value: 95000, fill: '#BF5AF2' },
  { stage: 'Negotiation', value: 150000, fill: '#FF375F' },
  { stage: 'Won', value: 200000, fill: '#30D158' },
  { stage: 'Lost', value: 45000, fill: '#8E8E93' },
]

export function DealsChart() {
  return (
    <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121216]/90 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight font-sans text-neutral-900 dark:text-white">
          Pipeline Value by Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-black/[0.04] dark:text-white/[0.06]" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#8E8E93' }} axisLine={false} tickLine={false} dy={8} />
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
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
