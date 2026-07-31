'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { BarChart3, Users, DollarSign, Clock, FolderKanban, CheckSquare, TrendingUp, AlertTriangle, Loader2, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, formatCurrency, formatNumber, cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  planning: '#3b82f6',
  active: '#10b981',
  on_hold: '#f59e0b',
  completed: '#6b7280',
  cancelled: '#ef4444',
}

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const mockAssignees = [
  { name: 'Alice Chen', email: 'alice@example.com' },
  { name: 'Bob Martinez', email: 'bob@example.com' },
  { name: 'Carol Johnson', email: 'carol@example.com' },
  { name: 'David Kim', email: 'david@example.com' },
]

export default function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const [pRes, tRes, teRes] = await Promise.all([
        supabase.from('projects').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null),
        supabase.from('tasks').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null),
        supabase.from('time_entries').select('*, task:tasks(title, project_id)').is('deleted_at', null),
      ])
      setProjects(pRes.data || [])
      setTasks(tRes.data || [])
      setTimeEntries(teRes.data || [])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const activeProjects = projects.filter(p => p.status === 'active')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalHours = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60
  const billableHours = timeEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60

  const statusDistribution = ['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => ({
    name: statusLabels[s],
    value: projects.filter(p => p.status === s).length,
    color: statusColors[s],
  }))
  const totalStatus = statusDistribution.reduce((sum, s) => sum + s.value, 0) || 1

  const assigneeTaskStats = mockAssignees.map(a => {
    const assigned = tasks.filter(t => t.assignee_id === a.name)
    const done = assigned.filter(t => t.status === 'done')
    return {
      ...a,
      total: assigned.length,
      completed: done.length,
      progress: assigned.length > 0 ? Math.round((done.length / assigned.length) * 100) : 0,
    }
  })

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
    </DashboardShell>
  )

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Reports</h1>
            <p className="text-sm text-zinc-500">Project insights and analytics</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950"><FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-xs text-zinc-500">Total Projects</p><p className="text-2xl font-bold">{projects.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950"><CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-xs text-zinc-500">Tasks</p><p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-950"><Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
              <div><p className="text-xs text-zinc-500">Total Hours</p><p className="text-2xl font-bold">{totalHours.toFixed(1)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-950"><DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-xs text-zinc-500">Active Projects</p><p className="text-2xl font-bold">{activeProjects.length}</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progress">
          <TabsList>
            <TabsTrigger value="progress">Project Progress</TabsTrigger>
            <TabsTrigger value="productivity">Team Productivity</TabsTrigger>
            <TabsTrigger value="budget">Budget Report</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-8 text-center">No projects</p>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {statusDistribution.filter(s => s.value > 0).map(s => (
                          <div
                            key={s.name}
                            className="h-full transition-all"
                            style={{ width: `${(s.value / totalStatus) * 100}%`, backgroundColor: s.color }}
                          />
                        ))}
                      </div>
                      <div className="space-y-3">
                        {statusDistribution.filter(s => s.value > 0).map(s => (
                          <div key={s.name} className="flex items-center gap-3 text-sm">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="flex-1">{s.name}</span>
                            <span className="font-medium">{s.value}</span>
                            <span className="text-zinc-400">{Math.round((s.value / totalStatus) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>All Projects</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-4 text-center">No projects</p>
                  ) : (
                    projects.map(p => {
                      const projectTasks = tasks.filter(t => t.project_id === p.id)
                      const done = projectTasks.filter(t => t.status === 'done').length
                      const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : p.progress || 0
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={cn('h-2 w-2 rounded-full', statusColors[p.status]?.replace('#', 'bg-[#') + ']' || 'bg-zinc-400')} style={{ backgroundColor: statusColors[p.status] }} />
                              <span className="font-medium">{p.name}</span>
                            </div>
                            <span className="text-zinc-500">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <Badge variant="outline" className="text-[9px]">{statusLabels[p.status] || p.status}</Badge>
                            {p.end_date && <span>Due {formatDate(p.end_date)}</span>}
                            <span className="ml-auto">{done}/{projectTasks.length} tasks</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Task Completion by Assignee</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {assigneeTaskStats.map(a => (
                    <div key={a.name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium">
                            {a.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{a.name}</p>
                            <p className="text-xs text-zinc-400">{a.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{a.completed}/{a.total}</p>
                          <p className="text-xs text-zinc-400">{a.progress}% complete</p>
                        </div>
                      </div>
                      <Progress value={a.progress} className="h-2" />
                    </div>
                  ))}
                  {assigneeTaskStats.every(a => a.total === 0) && (
                    <p className="text-sm text-zinc-400 py-4 text-center">No task assignments found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {[
                { label: 'Total Assigned Tasks', value: assigneeTaskStats.reduce((s, a) => s + a.total, 0), color: 'bg-blue-500', icon: CheckSquare },
                { label: 'Total Completed', value: assigneeTaskStats.reduce((s, a) => s + a.completed, 0), color: 'bg-emerald-500', icon: TrendingUp },
                { label: 'Avg Completion Rate', value: `${Math.round(assigneeTaskStats.reduce((s, a) => s + a.progress, 0) / Math.max(assigneeTaskStats.length, 1))}%`, color: 'bg-purple-500', icon: BarChart3 },
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn('rounded-lg p-2.5', stat.color.replace('bg-', 'bg-').replace('-500', '-100 dark:bg-').replace('bg-', '') + '-950')} style={{ backgroundColor: stat.color + '20' }}>
                        <Icon className={cn('h-5 w-5', stat.color.replace('bg-', 'text-').replace('-500', '-600 dark:text-').replace('text-', '') + '-400')} style={{ color: stat.color.replace('bg-', '#').replace('-500', '') }} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Budget vs Actual</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {projects.filter(p => p.budget).length === 0 ? (
                  <p className="text-sm text-zinc-400 py-8 text-center">No budget data available</p>
                ) : (
                  projects.filter(p => p.budget).map(p => {
                    const pctUsed = p.budget_used ? Math.min(Math.round((p.budget_used / p.budget) * 100), 100) : 0
                    const remaining = p.budget - (p.budget_used || 0)
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-zinc-500">{formatCurrency(p.budget)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pctUsed}%`, backgroundColor: pctUsed > 80 ? '#ef4444' : pctUsed > 60 ? '#f59e0b' : '#10b981' }}
                            />
                          </div>
                          <span className="text-xs font-mono text-zinc-500 min-w-[80px] text-right">
                            {formatCurrency(p.budget_used || 0)} / {formatCurrency(p.budget)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>{pctUsed}% used</span>
                          <span>·</span>
                          <span>{formatCurrency(remaining)} remaining</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Start Date</label>
                <Input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">End Date</label>
                <Input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950"><Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                  <div><p className="text-xs text-zinc-500">Total Hours</p><p className="text-2xl font-bold">{totalHours.toFixed(1)}</p></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                  <div><p className="text-xs text-zinc-500">Billable Hours</p><p className="text-2xl font-bold">{billableHours.toFixed(1)}</p></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-950"><BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                  <div><p className="text-xs text-zinc-500">Entries</p><p className="text-2xl font-bold">{timeEntries.length}</p></div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Recent Time Entries</CardTitle></CardHeader>
              <CardContent>
                {timeEntries.length === 0 ? (
                  <p className="text-sm text-zinc-400 py-8 text-center">No time entries</p>
                ) : (
                  <div className="space-y-2">
                    {timeEntries.slice(0, 10).map(e => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.task?.title || 'Unknown'}</p>
                          <p className="text-xs text-zinc-400">{formatDate(e.start_time)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.billable && <Badge variant="secondary" className="text-[9px]">Billable</Badge>}
                          <span className="text-sm font-mono">{e.duration_minutes ? `${Math.floor(e.duration_minutes / 60)}h ${e.duration_minutes % 60}m` : '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
