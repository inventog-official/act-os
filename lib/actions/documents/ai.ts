'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDocumentTool } from '@/lib/ai/document-tools'
import {
  getDashboardStats,
  getDocuments,
  getDocument,
  searchDocuments,
  getKnowledgeArticles,
  getSops,
  getPolicies,
  getContracts,
  getExpiringContracts,
  getPendingApprovals,
  getDocumentActivity,
  createDocument,
  updateDocument,
  changeDocumentStatus,
  deleteDocument,
  createFolder,
  shareDocument,
  revokeShare,
  requestApproval,
  respondToApproval,
  createKnowledgeArticle,
  createSop,
  createPolicy,
  createContract,
  updateContract,
} from './index'

export async function documentAIAction(name: string, organizationId: string, args?: Record<string, unknown>) {
  const tool = getDocumentTool(name)
  if (!tool) throw new Error(`Unknown document tool: ${name}`)
  if (!organizationId) throw new Error('Organization is required')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (tool.requiresApproval && tool.risk !== 'low') {
    return {
      requiresApproval: true,
      tool: name,
      risk: tool.risk,
      message: 'This action requires approval before execution.',
    }
  }

  const results: Record<string, unknown> = {}

  if (name === 'get_document_dashboard_stats') results.data = await getDashboardStats(organizationId)
  else if (name === 'get_documents') results.data = await getDocuments(organizationId, (args as any)?.opts)
  else if (name === 'get_document') results.data = await getDocument(organizationId, String(args?.documentId))
  else if (name === 'search_documents') results.data = await searchDocuments(organizationId, String(args?.query ?? ''))
  else if (name === 'get_knowledge_articles') results.data = await getKnowledgeArticles(organizationId, (args as any)?.opts)
  else if (name === 'get_sops') results.data = await getSops(organizationId, (args as any)?.opts)
  else if (name === 'get_policies') results.data = await getPolicies(organizationId, (args as any)?.opts)
  else if (name === 'get_contracts') results.data = await getContracts(organizationId, (args as any)?.opts)
  else if (name === 'get_expiring_contracts') results.data = await getExpiringContracts(organizationId, Number(args?.days ?? 30))
  else if (name === 'get_pending_approvals') results.data = await getPendingApprovals(organizationId)
  else if (name === 'get_document_activity') results.data = await getDocumentActivity(organizationId)
  else if (name === 'create_document') results.data = await createDocument(organizationId, (args as any)?.input)
  else if (name === 'update_document') results.data = await updateDocument(organizationId, String(args?.documentId), (args as any)?.input)
  else if (name === 'change_document_status') results.data = await changeDocumentStatus(organizationId, String(args?.documentId), (args as any)?.status)
  else if (name === 'delete_document') results.data = await deleteDocument(organizationId, String(args?.documentId))
  else if (name === 'create_folder') results.data = await createFolder(organizationId, (args as any)?.input)
  else if (name === 'share_document') results.data = await shareDocument(organizationId, (args as any)?.input)
  else if (name === 'revoke_share') results.data = await revokeShare(organizationId, String(args?.shareId))
  else if (name === 'request_approval') results.data = await requestApproval(organizationId, (args as any)?.input)
  else if (name === 'respond_to_approval') results.data = await respondToApproval(organizationId, (args as any)?.input)
  else if (name === 'create_knowledge_article') results.data = await createKnowledgeArticle(organizationId, (args as any)?.input)
  else if (name === 'create_sop') results.data = await createSop(organizationId, (args as any)?.input)
  else if (name === 'create_policy') results.data = await createPolicy(organizationId, (args as any)?.input)
  else if (name === 'create_contract') results.data = await createContract(organizationId, (args as any)?.input)
  else if (name === 'update_contract') results.data = await updateContract(organizationId, String(args?.contractId), (args as any)?.input)
  else throw new Error(`Unsupported document tool: ${name}`)

  return { ...results, tool: name, audited: tool.audited, reversible: tool.reversible }
}

export async function documentAssistantAnswer(question: string, organizationId: string) {
  const q = question.toLowerCase()
  const stats = await getDashboardStats(organizationId)

  if (q.includes('contract') || q.includes('expiring') || q.includes('renewal')) {
    const expiring = await getExpiringContracts(organizationId, 90)
    const active = stats.activeContracts
    return {
      answer: `You have ${active} active contracts and ${expiring.length} expiring within 90 days. ` + expiring.map(c => c.name).join(', '),
      data: { activeContracts: active, expiring },
    }
  }

  if (q.includes('approval') || q.includes('approve') || q.includes('pending')) {
    const pending = await getPendingApprovals(organizationId)
    return {
      answer: `You have ${stats.pendingApprovals} pending document approvals.`,
      data: { pendingApprovals: stats.pendingApprovals, approvals: pending },
    }
  }

  if (q.includes('knowledge') || q.includes('article') || q.includes('wiki')) {
    const articles = await getKnowledgeArticles(organizationId)
    return {
      answer: `Your knowledge base has ${stats.publishedArticles} published articles across categories like ` + [...new Set(articles.map(a => a.category))].slice(0, 5).join(', '),
      data: { publishedArticles: stats.publishedArticles, articles },
    }
  }

  if (q.includes('sop') || q.includes('procedure')) {
    return {
      answer: `You have ${stats.totalSops} standard operating procedures documented.`,
      data: { totalSops: stats.totalSops },
    }
  }

  if (q.includes('policy')) {
    return {
      answer: `You have ${stats.totalPolicies} policies in your document library.`,
      data: { totalPolicies: stats.totalPolicies },
    }
  }

  if (q.includes('document') || q.includes('file') || q.includes('knowledge')) {
    return {
      answer: `Your organization has ${stats.totalDocuments} documents (${stats.publishedDocuments} published, ${stats.draftDocuments} drafts) across ${stats.totalFolders} folders.`,
      data: stats,
    }
  }

  return {
    answer: `Here is a snapshot of your document library: ${stats.totalDocuments} total documents, ${stats.publishedDocuments} published, ${stats.pendingApprovals} pending approvals, ${stats.activeContracts} active contracts, ${stats.publishedArticles} knowledge articles.`,
    data: stats,
  }
}