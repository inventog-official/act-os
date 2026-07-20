'use client'

import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'

const stats = [
  {
    title: 'Total Revenue',
    value: formatCurrency(28450),
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    title: 'Active Users',
    value: formatNumber(1247),
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    title: 'Orders',
    value: '1,423',
    change: '-3.1%',
    trend: 'down',
    icon: ShoppingCart,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  {
    title: 'Conversion Rate',
    value: '3.24%',
    change: '+1.8%',
    trend: 'up',
    icon: Activity,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
  },
]

export function RevenueCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
