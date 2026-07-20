'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
  { stage: 'New', value: 85000, fill: '#3b82f6' },
  { stage: 'Qualified', value: 120000, fill: '#8b5cf6' },
  { stage: 'Proposal', value: 95000, fill: '#6366f1' },
  { stage: 'Negotiation', value: 150000, fill: '#ec4899' },
  { stage: 'Won', value: 200000, fill: '#10b981' },
  { stage: 'Lost', value: 45000, fill: '#ef4444' },
]

export function DealsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Value by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
