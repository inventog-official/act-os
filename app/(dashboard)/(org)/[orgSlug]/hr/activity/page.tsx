'use client'

import { useState, useEffect, use } from 'react'
import { Activity, History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getHrTimeline } from '@/lib/actions/hr'

const RESOURCE_LABELS: Record<string, string> = {
  hr_departments: 'Department',
  hr_employees: 'Employee',
  hr_work_schedules: 'Work schedule',
  hr_attendance: 'Attendance',
  hr_holidays: 'Holiday',
  hr_leave_requests: 'Leave request',
  hr_leave_types: 'Leave type',
  hr_job_openings: 'Job opening',
  hr_candidates: 'Candidate',
  hr_interviews: 'Interview',
  hr_offers: 'Offer',
  hr_onboarding_templates: 'Onboarding template',
  hr_onboarding_assignments: 'Onboarding',
  hr_onboarding_tasks: 'Onboarding task',
  hr_offboarding_requests: 'Offboarding',
  hr_performance_cycles: 'Performance cycle',
  hr_performance_reviews: 'Review',
  hr_goals: 'Goal',
  hr_compensation: 'Compensation',
}

export default function ActivityPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    getHrTimeline(currentOrganization.id)
      .then(setActivities)
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">HR Activity</h1>
            <p className="text-sm text-zinc-500 mt-1">Audit trail of HR actions</p>
          </div>

          {activities.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="HR actions will be recorded here." />
          ) : (
            <Card>
              <CardContent className="p-5">
                <div className="space-y-1">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Activity className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{a.user?.email || 'System'}</span>
                          <span className="text-zinc-500"> {a.action.replace(/_/g, ' ')} </span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{RESOURCE_LABELS[a.resource] || a.resource.replace(/^hr_/, '').replace(/_/g, ' ')}</span>
                        </p>
                        {a.metadata && Object.keys(a.metadata).length > 0 && (
                          <p className="text-xs text-zinc-500 truncate">{Object.entries(a.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}</p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date(a.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </HrShell>
    </DashboardShell>
  )
}