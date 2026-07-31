'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Activity, FileText, Folder, FileSignature, ListChecks, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getDocumentActivity } from '@/lib/actions/documents'

const actionIcons: Record<string, any> = {
  document: FileText,
  folder: Folder,
  contract: FileSignature,
  sop: ListChecks,
  policy: ShieldAlert,
}

const actionColors: Record<string, string> = {
  document: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  folder: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  contract: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  sop: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  policy: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  document_share: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  document_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

export default function DocumentsActivityPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setActivity(await getDocumentActivity(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const humanize = (action: string) => action.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
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
          <div>
            <h1 className="text-2xl font-semibold">Document Activity</h1>
            <p className="text-sm text-zinc-500 mt-1">Audit trail of document and knowledge actions</p>
          </div>

          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((a) => {
                const Icon = actionIcons[a.resource] || Activity
                const color = actionColors[a.resource] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                return (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{humanize(a.action)}</p>
                          <p className="text-xs text-zinc-500">{a.resource}{a.document_id ? ` · ${a.document_id.slice(0, 8)}` : ''}</p>
                        </div>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No activity yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DocumentsShell>
    </DashboardShell>
  )
}