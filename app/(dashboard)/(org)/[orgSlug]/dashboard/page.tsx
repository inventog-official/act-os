import { DashboardPage } from '@/components/dashboard/dashboard-page'

export default async function Dashboard(props: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await props.params
  return <DashboardPage orgSlug={orgSlug} />
}
