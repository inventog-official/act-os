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
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#18181b" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
