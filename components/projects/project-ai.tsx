'use client'

import { useState } from 'react'
import {
  Sparkles, Brain, Lightbulb, AlertTriangle,
  Calendar, FileText, ListChecks, ChevronDown,
  ChevronUp, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'

const PANEL_IDS = [
  'summary',
  'tasks',
  'sprint',
  'risks',
  'deadlines',
  'report',
  'actions',
] as const

type PanelId = (typeof PANEL_IDS)[number]

const PANEL_CONFIG: Record<
  PanelId,
  { label: string; description: string; icon: any }
> = {
  summary: {
    label: 'Generate Project Summary',
    description: 'Create a formatted summary of project status',
    icon: FileText,
  },
  tasks: {
    label: 'Break Requirements into Tasks',
    description: 'Suggest structured tasks from high-level requirements',
    icon: ListChecks,
  },
  sprint: {
    label: 'Generate Sprint Plan',
    description: 'Plan sprints with task allocations',
    icon: Brain,
  },
  risks: {
    label: 'Detect Risks',
    description: 'Flag potential risks in budget, timeline, and progress',
    icon: AlertTriangle,
  },
  deadlines: {
    label: 'Suggest Deadlines',
    description: 'Calculate realistic timelines based on workload',
    icon: Calendar,
  },
  report: {
    label: 'Generate Weekly Status Report',
    description: 'Compile status, activity, and completion into a report',
    icon: FileText,
  },
  actions: {
    label: 'Recommend Next Actions',
    description: 'Suggest prioritized next steps',
    icon: Lightbulb,
  },
}

interface ProjectAIProps {
  project: any
  tasks: any[]
}

export function ProjectAI({ project, tasks }: ProjectAIProps) {
  const [panels, setPanels] = useState<
    Record<PanelId, { expanded: boolean; loading: boolean; result: string | null }>
  >(
    Object.fromEntries(
      PANEL_IDS.map((id) => [id, { expanded: false, loading: false, result: null }]),
    ) as any,
  )

  const toggle = (id: PanelId) => {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }))
  }

  const generate = async (id: PanelId) => {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: true, result: null },
    }))

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

    const result = generateResult(id, project, tasks)
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: false, result },
    }))
  }

  return (
    <div className="space-y-3">
      {PANEL_IDS.map((id) => {
        const cfg = PANEL_CONFIG[id]
        const Icon = cfg.icon
        const state = panels[id]

        return (
          <Card key={id}>
            <button
              type="button"
              onClick={() => toggle(id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{cfg.label}</p>
                <p className="text-xs text-zinc-400">{cfg.description}</p>
              </div>
              {state.expanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
              )}
            </button>

            {state.expanded && (
              <CardContent className="space-y-4 px-4 pb-4 pt-0">
                <Button
                  size="sm"
                  onClick={() => generate(id)}
                  disabled={state.loading}
                  className="gap-1.5"
                >
                  {state.loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {state.loading ? 'Generating...' : 'Generate'}
                </Button>

                {state.result && (
                  <div className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/50">
                    {state.result}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rule-based generators
// ---------------------------------------------------------------------------

function generateResult(
  id: PanelId,
  project: any,
  tasks: any[],
): string {
  switch (id) {
    case 'summary':
      return generateSummary(project, tasks)
    case 'tasks':
      return generateTaskBreakdown(project, tasks)
    case 'sprint':
      return generateSprintPlan(project, tasks)
    case 'risks':
      return generateRiskDetection(project, tasks)
    case 'deadlines':
      return generateDeadlineSuggestions(project, tasks)
    case 'report':
      return generateStatusReport(project, tasks)
    case 'actions':
      return generateNextActions(project, tasks)
  }
}

function generateSummary(project: any, tasks: any[]): string {
  const completed = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : project.progress || 0
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const todo = tasks.filter((t) => t.status === 'todo').length

  return [
    `## Project Summary: ${project.name}`,
    '',
    `**Status**: ${project.status}  **Priority**: ${project.priority}  **Progress**: ${progress}%`,
    '',
    '### Overview',
    project.description || 'No description provided.',
    '',
    '### Task Breakdown',
    `- **To Do**: ${todo} tasks`,
    `- **In Progress**: ${inProgress} tasks`,
    `- **Completed**: ${completed} / ${total} tasks`,
    '',
    '### Timeline',
    `- **Start**: ${project.start_date ? formatDate(project.start_date) : 'Not set'}`,
    `- **End**: ${project.end_date ? formatDate(project.end_date) : 'Not set'}`,
    `- **Budget**: ${project.budget ? formatCurrency(project.budget) : 'Not set'}`,
    '',
    '### Health',
    progress >= 60
      ? '✅ Project is on track.'
      : progress >= 30
        ? '⚠️ Project needs attention.'
        : '🔴 Project is at risk.',
  ].join('\n')
}

function generateTaskBreakdown(project: any, _tasks: any[]): string {
  const desc = (project.description || '').toLowerCase()
  const keywords = [
    'api', 'frontend', 'backend', 'database', 'auth',
    'test', 'deploy', 'design', 'docs', 'mobile',
  ]
  const matched = keywords.filter((k) => desc.includes(k))

  const templates = [
    { title: 'Requirements Gathering', desc: 'Document detailed requirements with stakeholders' },
    { title: 'System Architecture Design', desc: 'Design system architecture and data flow diagrams' },
    { title: 'Database Schema Setup', desc: 'Design and implement database schema and migrations' },
    { title: 'Authentication & Authorization', desc: 'Implement user authentication and role-based access' },
    { title: 'Core API Development', desc: 'Build RESTful API endpoints for core features' },
    { title: 'Frontend UI Development', desc: 'Implement responsive UI components and pages' },
    { title: 'Integration Testing', desc: 'Write integration tests for critical paths' },
    { title: 'Documentation', desc: 'Write API docs, user guides, and deployment notes' },
    { title: 'Performance Optimization', desc: 'Optimize database queries and frontend performance' },
    { title: 'Deployment & CI/CD', desc: 'Set up CI/CD pipeline and deploy to production' },
  ]

  let selected =
    matched.length >= 3
      ? templates.filter(
          (t) =>
            matched.some(
              (m) =>
                t.title.toLowerCase().includes(m) ||
                t.desc.toLowerCase().includes(m),
            ),
        )
      : templates

  if (selected.length < 5) selected = templates.slice(0, 6)
  if (selected.length > 8) selected = selected.slice(0, 8)

  return [
    '## Suggested Tasks',
    '',
    ...selected.map(
      (t, i) => `${i + 1}. **${t.title}** — ${t.desc}`,
    ),
    '',
    `*Generated ${selected.length} tasks based on project requirements*`,
  ].join('\n')
}

function generateSprintPlan(project: any, tasks: any[]): string {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'done').length
  const remaining = total - completed
  const tasksPerSprint = Math.max(2, Math.ceil(remaining / 4))

  const sprints = [
    {
      goal: 'Foundation & Setup',
      focus: 'Infrastructure, planning, and core scaffolding',
    },
    {
      goal: 'Core Development',
      focus: 'Main feature implementation',
    },
    {
      goal: 'Testing & Polish',
      focus: 'Testing, bug fixes, and refinement',
    },
    {
      goal: 'Delivery & Handoff',
      focus: 'Final QA, documentation, and deployment',
    },
  ]

  const sprintCount = Math.min(sprints.length, Math.max(2, Math.ceil(remaining / tasksPerSprint)))

  return [
    '## Sprint Plan',
    '',
    ...Array.from({ length: sprintCount }, (_, i) => [
      `### Sprint ${i + 1}: ${sprints[i].goal}`,
      `**Goal**: ${sprints[i].focus}`,
      `**Tasks**: ~${tasksPerSprint} tasks`,
      `**Duration**: 2 weeks`,
    ].join('\n')),
    '',
    '---',
    `**Total Remaining**: ${remaining} tasks across ${sprintCount} sprints (${tasksPerSprint} tasks/sprint)`,
  ].join('\n')
}

function generateRiskDetection(project: any, tasks: any[]): string {
  const completed = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0
  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'done',
  ).length

  const risks: {
    risk: string
    severity: string
    impact: string
    mitigation: string
  }[] = []

  if (project.end_date && new Date(project.end_date) < new Date()) {
    risks.push({
      risk: 'Past Deadline',
      severity: 'High',
      impact: 'Project is past its scheduled end date',
      mitigation:
        'Conduct a schedule assessment and negotiate timeline extension',
    })
  } else if (project.end_date) {
    const daysLeft = Math.ceil(
      (new Date(project.end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    )
    if (daysLeft < 14) {
      risks.push({
        risk: 'Approaching Deadline',
        severity: 'Medium',
        impact: `Only ${daysLeft} days remaining until deadline`,
        mitigation:
          'Prioritize critical path tasks and consider scope adjustments',
      })
    }
  }

  if (progress < 30 && total > 5) {
    risks.push({
      risk: 'Low Progress',
      severity: 'High',
      impact: `Only ${progress}% completion with ${total} total tasks`,
      mitigation:
        'Review progress blockers and reallocate resources if needed',
    })
  }

  if (overdue > 0) {
    risks.push({
      risk: 'Overdue Tasks',
      severity: overdue > 3 ? 'High' : 'Medium',
      impact: `${overdue} task(s) past their due date`,
      mitigation: 'Review overdue tasks and reassign or reprioritize',
    })
  }

  if (project.budget && project.budget < 10000) {
    risks.push({
      risk: 'Tight Budget',
      severity: 'Medium',
      impact: `Limited budget of ${formatCurrency(project.budget)}`,
      mitigation:
        'Track expenses closely and identify cost-saving opportunities',
    })
  }

  if (total > 15) {
    risks.push({
      risk: 'Scope Creep',
      severity: 'Medium',
      impact: `High task count (${total}) may indicate scope creep`,
      mitigation:
        'Review task list for necessity and consolidate where possible',
    })
  }

  if (risks.length === 0) {
    risks.push({
      risk: 'No Major Risks',
      severity: 'Low',
      impact: 'Project appears to be on track',
      mitigation: 'Continue monitoring and maintain current practices',
    })
  }

  const high = risks.filter((r) => r.severity === 'High').length
  const med = risks.filter((r) => r.severity === 'Medium').length
  const low = risks.filter((r) => r.severity === 'Low').length

  return [
    '## Risk Analysis',
    '',
    ...risks.map(
      (r, i) =>
        [
          `### ${i + 1}. ${r.risk}`,
          `- **Severity**: ${r.severity === 'High' ? '🔴' : r.severity === 'Medium' ? '🟡' : '🟢'} ${r.severity}`,
          `- **Impact**: ${r.impact}`,
          `- **Mitigation**: ${r.mitigation}`,
        ].join('\n'),
    ),
    '',
    '---',
    `**Summary**: ${high} high, ${med} medium, ${low} low severity risks identified`,
  ].join('\n')
}

function generateDeadlineSuggestions(project: any, tasks: any[]): string {
  const total = tasks.length
  const remaining = tasks.filter((t) => t.status !== 'done').length
  const hoursPerTask = 8
  const totalHours = remaining * hoursPerTask
  const teamSize = Math.max(1, Math.min(remaining, 5))
  const hoursPerDay = 6
  const estimatedDays = Math.ceil(totalHours / (teamSize * hoursPerDay))
  const estimatedWeeks = Math.ceil(estimatedDays / 5)
  const startDate = project.start_date
    ? new Date(project.start_date)
    : new Date()
  const suggestedEnd = new Date(startDate)
  suggestedEnd.setDate(suggestedEnd.getDate() + estimatedDays)

  const weeks = Math.min(estimatedWeeks, 6)
  const tasksPerWeek = Math.round(remaining / weeks)

  return [
    '## Suggested Deadlines',
    '',
    '### Current Scope',
    `- **Total tasks**: ${total}`,
    `- **Remaining tasks**: ${remaining}`,
    `- **Estimated hours per task**: ${hoursPerTask}h`,
    `- **Total estimated effort**: ${totalHours} hours`,
    '',
    '### Team Capacity',
    `- **Team size**: ${teamSize} members`,
    `- **Productive hours/day**: ${hoursPerDay}h per person`,
    `- **Daily capacity**: ${teamSize * hoursPerDay} hours`,
    '',
    '### Proposed Timeline',
    `- **Estimated duration**: ${estimatedDays} days (${estimatedWeeks} weeks)`,
    `- **Suggested start**: ${formatDate(startDate)}`,
    `- **Suggested end**: ${formatDate(suggestedEnd)}`,
    '',
    '### Weekly Milestones',
    ...Array.from({ length: weeks }, (_, i) => {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 5)
      return `- **Week ${i + 1}** (${formatDate(weekStart)} — ${formatDate(weekEnd)}): ~${tasksPerWeek} tasks targeted`
    }),
    '',
    '*Timeline assumes no blockers and full team availability*',
  ].join('\n')
}

function generateStatusReport(project: any, tasks: any[]): string {
  const completed = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0
  const inProgress = tasks.filter(
    (t) => t.status === 'in_progress',
  ).length
  const todo = tasks.filter((t) => t.status === 'todo').length

  return [
    '## Weekly Status Report',
    '',
    `**Project**: ${project.name}`,
    `**Report Date**: ${formatDate(new Date())}`,
    `**Status**: ${project.status.toUpperCase()}`,
    `**Priority**: ${project.priority}`,
    '',
    '### Progress Summary',
    `- **Completion**: ${progress}% (${completed}/${total} tasks)`,
    `- **In Progress**: ${inProgress} tasks`,
    `- **Not Started**: ${todo} tasks`,
    '',
    '### Timeline',
    `- **Start**: ${project.start_date ? formatDate(project.start_date) : 'N/A'}`,
    `- **End**: ${project.end_date ? formatDate(project.end_date) : 'N/A'}`,
    `- **Budget**: ${project.budget ? formatCurrency(project.budget) : 'N/A'}`,
    '',
    '### Accomplished This Week',
    completed > 0
      ? `- Completed ${completed} task(s)`
      : '- No tasks completed yet',
    ...(inProgress > 0
      ? [`- ${inProgress} task(s) in progress`]
      : []),
    '',
    "### Next Week's Goals",
    `- Complete remaining ${todo} pending task(s)`,
    '- Address any blockers',
    '- Review project timeline and adjust if necessary',
    '',
    '### Blockers',
    'None identified at this time.',
    '',
    '---',
    '*Report generated by ACT OS AI*',
  ].join('\n')
}

function generateNextActions(project: any, tasks: any[]): string {
  const highPriority = tasks.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high',
  )
  const incomplete = highPriority.filter((t) => t.status !== 'done')
  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'done',
  )

  const lines: string[] = ['## Recommended Next Actions', '']

  if (overdue.length > 0) {
    lines.push('### 🔴 Immediate (Overdue)')
    lines.push(
      ...overdue
        .slice(0, 3)
        .map(
          (t) =>
            `- **${t.title}** — Past due date${t.due_date ? ` (${formatDate(t.due_date)})` : ''}`,
        ),
    )
    lines.push('')
  }

  if (incomplete.length > 0) {
    lines.push('### 🟡 High Priority')
    lines.push(
      ...incomplete.slice(0, 3).map((t, i) =>
        `- **${t.title}** — ${
          i === 0
            ? 'Start working on this first'
            : 'Schedule for completion this week'
        }`,
      ),
    )
    lines.push('')
  }

  lines.push('### 🟢 General')

  if (!project.end_date) {
    lines.push(
      '- **Set a project deadline** to establish a clear timeline',
    )
  }
  if (tasks.some((t) => t.status === 'in_progress')) {
    lines.push(
      '- **Follow up** on in-progress tasks to ensure they stay on track',
    )
  }
  if (!project.description) {
    lines.push(
      '- **Add a project description** to improve clarity',
    )
  }
  if (tasks.length === 0) {
    lines.push(
      '- **Create initial tasks** to define project scope',
    )
  } else {
    lines.push(
      '- **Review and reprioritize** remaining tasks for the next sprint',
    )
  }

  lines.push('')
  lines.push('### 📊 Summary')
  lines.push(
    `- ${tasks.length} total tasks, ${tasks.filter((t) => t.status === 'done').length} completed`,
  )
  lines.push(
    `- ${incomplete.length} high-priority items need attention`,
  )
  lines.push(
    `${overdue.length > 0 ? `- ${overdue.length} overdue items require immediate action` : '- No overdue items'}`,
  )

  return lines.join('\n')
}
