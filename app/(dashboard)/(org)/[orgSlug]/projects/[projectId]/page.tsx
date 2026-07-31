'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, MoreHorizontal, Loader2, Calendar, Clock, Users, Target, BarChart3, CheckSquare, Layers, ListTodo, Kanban, FileText, Milestone, Timer, FolderKanban, Sparkles, Plus, UserPlus, Shield, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { ProjectAI } from '@/components/projects/project-ai'

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-emerald-500' },
  on_hold: { label: 'On Hold', color: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-zinc-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
}

export default function ProjectDetailPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<any[]>([])
  const [orgMembers, setOrgMembers] = useState<any[]>([])
  const [budgetData, setBudgetData] = useState<{ timeSpend: number; expenseSpend: number; hasTimeEntries: boolean; hasExpenses: boolean }>({ timeSpend: 0, expenseSpend: 0, hasTimeEntries: false, hasExpenses: false })
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('developer')

  const fetchProject = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const { data: p } = await supabase.from('projects').select('*').eq('id', projectId).is('deleted_at', null).single()
      setProject(p)

      const { data: t } = await supabase.from('tasks').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false })
      setTasks(t || [])

      const { data: a } = await supabase.from('project_activities').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20)
      setActivities(a || [])

      const { data: m } = await supabase
        .from('project_members')
        .select('*, user:auth.users(id, email, user_metadata)')
        .eq('project_id', projectId)
      setMembers(m || [])

      const { data: om } = await supabase
        .from('organization_members')
        .select('user_id, user:auth.users(id, email, user_metadata)')
        .eq('organization_id', currentOrganization.id)
      setOrgMembers(om || [])

      const { data: timeRows } = await supabase
        .from('time_entries')
        .select('billable, billable_rate, duration_minutes, task:tasks(project_id)')
        .eq('task.project_id', projectId)
        .is('deleted_at', null)
      const { data: expenseRows } = await supabase
        .from('finance_expenses')
        .select('amount, tax_amount, billable')
        .eq('project_id', projectId)
        .is('deleted_at', null)
      setBudgetData({
        timeSpend: (timeRows || []).reduce((sum, t: any) =>
          sum + ((t.duration_minutes || 0) / 60) * (Number(t.billable_rate) || 0), 0),
        expenseSpend: (expenseRows || []).reduce((sum, e: any) =>
          sum + Number(e.amount || 0) + Number(e.tax_amount || 0), 0),
        hasTimeEntries: (timeRows || []).length > 0,
        hasExpenses: (expenseRows || []).length > 0,
      })
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [projectId, currentOrganization, supabase])

  useEffect(() => { fetchProject() }, [fetchProject])

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
    </DashboardShell>
  )

  if (!project) return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="text-center py-16"><p className="text-zinc-500">Project not found</p></div>
    </DashboardShell>
  )

  const handleAddMember = async () => {
    if (!newMemberId) return
    try {
      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: newMemberId,
        role: newMemberRole,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Member added')
      setShowAddMember(false)
      setNewMemberId('')
      setNewMemberRole('developer')
      const { data: m } = await supabase.from('project_members').select('*, user:auth.users(id, email, user_metadata)').eq('project_id', projectId)
      setMembers(m || [])
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
      if (error) throw error
      toast.success('Member removed')
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (err: any) { toast.error(err.message) }
  }

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.from('project_members').update({ role }).eq('project_id', projectId).eq('user_id', userId)
      if (error) throw error
      toast.success('Role updated')
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m))
    } catch (err: any) { toast.error(err.message) }
  }

  const cfg = statusConfig[project.status] || statusConfig.planning
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0
  const budgetSpent = budgetData.timeSpend + budgetData.expenseSpend
  const budgetPct = project.budget ? Math.min(Math.round((budgetSpent / Number(project.budget)) * 100), 100) : 0

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <div className={`h-2.5 w-2.5 rounded-full ${cfg.color}`} />
                <Badge variant={project.priority === 'urgent' ? 'destructive' : project.priority === 'high' ? 'warning' : 'secondary'} className="text-[10px]">{project.priority}</Badge>
                <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
              </div>
              <p className="text-sm text-zinc-500 mt-1">{project.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/${orgSlug}/projects/${projectId}/tasks`)}>
              <Kanban className="h-4 w-4 mr-1" />Board
            </Button>
            <Button variant="outline" size="icon-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950"><Target className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-xs text-zinc-500">Tasks</p><p className="text-lg font-semibold">{completedTasks}/{totalTasks}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950"><BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-xs text-zinc-500">Progress</p><p className="text-lg font-semibold">{progress}%</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-950"><Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <div><p className="text-xs text-zinc-500">Due</p><p className="text-lg font-semibold">{project.end_date ? formatDate(project.end_date) : '—'}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-950"><Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-xs text-zinc-500">Budget</p><p className="text-lg font-semibold">{project.budget ? formatCurrency(project.budget) : '—'}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className={budgetSpent > 0 ? 'block' : 'hidden'}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Budget Tracking</h3>
              <div className="text-sm">
                <span className="font-semibold">{formatCurrency(budgetSpent)}</span>
                <span className="text-zinc-500"> spent of {project.budget ? formatCurrency(project.budget) : '—'}</span>
              </div>
            </div>
            <Progress value={budgetPct} className="h-2.5" />
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
              <span>{budgetPct}% utilized</span>
              <span>{formatCurrency(Math.max(project.budget - budgetSpent, 0))} remaining</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span>Time: <strong>{formatCurrency(budgetData.timeSpend)}</strong></span>
              <span>Expenses: <strong>{formatCurrency(budgetData.expenseSpend)}</strong></span>
              {!budgetData.hasTimeEntries && !budgetData.hasExpenses && (
                <span>No billable time entries or expenses recorded yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="sprints">Sprints</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4">Project Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Status</span><span>{cfg.label}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Priority</span><span className="capitalize">{project.priority}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Start</span><span>{project.start_date ? formatDate(project.start_date) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">End</span><span>{project.end_date ? formatDate(project.end_date) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Budget</span><span>{project.budget ? formatCurrency(project.budget) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Client</span><span>{project.client_name || '—'}</span></div>
                    {project.lead_id && <div className="flex justify-between"><span className="text-zinc-500">Lead</span><span className="text-blue-500">Linked</span></div>}
                    {project.deal_id && <div className="flex justify-between"><span className="text-zinc-500">Deal</span><span className="text-blue-500">Linked</span></div>}
                    <div className="flex justify-between"><span className="text-zinc-500">Owner</span><span>{project.owner_id ? 'Assigned' : '—'}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4">Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Overall</span><span>{progress}%</span></div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      {['todo', 'in_progress', 'done'].map(status => {
                        const count = tasks.filter(t => t.status === status).length
                        const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
                        return (
                          <div key={status} className="flex items-center gap-2 text-sm">
                            <div className={`h-2 w-2 rounded-full ${status === 'todo' ? 'bg-zinc-300' : status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                            <span className="flex-1 capitalize">{status.replace('_', ' ')}</span>
                            <span className="text-zinc-500">{count} ({pct}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No tasks yet</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className={`h-2 w-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-zinc-300'}`} />
                    <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-zinc-400' : ''}`}>{task.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{task.priority}</Badge>
                    {task.due_date && <span className="text-xs text-zinc-400">{formatDate(task.due_date)}</span>}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-4">Manage milestones on the dedicated page</p>
              <Button onClick={() => router.push(`/${orgSlug}/projects/${projectId}/milestones`)}>
                <Milestone className="h-4 w-4 mr-2" />View Milestones
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sprints" className="mt-6">
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-4">Manage sprints on the dedicated page</p>
              <Button onClick={() => router.push(`/${orgSlug}/projects/${projectId}/sprints`)}>
                <Layers className="h-4 w-4 mr-2" />View Sprints
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddMember(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />Add Member
                </Button>
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{member.user?.user_metadata?.name?.charAt(0) || member.user_id?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.user?.user_metadata?.name || member.user?.email || member.user_id}</p>
                        <p className="text-xs text-zinc-500">{member.user?.email}</p>
                      </div>
                      <Select value={member.role} onValueChange={(v) => handleChangeRole(member.user_id, v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="project_manager">Project Manager</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveMember(member.user_id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add Member</DialogTitle>
                  <DialogDescription>Add a user to this project</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">User</label>
                    <Select value={newMemberId} onValueChange={setNewMemberId}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {orgMembers
                          .filter(om => !members.find(m => m.user_id === om.user_id))
                          .map(om => (
                            <SelectItem key={om.user_id} value={om.user_id}>
                              {om.user?.user_metadata?.name || om.user?.email || om.user_id}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
                    <Button onClick={handleAddMember}>Add</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-4">Upload and manage files on the dedicated page</p>
              <Button onClick={() => router.push(`/${orgSlug}/projects/${projectId}/files`)}>
                <FileText className="h-4 w-4 mr-2" />View Files
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No activity yet</p>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                    <div>
                      <p>{a.description || a.action}</p>
                      <p className="text-xs text-zinc-400">{formatDate(a.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <ProjectAI project={project} tasks={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
