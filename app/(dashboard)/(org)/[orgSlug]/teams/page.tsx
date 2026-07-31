'use client'

import { useState, useEffect, use } from 'react'
import { Plus, Users, MoreHorizontal, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function TeamsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', description: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchTeams = async () => {
    if (!currentOrganization) return
    setLoading(true)
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(user_id)')
      .eq('organization_id', currentOrganization.id)
      .is('deleted_at', null)
      .order('name')
    setTeams((data || []) as any[])
    setLoading(false)
  }

  useEffect(() => { fetchTeams() }, [currentOrganization])

  const handleCreate = async () => {
    if (!currentOrganization || !newTeam.name.trim()) return
    const { error } = await supabase.from('teams').insert({
      name: newTeam.name,
      description: newTeam.description || null,
      organization_id: currentOrganization.id,
      workspace_id: null,
      created_by: (await supabase.auth.getUser()).data.user?.id || '',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Team created')
    setShowNew(false)
    setNewTeam({ name: '', description: '' })
    fetchTeams()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('teams').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
    if (error) { toast.error(error.message); return }
    toast.success('Team deleted')
    setDeleteId(null)
    fetchTeams()
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Teams</h1>
            <p className="text-sm text-zinc-500">{teams.length} teams</p>
          </div>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input label="Team Name" value={newTeam.name} onChange={(e: any) => setNewTeam(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Design Team" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                  <textarea className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300" value={newTeam.description} onChange={(e: any) => setNewTeam(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-500">No teams yet. Create your first team.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {teams.map((team: any) => (
              <Card key={team.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Users className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <p className="text-sm text-zinc-500">{team.description || 'No description'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Manage Members</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => setDeleteId(team.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{team.team_members?.length || 0} members</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This can be undone (soft delete).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
