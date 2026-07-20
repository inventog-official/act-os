'use client'

import { useState, use } from 'react'
import { Plus, Users, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  lead: string
  members: string[]
}

const initialTeams: Team[] = [
  { id: '1', name: 'Design', description: 'Product design and user experience', memberCount: 4, lead: 'Sarah Chen', members: ['SC', 'ED', 'AK', 'LW'] },
  { id: '2', name: 'Engineering', description: 'Backend and frontend development', memberCount: 6, lead: 'Mike Johnson', members: ['MJ', 'JW', 'SC', 'AK', 'LW', 'ED'] },
  { id: '3', name: 'Marketing', description: 'Growth and brand marketing', memberCount: 3, lead: 'Emily Davis', members: ['ED', 'SC', 'MJ'] },
  { id: '4', name: 'Product', description: 'Product strategy and roadmap', memberCount: 2, lead: 'Alex Kim', members: ['AK', 'LW'] },
]

export default function TeamsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const [teams, setTeams] = useState(initialTeams)
  const [showNew, setShowNew] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', description: '' })

  const handleCreate = () => {
    if (!newTeam.name.trim()) return
    setTeams(prev => [{
      id: crypto.randomUUID(),
      name: newTeam.name,
      description: newTeam.description,
      memberCount: 1,
      lead: 'You',
      members: ['You'],
    }, ...prev])
    setShowNew(false)
    setNewTeam({ name: '', description: '' })
    toast.success('Team created')
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input label="Team Name" value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Design Team" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                  <textarea className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300" value={newTeam.description} onChange={e => setNewTeam(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map(team => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Users className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <p className="text-sm text-zinc-500">{team.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Manage Members</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {team.members.map((m, i) => (
                      <Avatar key={i} className="h-8 w-8 border-2 border-white dark:border-zinc-950">
                        <AvatarFallback className="text-xs">{m}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{team.memberCount} members</Badge>
                    <p className="text-xs text-zinc-400 mt-1">Lead: {team.lead}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
