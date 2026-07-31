'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
  themes: Theme[]
}

const STORAGE_KEY = 'theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function getStorageTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {}
  return 'system'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  systemTheme: 'light',
  themes: ['light', 'dark', 'system'],
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const initial = getStorageTheme()
    setThemeState(initial)
    setResolvedTheme(initial === 'system' ? getSystemTheme() : initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      setResolvedTheme(getSystemTheme())
      applyTheme(theme)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    if (next === 'system') setResolvedTheme(getSystemTheme())
    else setResolvedTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    applyTheme(next)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolvedTheme, systemTheme: resolvedTheme, themes: ['light', 'dark', 'system'] }),
    [theme, setTheme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}