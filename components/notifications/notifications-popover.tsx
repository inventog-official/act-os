'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Check, Loader2, ExternalLink } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getRecentNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/types/database'

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const typeColors = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
  success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
  error: 'text-red-500 bg-red-50 dark:bg-red-950/50',
}

export function NotificationsPopover() {
  const router = useRouter()
  const { user } = useAuth()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user || !currentOrganization) return
    setLoading(true)
    try {
      const [data, count] = await Promise.all([
        getRecentNotifications(currentOrganization.id, user.id, 10),
        getUnreadCount(user.id),
      ])
      setNotifications(data)
      setUnreadCount(count)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [user, currentOrganization])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return
    try {
      await markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      setOpen(false)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up!"
            />
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.map(notification => {
                const Icon = typeIcons[notification.type]
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900',
                      !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', typeColors[notification.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium')}>
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-zinc-400">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      {notification.message && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push(`/${currentOrganization?.slug}/notifications`)
                  setOpen(false)
                }}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
