'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { UserPlus, Loader2, MoreHorizontal, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials, randomColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import type { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  role: string
  initials: string
  color: string
}

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Employee: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  Guest: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

export default function MembersPage() {
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setMembers([
          { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', initials: 'AU', color: randomColor() },
          { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'Manager', initials: 'SC', color: randomColor() },
          { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Employee', initials: 'MJ', color: randomColor() },
        ])
        return
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select('user_id, created_at')
        .eq('organization_id', currentOrganization.id)

      if (error) throw error

      const memberList: Member[] = (data || []).map((m: any, i: number) => ({
        id: m.user_id || String(i),
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i === 0 ? 'Admin' : 'Employee',
        initials: `U${i + 1}`,
        color: randomColor(),
      }))

      setMembers(memberList.length > 0 ? memberList : [
        { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', initials: 'AU', color: randomColor() },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const handleInvite = async () => {
    if (!inviteEmail) return
    setIsInviting(true)
    try {
      if (!isSupabaseConfigured()) {
        toast.success('Invitation sent (mock)')
        setMembers(prev => [...prev, {
          id: crypto.randomUUID(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: 'Employee',
          initials: inviteEmail.slice(0, 2).toUpperCase(),
          color: randomColor(),
        }])
        setInviteOpen(false)
        setInviteEmail('')
        return
      }

      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail)
      if (error) throw error
      toast.success('Invitation sent!')
      setInviteOpen(false)
      setInviteEmail('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsInviting(false)
    }
  }

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: row.original.color, color: 'white' }} className="text-xs">
              {row.original.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-zinc-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="secondary" className={roleColors[row.original.role] || ''}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Change Role</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Members</h2>
          <p className="text-sm text-zinc-500">Manage your team members and their roles</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />Invite Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {members.length > 0 ? (
            <DataTable columns={columns} data={members} pageSize={10} />
          ) : (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Invite your first team member to get started."
              action={
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />Invite Member
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
