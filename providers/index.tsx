'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
      />
    </ThemeProvider>
  )
}
