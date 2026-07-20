'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'

const notificationGroups = [
  {
    title: 'Email Notifications',
    icon: Mail,
    items: [
      { id: 'email_tasks', label: 'Task assignments', description: 'When you are assigned to a task', enabled: true },
      { id: 'email_comments', label: 'Comments', description: 'When someone comments on your work', enabled: false },
      { id: 'email_mentions', label: 'Mentions', description: 'When someone mentions you', enabled: true },
      { id: 'email_updates', label: 'Project updates', description: 'When a project status changes', enabled: true },
    ],
  },
  {
    title: 'Push Notifications',
    icon: Bell,
    items: [
      { id: 'push_tasks', label: 'Task reminders', description: 'Due date reminders for tasks', enabled: true },
      { id: 'push_mentions', label: 'Mentions', description: 'When someone mentions you', enabled: true },
      { id: 'push_deadlines', label: 'Deadline alerts', description: '24h before a deadline', enabled: true },
    ],
  },
  {
    title: 'In-App Notifications',
    icon: MessageSquare,
    items: [
      { id: 'app_activity', label: 'Team activity', description: 'Updates from your team', enabled: true },
      { id: 'app_comments', label: 'New comments', description: 'When someone comments', enabled: true },
      { id: 'app_status', label: 'Status changes', description: 'When tasks change status', enabled: false },
    ],
  },
]

const STORAGE_KEY = 'act_os_notification_prefs'

function loadPrefs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function getDefaults(): Record<string, boolean> {
  const prefs: Record<string, boolean> = {}
  notificationGroups.forEach(g => g.items.forEach(i => { prefs[i.id] = i.enabled }))
  return { ...prefs, ...loadPrefs() }
}

export default function NotificationsPage() {
  const supabase = createClient()
  const { user } = useAuth()
  const [settings, setSettings] = useState<Record<string, boolean>>(getDefaults)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) { setIsLoading(false); return }
      try {
        if (!isSupabaseConfigured()) {
          setIsLoading(false)
          return
        }
        const { data } = await supabase
          .from('user_metadata')
          .select('notification_preferences')
          .eq('id', user.id)
          .single()

        if (data?.notification_preferences) {
          setSettings(prev => ({ ...prev, ...data.notification_preferences as Record<string, boolean> }))
        }
      } catch { /* use local defaults */ }
      finally { setIsLoading(false) }
    }
    load()
  }, [user, supabase])

  const toggle = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const save = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

      if (isSupabaseConfigured() && user) {
        await supabase.auth.updateUser({
          data: { notification_preferences: settings },
        })
      }
      toast.success('Notification preferences updated')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Notifications</h2>
        <p className="text-sm text-zinc-500">Control how you receive notifications</p>
      </div>

      {notificationGroups.map(group => {
        const Icon = group.icon
        return (
          <Card key={group.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-zinc-400" />
                <CardTitle>{group.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(item.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings[item.id] ? 'bg-zinc-900 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[item.id] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end">
        <Button onClick={save} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </>
  )
}
