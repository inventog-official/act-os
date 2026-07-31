'use client'

import { useTheme } from '@/providers/theme-provider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const themes = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark and easy on the eyes' },
  { id: 'system', label: 'System', icon: Monitor, description: 'Follows your system theme' },
]

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Appearance</h2>
        <p className="text-sm text-zinc-500">Customize how ACT OS looks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isActive = theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all',
                    isActive
                      ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  )}
                >
                  <Icon className={cn(
                    'h-8 w-8',
                    isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'
                    )}>
                      {t.label}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
