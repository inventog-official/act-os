import type { ReactNode } from 'react'
import { Providers } from '@/providers'
import { OrgProvider } from './org-provider'

export default function OrgSlugLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  return (
    <Providers>
      <OrgProvider params={params}>
        {children}
      </OrgProvider>
    </Providers>
  )
}
