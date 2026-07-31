'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Clock, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getPendingApprovals, respondToApproval } from '@/lib/actions/documents'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  changes_requested: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
}

export default function ApprovalsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responded, setResponded] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setApprovals(await getPendingApprovals(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleRespond = async (approvalId: string, action: 'approve' | 'reject') => {
    if (!currentOrganization?.id) return
    setResponded(approvalId)
    await respondToApproval(currentOrganization.id, {
      approval_id: approvalId,
      action,
      comment: action === 'approve' ? 'Approved from approvals queue' : 'Rejected from approvals queue',
    } as any).catch(() => {})
    setResponded(null)
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
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
            <h1 className="text-2xl font-semibold">Approvals</h1>
            <p className="text-sm text-zinc-500 mt-1">Documents awaiting your approval</p>
          </div>

          {approvals.length > 0 ? (
            <div className="space-y-3">
              {approvals.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                          <Clock className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{a.title}</h3>
                            <Badge className={statusColors[a.status] || 'bg-zinc-100 text-zinc-700'}>{a.status}</Badge>
                          </div>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Requested {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          disabled={responded === a.id}
                          onClick={() => handleRespond(a.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={responded === a.id}
                          onClick={() => handleRespond(a.id, 'approve')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300 mb-3" />
                <p className="text-sm text-zinc-500">No pending approvals. You're all caught up.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DocumentsShell>
    </DashboardShell>
  )
}