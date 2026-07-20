'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Skeleton } from '@/components/ui/skeleton'

const RevenueCards = dynamic(() => import('./revenue-cards').then(m => ({ default: m.RevenueCards })), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  ),
})

const RevenueChart = dynamic(() => import('./revenue-chart').then(m => ({ default: m.RevenueChart })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

const DealsChart = dynamic(() => import('./deals-chart').then(m => ({ default: m.DealsChart })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

const RecentActivity = dynamic(() => import('./recent-activity').then(m => ({ default: m.RecentActivity })), {
  ssr: false,
  loading: () => <ListSkeleton />,
})

const TaskWidget = dynamic(() => import('./task-widget').then(m => ({ default: m.TaskWidget })), {
  ssr: false,
  loading: () => <ListSkeleton />,
})

const CalendarWidget = dynamic(() => import('./calendar-widget').then(m => ({ default: m.CalendarWidget })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

const ProjectsWidget = dynamic(() => import('./projects-widget').then(m => ({ default: m.ProjectsWidget })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

const RecentClients = dynamic(() => import('./recent-clients').then(m => ({ default: m.RecentClients })), {
  ssr: false,
  loading: () => <ListSkeleton />,
})

const NotificationsWidget = dynamic(() => import('./notifications-widget').then(m => ({ default: m.NotificationsWidget })), {
  ssr: false,
  loading: () => <ListSkeleton />,
})

const QuickActions = dynamic(() => import('./quick-actions').then(m => ({ default: m.QuickActions })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

const AiWidget = dynamic(() => import('./ai-widget').then(m => ({ default: m.AiWidget })), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
})

function WidgetSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardPage({ orgSlug }: { orgSlug: string }) {
  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>

        <Suspense fallback={null}>
          <RevenueCards />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <Suspense fallback={<WidgetSkeleton />}>
            <RevenueChart />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <DealsChart />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Suspense fallback={<ListSkeleton />}>
            <RecentActivity />
          </Suspense>
          <Suspense fallback={<ListSkeleton />}>
            <TaskWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <CalendarWidget />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<WidgetSkeleton />}>
            <ProjectsWidget />
          </Suspense>
          <Suspense fallback={<ListSkeleton />}>
            <RecentClients />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Suspense fallback={<ListSkeleton />}>
            <NotificationsWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <QuickActions />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <AiWidget />
          </Suspense>
        </div>
      </div>
    </DashboardShell>
  )
}
