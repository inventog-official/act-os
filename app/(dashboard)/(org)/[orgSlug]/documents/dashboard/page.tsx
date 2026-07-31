'use client'

import { useState, useEffect, use } from 'react'
import {
  FileText, Folder, CheckCircle2, Clock, FileSignature, BellRing, BookOpen, ListChecks, ShieldAlert, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getDashboardStats, getRecentDocuments, getExpiringContracts } from '@/lib/actions/documents'

function StatCard({ title, value, icon: Icon, color, bg, sub }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DocumentsDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [stats, setStats] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [expiring, setExpiring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id
    setLoading(true)
    Promise.all([
      getDashboardStats(orgId).catch(() => null),
      getRecentDocuments(orgId).catch(() => []),
      getExpiringContracts(orgId).catch(() => []),
    ])
      .then(([s, r, e]) => {
        setStats(s)
        setRecent(r)
        setExpiring(e)
      })
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-5 mb-3" /><Skeleton className="h-8 w-24 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
              ))}
            </div>
          </div>
        </DocumentsShell>
      </DashboardShell>
    )
  }

  const typeColor: Record<string, string> = {
    sop: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    policy: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    contract: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    proposal: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    meeting_notes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    project_document: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    internal: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <DocumentsShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Documents Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-1">Documents, knowledge, SOPs, policies, and contracts</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI-ready tools
            </Badge>
          </div>

          <div className="grid gap-4 grid-cols-4">
            <StatCard title="Total Documents" value={stats?.totalDocuments ?? '-'} icon={FileText} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950" sub={`${stats?.publishedDocuments ?? 0} published`} />
            <StatCard title="Drafts" value={stats?.draftDocuments ?? '-'} icon={Clock} color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950" />
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? '-'} icon={Clock} color="text-orange-600" bg="bg-orange-100 dark:bg-orange-950" />
            <StatCard title="Folders" value={stats?.totalFolders ?? '-'} icon={Folder} color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950" />
            <StatCard title="Knowledge Articles" value={stats?.publishedArticles ?? '-'} icon={BookOpen} color="text-teal-600" bg="bg-teal-100 dark:bg-teal-950" />
            <StatCard title="SOPs" value={stats?.totalSops ?? '-'} icon={ListChecks} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950" />
            <StatCard title="Policies" value={stats?.totalPolicies ?? '-'} icon={ShieldAlert} color="text-red-600" bg="bg-red-100 dark:bg-red-950" />
            <StatCard title="Active Contracts" value={stats?.activeContracts ?? '-'} icon={FileSignature} color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950" sub={`${stats?.expiringContracts ?? 0} expiring`} />
          </div>

          <div className="grid gap-6 grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recently Updated Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {recent.length > 0 ? (
                  <div className="space-y-2">
                    {recent.slice(0, 6).map((d: any) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${typeColor[d.document_type] || 'bg-zinc-100 dark:bg-zinc-800'}`}>
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{d.description || d.document_type}</p>
                        </div>
                        <Badge variant={d.status === 'published' ? 'default' : 'outline'}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Folder className="h-10 w-10 text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-500">No documents yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contracts Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                {expiring.length > 0 ? (
                  <div className="space-y-2">
                    {expiring.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-zinc-500">{c.contract_number}</p>
                        </div>
                        <Badge variant="outline">{c.end_date}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-2" />
                    <p className="text-sm text-zinc-500">No contracts expiring soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DocumentsShell>
    </DashboardShell>
  )
}