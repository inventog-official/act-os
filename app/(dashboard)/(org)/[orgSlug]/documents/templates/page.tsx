'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { FilePlus2, Sparkles, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getTemplates } from '@/lib/actions/documents'

export default function TemplatesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setTemplates(await getTemplates(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
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
            <h1 className="text-2xl font-semibold">Templates</h1>
            <p className="text-sm text-zinc-500 mt-1">Reusable document templates for creating consistent documents</p>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t) => (
                <Card key={t.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                        <FilePlus2 className="h-5 w-5" />
                      </span>
                      {t.is_system && <Badge variant="outline"><Sparkles className="h-3 w-3 mr-1" />System</Badge>}
                    </div>
                    <h3 className="mt-3 font-medium">{t.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{t.description || '—'}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{t.document_type}</Badge>
                      {t.category && <span className="text-xs text-zinc-500">{t.category}</span>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Layers className="h-3.5 w-3.5" /> Use template
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FilePlus2 className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No templates yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DocumentsShell>
    </DashboardShell>
  )
}