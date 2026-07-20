import { create } from 'zustand'
import type { Organization, Workspace, Team, OrganizationMember } from '@/lib/types/database'

interface OrganizationState {
  organizations: Organization[]
  currentOrganization: Organization | null
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  teams: Team[]
  members: OrganizationMember[]
  isLoading: boolean

  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrganization: (org: Organization | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setTeams: (teams: Team[]) => void
  setMembers: (members: OrganizationMember[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: null,
  workspaces: [],
  currentWorkspace: null,
  teams: [],
  members: [],
  isLoading: true,

  setOrganizations: (organizations) => set({ organizations }),
  setCurrentOrganization: (currentOrganization) => set({ currentOrganization }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setTeams: (teams) => set({ teams }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    organizations: [],
    currentOrganization: null,
    workspaces: [],
    currentWorkspace: null,
    teams: [],
    members: [],
    isLoading: true,
  }),
}))
