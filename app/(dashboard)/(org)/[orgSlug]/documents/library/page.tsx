'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, Plus, Folder, FileText, Trash2, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getDocuments, getFolders, deleteDocument, createFolder } from '@/lib/actions/documents'
import { DocumentDialog } from './document-dialog'
import { FolderDialog } from './folder-dialog'

const typeLabels: Record<string, string> = {
  sop: 'SOP', policy: 'Policy', contract: 'Contract', proposal: 'Proposal', agreement: 'Agreement',
  invoice: 'Invoice', project_document: 'Project Doc', hr_document: 'HR Doc', training: 'Training',
  meeting_notes: 'Meeting Notes', knowledge_article: 'Knowledge', internal: 'Internal', technical: 'Technical', custom: 'Document',
}

const typeColors: Record<string, string> = {
  sop: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  policy: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  contract: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  proposal: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  agreement: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  project_document: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  meeting_notes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  internal: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  hr_document: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  training: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  knowledge_article: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  technical: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  approval: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  published: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

export default function DocumentsLibraryPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [docs, setDocs] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [d, f] = await Promise.all([
      getDocuments(currentOrganization.id).catch(() => []),
      getFolders(currentOrganization.id).catch(() => []),
    ])
    setDocs(d)
    setFolders(f)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      const matchesFolder = folderFilter === 'all' || d.folder_id === folderFilter
      const matchesType = typeFilter === 'all' || d.document_type === typeFilter
      return matchesSearch && matchesFolder && matchesType
    })
  }, [docs, search, folderFilter, typeFilter])

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!currentOrganization?.id) return
    await deleteDocument(currentOrganization.id, id).catch(() => {})
    load()
  }

  const handleFolderSave = async () => {
    setFolderDialogOpen(false)
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          </div>
        </DocumentsShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <DocumentsShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Document Library</h1>
              <p className="text-sm text-zinc-500 mt-1">All documents across your organization</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                <Folder className="h-4 w-4 mr-2" /> New Folder
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Document
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <option value="all">All folders</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <option value="all">All types</option>
              {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <Card key={d.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeColors[d.document_type] || 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status] || 'bg-zinc-100 text-zinc-700'}`}>
                      {d.status}
                    </span>
                  </div>
                  <h3 className="mt-3 font-medium leading-snug line-clamp-2">{d.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{d.description || typeLabels[d.document_type] || '—'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{typeLabels[d.document_type] || d.document_type}</Badge>
                      {d.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} className="text-xs text-zinc-500">#{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No documents found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DocumentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          folders={folders}
          initialFolderId={folderFilter === 'all' ? null : folderFilter}
        />
        <FolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onSave={handleFolderSave} />
      </DocumentsShell>
    </DashboardShell>
  )
}