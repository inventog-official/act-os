import { create } from 'zustand'
import type { Project, Task } from '@/lib/types/database'

interface ProjectState {
  projects: any[]
  currentProject: any | null
  tasks: any[]
  currentTask: any | null
  isLoading: boolean
  viewMode: 'list' | 'board' | 'calendar' | 'timeline'
  setProjects: (projects: any[]) => void
  setCurrentProject: (project: any | null) => void
  setTasks: (tasks: any[]) => void
  setCurrentTask: (task: any | null) => void
  setLoading: (loading: boolean) => void
  setViewMode: (mode: 'list' | 'board' | 'calendar' | 'timeline') => void
  reset: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  currentTask: null,
  isLoading: false,
  viewMode: 'list',
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setLoading: (isLoading) => set({ isLoading }),
  setViewMode: (viewMode) => set({ viewMode }),
  reset: () => set({
    projects: [], currentProject: null, tasks: [], currentTask: null, isLoading: false,
  }),
}))
