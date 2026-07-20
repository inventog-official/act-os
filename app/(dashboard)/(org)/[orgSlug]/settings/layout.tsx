import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { SettingsShell } from '@/components/settings/settings-shell'

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <DashboardShell orgSlug={orgSlug}>
      <SettingsShell orgSlug={orgSlug}>
        {children}
      </SettingsShell>
    </DashboardShell>
  )
}
