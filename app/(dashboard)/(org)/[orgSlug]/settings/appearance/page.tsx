'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/providers/theme-provider'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const themes = [
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Crisp, high-contrast bright interface',
    previewBg: 'bg-[#F8F9FA] border-neutral-200',
    previewWindow: 'bg-white border-neutral-200 text-neutral-800 shadow-xs',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Deep OLED dark mode easy on the eyes',
    previewBg: 'bg-[#080808] border-white/10',
    previewWindow: 'bg-[#141418] border-white/10 text-white shadow-xs',
  },
  {
    id: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Automatically matches your macOS system appearance',
    previewBg: 'bg-gradient-to-r from-[#F8F9FA] to-[#080808] border-neutral-300 dark:border-white/10',
    previewWindow: 'bg-gradient-to-r from-white to-[#141418] border-neutral-300 dark:border-white/10 text-neutral-900 shadow-xs',
  },
]

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight font-sans">Appearance</h2>
        <p className="text-sm text-neutral-500 font-sans mt-0.5">
          Customize how ACT OS appears across your devices
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Interface Theme</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Select your preferred visual appearance mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isActive = mounted ? theme === t.id : false

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                  className={cn(
                    'group relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer outline-none select-none',
                    isActive
                      ? 'border-neutral-900 bg-neutral-100/80 dark:border-white dark:bg-white/[0.08] shadow-sm'
                      : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:bg-white/[0.03]'
                  )}
                >
                  {/* Visual Preview Box */}
                  <div
                    className={cn(
                      'w-full h-24 rounded-xl border p-2.5 mb-3 flex flex-col justify-between transition-transform duration-200 group-hover:scale-[1.02]',
                      t.previewBg
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 opacity-80" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-80" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80" />
                    </div>

                    <div className={cn('h-10 rounded-lg border p-2 flex items-center gap-2 text-[10px]', t.previewWindow)}>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-sans font-medium truncate">{t.label} Mode</span>
                    </div>
                  </div>

                  {/* Title and radio indicator */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-500 dark:text-neutral-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-semibold font-sans',
                          isActive
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                        )}
                      >
                        {t.label}
                      </span>
                    </div>

                    {isActive && (
                      <div className="w-4 h-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1">
                    {t.description}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
