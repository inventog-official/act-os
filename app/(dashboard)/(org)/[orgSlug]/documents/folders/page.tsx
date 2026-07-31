'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Folder, Plus, FileText, Trash2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getFolders, getDocuments, deleteFolder } from '@/lib/actions/documents'
import { FolderDialog } from '../library/folder-dialog'

export default function DocumentsFoldersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [folders, setFolders] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [f, d] = await Promise.all([
      getFolders(currentOrganization.id).catch(() => []),
      getDocuments(currentOrganization.id).catch(() => []),
    ])
    setFolders(f)
    setDocs(d)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const countFor = (folderId: string) => docs.filter((d) => d.folder_id === folderId).length

  const handleDelete = async (id: string) => {
    if (!currentOrganization?.id) return
    await deleteFolder(currentOrganization.id, id).catch(() => {})
    load()
  }

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          </div>
        </DocumentsShell>
      </DashboardShell>
    )
  }

  const rootFolders = folders.filter((f) => !f.parent_id)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <DocumentsShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Folders</h1>
              <p className="text-sm text-zinc-500 mt-1">Organize documents by folder</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Folder
            </Button>
          </div>

          {rootFolders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rootFolders.map((f) => {
                const children = folders.filter((c) => c.parent_id === f.id)
                return (
                  <Card key={f.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                            <Folder className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="font-medium">{f.name}</h3>
                            <p className="text-xs text-zinc-500">{countFor(f.id)} documents</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {f.description && <p className="mt-3 text-sm text-zinc-500 line-clamp-2">{f.description}</p>}
                      {children.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {children.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                              <Folder className="h-3.5 w-3.5" style={{ color: c.color }} />
                              <span className="flex-1 truncate">{c.name}</span>
                              <Badge variant="outline" className="text-xs">{countFor(c.id)}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Folder className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No folders yet. Create your first folder to organize documents.</p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <FileText className="h-4 w-4" />
            <span>{docs.filter((d) => !d.folder_id).length} documents without a folder</span>
          </div>
        </div>

        <FolderDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} folders={folders} />
      </DocumentsShell>
    </DashboardShell>
  )
}