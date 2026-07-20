'use client'

import { useState } from 'react'
import { Sparkles, Brain, Target, Mail, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { analyzeLead, analyzeDeal, getLeadHealthColor, getLeadHealthLabel } from '@/lib/ai/crm-ai'

export function AiLeadInsights({ lead }: { lead: any }) {
  const [expanded, setExpanded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [proposal, setProposal] = useState<string | null>(null)

  if (!lead) return null

  const analysis = analyzeLead(lead)

  return (
    <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">AI Insights</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-zinc-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Health Score</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={cn('h-full rounded-full transition-all', analysis.healthScore >= 60 ? 'bg-emerald-500' : analysis.healthScore >= 30 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${analysis.healthScore}%` }}
                  />
                </div>
                <span className={cn('text-xs font-semibold', getLeadHealthColor(analysis.healthScore))}>
                  {getLeadHealthLabel(analysis.healthScore)} ({analysis.healthScore}%)
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-1">Summary</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{analysis.summary}</p>
          </div>

          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-xs text-zinc-500 mb-1">Suggested Next Action</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{analysis.nextAction}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGenerating(true)
                setTimeout(() => { setEmail(analysis.suggestedEmail || null); setGenerating(false) }, 500)
              }}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
              Generate Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGenerating(true)
                setTimeout(() => { setProposal(generateProposal(lead)); setGenerating(false) }, 800)
              }}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
              Generate Proposal
            </Button>
          </div>

          {email && (
            <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-900">
              {email}
            </div>
          )}
          {proposal && (
            <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-900">
              {proposal}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function generateProposal(lead: any): string {
  const value = lead.estimated_deal_value || 25000
  const company = lead.company_name || 'your company'
  return `Proposal for ${company}\n\nDear ${lead.first_name},\n\nThank you for the opportunity to present this proposal. Based on our discussions, we recommend the following:\n\n1. Platform Setup & Configuration: $${(value * 0.3).toLocaleString()}\n2. Team Training & Onboarding: $${(value * 0.2).toLocaleString()}\n3. Implementation Support: $${(value * 0.3).toLocaleString()}\n4. Ongoing Support & Maintenance: $${(value * 0.2).toLocaleString()}\n\nTotal Investment: $${value.toLocaleString()}\n\nWe look forward to partnering with you.`
}

export function AiDealScore({ deal }: { deal: any }) {
  if (!deal) return null
  const { opportunityScore, recommendation } = analyzeDeal(deal)

  return (
    <div className="flex items-center gap-2 text-xs">
      <Target className="h-3 w-3 text-zinc-400" />
      <span className="text-zinc-500">Score:</span>
      <span className={cn('font-semibold', opportunityScore >= 70 ? 'text-emerald-500' : opportunityScore >= 40 ? 'text-amber-500' : 'text-red-500')}>
        {opportunityScore}%
      </span>
      <span className="text-zinc-400">|</span>
      <span className="text-zinc-500">{recommendation}</span>
    </div>
  )
}
