'use client'

import { useState, use } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts'

const monthlyRevenue = [
  { month: 'Jan', revenue: 18500, expenses: 12000, profit: 6500 },
  { month: 'Feb', revenue: 22000, expenses: 13500, profit: 8500 },
  { month: 'Mar', revenue: 19500, expenses: 12800, profit: 6700 },
  { month: 'Apr', revenue: 25400, expenses: 14200, profit: 11200 },
  { month: 'May', revenue: 28200, expenses: 15100, profit: 13100 },
  { month: 'Jun', revenue: 31000, expenses: 16800, profit: 14200 },
  { month: 'Jul', revenue: 28900, expenses: 15900, profit: 13000 },
  { month: 'Aug', revenue: 32500, expenses: 17200, profit: 15300 },
  { month: 'Sep', revenue: 35800, expenses: 18100, profit: 17700 },
  { month: 'Oct', revenue: 34100, expenses: 17500, profit: 16600 },
  { month: 'Nov', revenue: 39200, expenses: 19200, profit: 20000 },
  { month: 'Dec', revenue: 42800, expenses: 20500, profit: 22300 },
]

const userGrowth = [
  { month: 'Jan', users: 450, active: 320 },
  { month: 'Feb', users: 520, active: 380 },
  { month: 'Mar', users: 610, active: 450 },
  { month: 'Apr', users: 720, active: 530 },
  { month: 'May', users: 850, active: 620 },
  { month: 'Jun', users: 980, active: 710 },
  { month: 'Jul', users: 1050, active: 780 },
  { month: 'Aug', users: 1180, active: 860 },
  { month: 'Sep', users: 1320, active: 950 },
  { month: 'Oct', users: 1450, active: 1040 },
  { month: 'Nov', users: 1580, active: 1150 },
  { month: 'Dec', users: 1720, active: 1280 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {p.name === 'users' || p.name === 'active' ? formatNumber(p.value) : formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-zinc-500">Track your business performance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Total Revenue', value: formatCurrency(342800), change: '+18.2%', trend: 'up', icon: DollarSign },
            { title: 'Total Users', value: formatNumber(1720), change: '+12.5%', trend: 'up', icon: Users },
            { title: 'Orders', value: '8,432', change: '+8.7%', trend: 'up', icon: ShoppingCart },
            { title: 'Growth Rate', value: '23.4%', change: '+4.2%', trend: 'up', icon: Activity },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                      <Icon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.title}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#09090b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#09090b" fill="url(#revenueGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="users" stroke="#09090b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="active" stroke="#a1a1aa" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#09090b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <div className="space-y-4 w-full">
                  {[
                    { name: 'Website Redesign', value: 45, color: '#3b82f6' },
                    { name: 'Mobile App v2', value: 25, color: '#10b981' },
                    { name: 'API Integration', value: 15, color: '#f59e0b' },
                    { name: 'Brand Refresh', value: 10, color: '#8b5cf6' },
                    { name: 'Dashboard Analytics', value: 5, color: '#ec4899' },
                  ].map(project => (
                    <div key={project.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{project.name}</span>
                        <span className="text-zinc-500">{project.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${project.value}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
