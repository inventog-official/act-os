'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import type { Notification } from '@/lib/types/database'

const PAGE_SIZE = 20

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const typeColors: Record<string, string> = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
  success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
  error: 'text-red-500 bg-red-50 dark:bg-red-950/50',
}

export default function NotificationsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<string>('all')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchNotifications = async () => {
    if (!user || !currentOrganization) return
    setLoading(true)
    try {
      const filterParam = filter === 'all' ? undefined : filter as 'read' | 'unread'
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filterParam === 'read') query = query.eq('read', true)
      if (filterParam === 'unread') query = query.eq('read', false)

      const { data, count, error } = await query
      if (error) throw error
      setNotifications(data as Notification[])
      setTotal(count ?? 0)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user, currentOrganization, page, filter])

  const handleMarkAsRead = async (id: string) => {
    setLoadingIds(prev => new Set(prev).add(id))
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
      if (error) throw error
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      toast.error('Failed to mark as read')
    } finally {
      setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleDelete = async (id: string) => {
    setLoadingIds(prev => new Set(prev).add(id))
    try {
      const { error } = await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setNotifications(prev => prev.filter(n => n.id !== id))
      setTotal(prev => prev - 1)
      toast.success('Notification removed')
    } catch {
      toast.error('Failed to remove notification')
    } finally {
      setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleFilterChange = (value: string) => {
    setFilter(value)
    setPage(1)
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-zinc-500">
              {total === 0 ? 'No notifications' : `${total} notification${total === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={Bell}
                title="No notifications"
                description={filter === 'all' ? "You don't have any notifications yet." : `No ${filter} notifications.`}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.map(notification => {
                const Icon = typeIcons[notification.type]
                const isLoading = loadingIds.has(notification.id)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 px-6 py-4 transition-colors',
                      !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', typeColors[notification.type])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium')}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-zinc-400 whitespace-nowrap">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="default" className="text-[10px] bg-blue-500">
                            New
                          </Badge>
                        )}
                        {notification.link && (
                          <button
                            onClick={() => router.push(notification.link!)}
                            className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                          >
                            View details
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={isLoading}
                          className="text-zinc-400 hover:text-green-500"
                          title="Mark as read"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isLoading}
                        className="text-zinc-400 hover:text-red-500"
                        title="Remove"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
