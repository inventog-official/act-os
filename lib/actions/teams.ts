import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { teams, teamMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/actions/crm/utils'
import type { Team } from '@/lib/types/database'

export async function getTeams(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(user_id)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data as (Team & { team_members: { user_id: string }[] })[]
}

export async function createTeam(input: {
  name: string
  description?: string | null
  organization_id: string
  workspace_id?: string | null
}) {
  const user = await getCurrentUser()
  const [team] = await db.insert(teams).values({
    name: input.name,
    description: input.description || null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id || null,
    createdBy: user.id,
  } as any).returning()
  return team as any as Team
}

export async function updateTeam(id: string, input: { name?: string; description?: string | null }) {
  const vals: Record<string, unknown> = {}
  if (input.name !== undefined) vals.name = input.name
  if (input.description !== undefined) vals.description = input.description
  const [team] = await db.update(teams).set(vals as any).where(eq(teams.id, id)).returning()
  return team as any as Team
}

export async function deleteTeam(id: string) {
  await db.update(teams).set({ deletedAt: new Date() }).where(eq(teams.id, id))
}

export async function addTeamMember(teamId: string, userId: string) {
  const user = await getCurrentUser()
  await db.insert(teamMembers).values({
    teamId,
    userId,
    createdBy: user.id,
  })
}

export async function removeTeamMember(teamId: string, userId: string) {
  await db.delete(teamMembers).where(
    and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
  )
}
