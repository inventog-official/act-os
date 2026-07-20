'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Plus, FileText, AlertTriangle, Radar, ListTodo, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface AIAction {
  id: string
  label: string
  description: string
  icon: any
  prompt: string
}

const actions: AIAction[] = [
  { id: 'tasks', label: 'Generate Tasks', description: 'Auto-create tasks from project description', icon: ListTodo, prompt: 'Generate a set of tasks for this project based on its description and objectives.' },
  { id: 'sprint', label: 'Generate Sprint', description: 'Plan the next sprint with suggested tasks', icon: Plus, prompt: 'Plan the next sprint with a goal and task breakdown based on project backlog.' },
  { id: 'summary', label: 'Summarize Project', description: 'Get an AI summary of project status', icon: FileText, prompt: 'Summarize the current project status, progress, and next steps.' },
  { id: 'health', label: 'Project Health', description: 'Analyze project health and risks', icon: Radar, prompt: 'Analyze the health of this project. Consider timeline, task completion rate, and any blockers.' },
  { id: 'risks', label: 'Risk Detection', description: 'Identify potential risks and blockers', icon: AlertTriangle, prompt: 'Identify potential risks, blockers, and bottlenecks in this project.' },
  { id: 'report', label: 'Status Report', description: 'Generate a status report', icon: BarChart3, prompt: 'Generate a comprehensive status report for stakeholders.' },
]

interface ProjectAIProps {
  project: any
  tasks: any[]
}

export function ProjectAI({ project, tasks }: ProjectAIProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleAction = async (action: AIAction) => {
    setIsLoading(action.id)
    setResult(null)

    try {
      const completedTasks = tasks.filter(t => t.status === 'done').length
      const totalTasks = tasks.length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const context = `
Project: ${project.name}
Description: ${project.description || 'N/A'}
Status: ${project.status}
Priority: ${project.priority}
Tasks: ${completedTasks}/${totalTasks} completed (${progress}%)
Start: ${project.start_date || 'N/A'}
End: ${project.end_date || 'N/A'}
Budget: ${project.budget || 'N/A'}
      `.trim()

      await new Promise(r => setTimeout(r, 1500))

      const mockResults: Record<string, string> = {
        tasks: `## Generated Tasks\n\nBased on the project "${project.name}", here are suggested tasks:\n\n1. **Project Setup** — Initialize repository, configure CI/CD, set up environments\n2. **Requirements Gathering** — Document detailed requirements with stakeholders\n3. **Design Phase** — Create wireframes, mockups, and architecture diagrams\n4. **Core Development** — Implement main features according to the spec\n5. **Testing** — Unit tests, integration tests, and QA review\n6. **Documentation** — Write API docs, user guides, and deployment notes\n7. **Deployment** — Stage, production rollout, and monitoring setup\n\n*Priority: High | Estimated: 4-6 weeks*`,
        sprint: `## Sprint Plan\n\n**Sprint Goal**: Complete core features and initial testing\n\n**Backlog Items**:\n- Setup development environment\n- Implement user authentication\n- Build main dashboard UI\n- Create API endpoints\n- Write unit tests\n- Code review and QA\n\n**Estimated Velocity**: 6-8 story points`,
        summary: `## Project Summary\n\n**${project.name}** is currently in **${project.status}** status with **${progress}%** completion.\n\n- **Tasks**: ${completedTasks}/${totalTasks} completed\n- **Timeline**: ${project.start_date || 'Not set'} → ${project.end_date || 'Not set'}\n- **Health**: ${progress > 60 ? '✅ On track' : progress > 30 ? '⚠️ Needs attention' : '🔴 Critical'}`,
        health: `## Project Health Assessment\n\n**Overall**: ${progress > 60 ? '🟢 Good' : progress > 30 ? '🟡 Fair' : '🔴 Poor'}\n\n- **Progress**: ${progress}%\n- **Task Completion**: ${completedTasks}/${totalTasks}\n- **Timeline Risk**: ${project.end_date && new Date(project.end_date) < new Date() ? '⚠️ Past deadline' : '✅ On schedule'}\n\n**Recommendations**:\n1. Review remaining tasks and priorities\n2. Check for blocking dependencies\n3. Consider resource reallocation if behind`,
        risks: `## Risk Analysis\n\n**Identified Risks**:\n\n1. **Timeline Risk** — ${project.end_date ? `Deadline (${new Date(project.end_date).toLocaleDateString()}) may be tight` : 'No deadline set'}\n2. **Resource Risk** — ${totalTasks > 10 ? 'High task volume may strain resources' : 'Manageable task volume'}\n3. **Quality Risk** — ${completedTasks > 0 ? `Current completion rate is ${Math.round((completedTasks / totalTasks) * 100)}%` : 'No tasks completed yet'}\n\n**Mitigation**:\n- Prioritize critical path items\n- Set up daily standups\n- Track blockers proactively`,
        report: `## Status Report\n\n**Project**: ${project.name}\n**Date**: ${new Date().toLocaleDateString()}\n**Status**: ${project.status.toUpperCase()}\n\n### Progress\n- ${completedTasks}/${totalTasks} tasks completed (${progress}%)\n- ${tasks.filter(t => t.status === 'in_progress').length} tasks in progress\n\n### Blockers\nNone identified\n\n### Next Steps\n1. Complete remaining high-priority tasks\n2. Schedule review with stakeholders\n3. Plan next sprint\n\n*Report generated by ACT OS AI*`,
      }

      setResult(mockResults[action.id] || 'Analysis complete. No specific recommendations.')
      toast.success(`${action.label} complete`)
    } catch {
      toast.error('AI analysis failed')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Card key={action.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleAction(action)}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                  {isLoading === action.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-zinc-400">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">AI Result</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
