'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Workspace } from '@/lib/types/database'

export default function WorkspacePage() {
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)

  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchWorkspaces = async () => {
    if (!currentOrganization) return
    setLoading(true)
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .is('deleted_at', null)
      .order('name')
    setWorkspaces((data || []) as Workspace[])
    setLoading(false)
  }

  useEffect(() => { fetchWorkspaces() }, [currentOrganization])

  const handleCreate = async () => {
    if (!currentOrganization) return
    setSaving(true)
    const { error } = await supabase.from('workspaces').insert({
      name: newName,
      slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
      description: newDescription || null,
      organization_id: currentOrganization.id,
      created_by: (await supabase.auth.getUser()).data.user?.id || '',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Workspace created')
    setShowCreate(false)
    setNewName(''); setNewSlug(''); setNewDescription('')
    fetchWorkspaces()
  }

  const handleUpdate = async () => {
    if (!editingWorkspace) return
    setSaving(true)
    const { error } = await supabase
      .from('workspaces')
      .update({ name: newName, slug: newSlug, description: newDescription || null })
      .eq('id', editingWorkspace.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Workspace updated')
    setEditingWorkspace(null)
    fetchWorkspaces()
  }

  const handleDelete = async () => {
    if (!deletingWorkspace) return
    const { error } = await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingWorkspace.id)
    if (error) { toast.error(error.message); return }
    toast.success('Workspace deleted')
    setDeletingWorkspace(null)
    fetchWorkspaces()
  }

  const openEdit = (ws: Workspace) => {
    setEditingWorkspace(ws)
    setNewName(ws.name)
    setNewSlug(ws.slug)
    setNewDescription(ws.description || '')
  }

  if (!currentOrganization) {
    return <p className="text-sm text-zinc-500">Loading organization...</p>
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workspaces</h2>
          <p className="text-sm text-zinc-500">Manage workspaces within {currentOrganization.name}</p>
        </div>
        <Button size="sm" onClick={() => { setNewName(''); setNewSlug(''); setNewDescription(''); setShowCreate(true) }}>
          <Plus className="h-4 w-4 mr-1" /> New Workspace
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
          <CardDescription>Create and manage workspaces to organize projects and teams</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No workspaces yet. Create your first one.</p>
          ) : (
            <div className="space-y-3">
              {workspaces.map(ws => (
                <div key={ws.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div>
                    <p className="font-medium">{ws.name}</p>
                    <p className="text-xs text-zinc-500">{ws.slug}{ws.description ? ` — ${ws.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ws)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingWorkspace(ws)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>Add a new workspace to organize your work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Name" value={newName} onChange={(e: any) => setNewName(e.target.value)} placeholder="e.g. Engineering" />
            <Input label="Slug" value={newSlug} onChange={(e: any) => setNewSlug(e.target.value)} placeholder="engineering" hint="URL-friendly identifier" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950"
                value={newDescription}
                onChange={(e: any) => setNewDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingWorkspace} onOpenChange={(o) => { if (!o) setEditingWorkspace(null) }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update workspace details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Name" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            <Input label="Slug" value={newSlug} onChange={(e: any) => setNewSlug(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950"
                value={newDescription}
                onChange={(e: any) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkspace(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !newName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingWorkspace} onOpenChange={(o) => { if (!o) setDeletingWorkspace(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingWorkspace?.name}</strong>? This action can be reversed (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
