interface AiGeneratedContent {
  summary: string
  healthScore: number
  nextAction: string
  suggestedEmail?: string
}

function getLeadHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function getLeadHealthLabel(score: number): string {
  if (score >= 80) return 'Hot'
  if (score >= 60) return 'Warm'
  return 'Cold'
}

function calculateLeadHealthScore(lead: {
  status?: string
  priority?: string
  estimated_deal_value?: number | null
  lead_source?: string | null
  created_at?: string
}): number {
  let score = 50

  const statusScores: Record<string, number> = { won: 20, negotiation: 15, proposal: 10, qualified: 5, new: 0, contacted: 2, lost: -20, disqualified: -30 }
  score += statusScores[lead.status || 'new'] || 0

  const priorityScores: Record<string, number> = { urgent: 15, high: 10, medium: 5, low: 0 }
  score += priorityScores[lead.priority || 'medium'] || 5

  if (lead.estimated_deal_value && lead.estimated_deal_value > 50000) score += 10
  else if (lead.estimated_deal_value && lead.estimated_deal_value > 10000) score += 5

  const sourceScores: Record<string, number> = { referral: 10, website: 5, event: 5, cold_call: -5, other: 0 }
  score += sourceScores[lead.lead_source || 'other'] || 0

  return Math.max(0, Math.min(100, score))
}

function generateSummary(lead: {
  first_name: string
  last_name: string
  company_name?: string | null
  job_title?: string | null
  status?: string
  priority?: string
  estimated_deal_value?: number | null
  lead_source?: string | null
  description?: string | null
  notes?: string | null
}): string {
  const name = `${lead.first_name} ${lead.last_name}`
  const company = lead.company_name || 'an unknown company'
  const title = lead.job_title || 'professional'

  const parts: string[] = [
    `${name} is a ${title} at ${company}.`,
  ]

  if (lead.description) {
    parts.push(`They are interested in: ${lead.description}`)
  }

  if (lead.estimated_deal_value) {
    parts.push(`The estimated deal value is $${lead.estimated_deal_value.toLocaleString()}.`)
  }

  parts.push(`Current status: ${lead.status}. Priority: ${lead.priority}.`)

  if (lead.lead_source) {
    parts.push(`Source: ${lead.lead_source.replace('_', ' ')}.`)
  }

  if (lead.notes) {
    parts.push(`Notes: ${lead.notes}`)
  }

  return parts.join(' ')
}

function generateNextAction(lead: {
  status?: string
  priority?: string
  estimated_deal_value?: number | null
  lead_source?: string | null
}): string {
  if (lead.status === 'new') return 'Send an introductory email or schedule a discovery call to learn more about their needs.'
  if (lead.status === 'contacted') return 'Follow up with additional information and try to schedule a demo or meeting.'
  if (lead.status === 'qualified') return 'Prepare and send a tailored proposal addressing their specific requirements.'
  if (lead.status === 'proposal') return 'Follow up on the proposal, address any questions, and work towards negotiation.'
  if (lead.status === 'negotiation') return 'Review terms, address final concerns, and work towards closing the deal.'
  if (lead.status === 'won') return 'Send a welcome package and begin onboarding. Look for upsell opportunities.'
  if (lead.status === 'lost') return 'Send a follow-up email to stay on their radar. Ask for feedback on why they chose another solution.'
  return 'Reach out to establish initial contact and qualify the lead.'
}

function generateFollowUpEmail(lead: {
  first_name: string
  last_name: string
  company_name?: string | null
  job_title?: string | null
  estimated_deal_value?: number | null
}): string {
  const name = lead.first_name
  const company = lead.company_name || 'your company'

  return `Subject: Following up on our conversation\n\nHi ${name},\n\nI hope this message finds you well. I wanted to follow up regarding our recent discussion about how we can help ${company} achieve their goals.\n\nI've been thinking about the challenges you mentioned, and I believe our solution could make a significant impact. I'd love to schedule a call to dive deeper into how we can support your team.\n\nWould you be available for a 30-minute call next week?\n\nBest regards,\n[Your Name]`
}

function generateProposal(lead: {
  first_name: string
  last_name: string
  company_name?: string | null
  estimated_deal_value?: number | null
}): string {
  const value = lead.estimated_deal_value || 25000
  const company = lead.company_name || 'your company'

  return `Proposal for ${company}\n\nDear ${lead.first_name},\n\nThank you for the opportunity to present this proposal. Based on our discussions, we recommend the following:\n\n1. Platform Setup & Configuration: $${(value * 0.3).toLocaleString()}\n2. Team Training & Onboarding: $${(value * 0.2).toLocaleString()}\n3. Implementation Support: $${(value * 0.3).toLocaleString()}\n4. Ongoing Support & Maintenance: $${(value * 0.2).toLocaleString()}\n\nTotal Investment: $${value.toLocaleString()}\n\nWe look forward to partnering with you.`
}

function calculateOpportunityScore(deal: {
  deal_value?: number
  probability?: number
  expected_close_date?: string | null
}): number {
  let score = 50
  if (deal.deal_value && deal.deal_value > 50000) score += 15
  else if (deal.deal_value && deal.deal_value > 10000) score += 10
  else if (deal.deal_value) score += 5

  if (deal.probability !== undefined) score += deal.probability * 0.3

  if (deal.expected_close_date) {
    const daysUntilClose = Math.ceil((new Date(deal.expected_close_date).getTime() - Date.now()) / 86400000)
    if (daysUntilClose < 30) score += 10
    else if (daysUntilClose < 90) score += 5
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function analyzeLead(lead: any): AiGeneratedContent {
  const healthScore = calculateLeadHealthScore(lead)
  return {
    summary: generateSummary(lead),
    healthScore,
    nextAction: generateNextAction(lead),
    suggestedEmail: generateFollowUpEmail(lead),
  }
}

export function analyzeDeal(deal: any) {
  return {
    opportunityScore: calculateOpportunityScore(deal),
    recommendation: deal.probability && deal.probability >= 70
      ? 'High confidence deal. Focus on closing.'
      : deal.probability && deal.probability >= 30
        ? 'Medium confidence. Address remaining concerns.'
        : 'Early stage. Qualify further before investing more time.',
  }
}

export { getLeadHealthColor, getLeadHealthLabel }
