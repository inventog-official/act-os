'use server'

import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import {
  documents,
  documentApprovals,
  documentContracts,
  documentFolders,
  knowledgeArticles,
  documentSops,
  documentPolicies,
} from '@/db/schema'
import { guardDocumentPermission } from './utils'

export async function getDashboardStats(organizationId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')

  const [
    totalDocs,
    publishedDocs,
    draftDocs,
    pendingApprovals,
    activeContracts,
    expiringContracts,
    totalFolders,
    publishedArticles,
    totalSops,
    totalPolicies,
  ] = await Promise.all([
    db.select({ value: count() }).from(documents).where(and(eq(documents.organizationId, organizationId), isNull(documents.deletedAt))),
    db.select({ value: count() }).from(documents).where(and(eq(documents.organizationId, organizationId), eq(documents.status, 'published'), isNull(documents.deletedAt))),
    db.select({ value: count() }).from(documents).where(and(eq(documents.organizationId, organizationId), eq(documents.status, 'draft'), isNull(documents.deletedAt))),
    db.select({ value: count() }).from(documentApprovals).where(and(eq(documentApprovals.organizationId, organizationId), eq(documentApprovals.status, 'pending'))),
    db.select({ value: count() }).from(documentContracts).where(and(eq(documentContracts.organizationId, organizationId), eq(documentContracts.status, 'active'), isNull(documentContracts.deletedAt))),
    db.select({ value: count() }).from(documentContracts).where(and(eq(documentContracts.organizationId, organizationId), eq(documentContracts.status, 'expiring'), isNull(documentContracts.deletedAt))),
    db.select({ value: count() }).from(documentFolders).where(and(eq(documentFolders.organizationId, organizationId), isNull(documentFolders.deletedAt))),
    db.select({ value: count() }).from(knowledgeArticles).where(and(eq(knowledgeArticles.organizationId, organizationId), eq(knowledgeArticles.status, 'published'), isNull(knowledgeArticles.deletedAt))),
    db.select({ value: count() }).from(documentSops).where(and(eq(documentSops.organizationId, organizationId), isNull(documentSops.deletedAt))),
    db.select({ value: count() }).from(documentPolicies).where(and(eq(documentPolicies.organizationId, organizationId), isNull(documentPolicies.deletedAt))),
  ])

  return {
    totalDocuments: totalDocs[0]?.value ?? 0,
    publishedDocuments: publishedDocs[0]?.value ?? 0,
    draftDocuments: draftDocs[0]?.value ?? 0,
    pendingApprovals: pendingApprovals[0]?.value ?? 0,
    activeContracts: activeContracts[0]?.value ?? 0,
    expiringContracts: expiringContracts[0]?.value ?? 0,
    totalFolders: totalFolders[0]?.value ?? 0,
    publishedArticles: publishedArticles[0]?.value ?? 0,
    totalSops: totalSops[0]?.value ?? 0,
    totalPolicies: totalPolicies[0]?.value ?? 0,
  }
}

export async function getRecentDocuments(organizationId: string, limit = 10) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.organizationId, organizationId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt))
    .limit(limit)
}