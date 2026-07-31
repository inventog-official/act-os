'use server'

import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  documents,
  documentFolders,
  documentVersions,
  documentShares,
  documentComments,
  documentApprovals,
  documentTemplates,
  documentActivities,
  knowledgeArticles,
} from '@/db/schema'
import {
  documentSchema,
  documentFolderSchema,
  documentShareSchema,
  documentCommentSchema,
  documentApprovalSchema,
  documentApprovalResponseSchema,
  documentTemplateSchema,
  knowledgeArticleSchema,
  type DocumentInput,
  type DocumentFolderInput,
  type DocumentShareInput,
  type DocumentCommentInput,
  type DocumentApprovalInput,
  type DocumentApprovalResponseInput,
  type DocumentTemplateInput,
  type KnowledgeArticleInput,
} from '@/lib/utils/validations'
import { getCurrentUser, guardDocumentPermission, logDocumentActivity, ensureOrganizationScope } from './utils'

const NOT_DELETED = isNull(documents.deletedAt)

export async function createDocument(organizationId: string, input: DocumentInput) {
  await guardDocumentPermission(organizationId, 'documents:create')
  const user = await getCurrentUser()
  const data = documentSchema.parse(input)

  const [doc] = await db
    .insert(documents)
    .values({
      title: data.title,
      description: data.description ?? null,
      documentType: data.document_type,
      content: data.content ? (data.content as any) : undefined,
      contentText: data.content_text ?? null,
      mimeType: data.mime_type,
      fileUrl: data.file_url ?? null,
      fileSize: data.file_size ?? 0,
      folderId: data.folder_id ?? null,
      ownerId: data.owner_id ?? user.id,
      departmentId: data.department_id ?? null,
      status: data.status,
      expirationDate: data.expiration_date ? new Date(data.expiration_date) : null,
      effectiveDate: data.effective_date ? new Date(data.effective_date) : null,
      templateId: data.template_id ?? null,
      tags: data.tags ?? [],
      organizationId,
      createdBy: user.id,
      updatedBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'document.create',
    resource: 'document',
    resourceId: doc.id,
    documentId: doc.id,
    metadata: { title: doc.title, type: doc.documentType },
  })

  return doc
}

export async function updateDocument(organizationId: string, documentId: string, input: Partial<DocumentInput>) {
  await guardDocumentPermission(organizationId, 'documents:update')
  const user = await getCurrentUser()
  const existing = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED)).limit(1)
  if (!existing[0]) throw new Error('Document not found')

  const data = documentSchema.partial().parse(input)
  const [doc] = await db
    .update(documents)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.content !== undefined && { content: data.content as any }),
      ...(data.content_text !== undefined && { contentText: data.content_text ?? null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.folder_id !== undefined && { folderId: data.folder_id }),
      ...(data.department_id !== undefined && { departmentId: data.department_id }),
      ...(data.expiration_date !== undefined && { expirationDate: data.expiration_date ? new Date(data.expiration_date) : null }),
      ...(data.effective_date !== undefined && { effectiveDate: data.effective_date ? new Date(data.effective_date) : null }),
      ...(data.tags !== undefined && { tags: data.tags }),
      updatedBy: user.id,
    } as any)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED))
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'document.update',
    resource: 'document',
    resourceId: documentId,
    documentId,
    metadata: { changes: Object.keys(data) },
  })

  return doc
}

export async function saveDocumentContent(organizationId: string, documentId: string, content: unknown, contentText?: string) {
  await guardDocumentPermission(organizationId, 'documents:update')
  const user = await getCurrentUser()

  const existing = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED)).limit(1)
  if (!existing[0]) throw new Error('Document not found')

  const currentVersion = existing[0].currentVersion ?? 1

  await db.insert(documentVersions).values({
    documentId,
    versionNumber: currentVersion,
    content: existing[0].content as any,
    contentText: existing[0].contentText ?? null,
    changeSummary: 'Auto-saved previous version before edit',
    createdBy: user.id,
    organizationId,
  } as any)

  const [doc] = await db
    .update(documents)
    .set({
      content: content as any,
      contentText: contentText ?? null,
      currentVersion: currentVersion + 1,
      updatedBy: user.id,
    } as any)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED))
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'document.content_saved',
    resource: 'document',
    resourceId: documentId,
    documentId,
    metadata: { version: currentVersion + 1 },
  })

  return doc
}

export async function changeDocumentStatus(organizationId: string, documentId: string, status: DocumentInput['status']) {
  await guardDocumentPermission(organizationId, 'documents:update')
  const user = await getCurrentUser()
  const [doc] = await db
    .update(documents)
    .set({ status, updatedBy: user.id } as any)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED))
    .returning()

  if (!doc) throw new Error('Document not found')
  await logDocumentActivity({
    organizationId,
    action: `document.status_${status}`,
    resource: 'document',
    resourceId: documentId,
    documentId,
    metadata: { status },
  })
  return doc
}

export async function deleteDocument(organizationId: string, documentId: string) {
  await guardDocumentPermission(organizationId, 'documents:delete')
  const user = await getCurrentUser()
  const [doc] = await db
    .update(documents)
    .set({ deletedAt: new Date(), updatedBy: user.id } as any)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED))
    .returning()

  if (!doc) throw new Error('Document not found')
  await logDocumentActivity({
    organizationId,
    action: 'document.delete',
    resource: 'document',
    resourceId: documentId,
    documentId,
  })
  return doc
}

export async function getDocument(organizationId: string, documentId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const [doc] = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), NOT_DELETED)).limit(1)
  return doc ?? null
}

export async function getDocuments(organizationId: string, opts?: { folderId?: string | null; type?: string; status?: string; search?: string }) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(documents.organizationId, organizationId), NOT_DELETED]
  if (opts?.folderId) conditions.push(eq(documents.folderId, opts.folderId))
  if (opts?.type) conditions.push(eq(documents.documentType, opts.type))
  if (opts?.status) conditions.push(eq(documents.status, opts.status))
  if (opts?.search) conditions.push(or(ilike(documents.title, `%${opts.search}%`), ilike(documents.description, `%${opts.search}%`)) as any)

  return db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt))
    .limit(100)
}

export async function getDocumentVersions(organizationId: string, documentId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.documentId, documentId), eq(documentVersions.organizationId, organizationId)))
    .orderBy(desc(documentVersions.versionNumber))
}

export async function createFolder(organizationId: string, input: DocumentFolderInput) {
  await guardDocumentPermission(organizationId, 'documents:create')
  const user = await getCurrentUser()
  const data = documentFolderSchema.parse(input)
  const [folder] = await db
    .insert(documentFolders)
    .values({
      name: data.name,
      description: data.description ?? null,
      parentId: data.parent_id ?? null,
      color: data.color ?? '#3b82f6',
      icon: data.icon ?? null,
      organizationId,
      createdBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'folder.create',
    resource: 'folder',
    resourceId: folder.id,
    metadata: { name: folder.name },
  })
  return folder
}

export async function updateFolder(organizationId: string, folderId: string, input: Partial<DocumentFolderInput>) {
  await guardDocumentPermission(organizationId, 'documents:update')
  const data = documentFolderSchema.partial().parse(input)
  const [folder] = await db
    .update(documentFolders)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parent_id !== undefined && { parentId: data.parent_id }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.icon !== undefined && { icon: data.icon }),
} as any)
    .where(and(eq(documentFolders.id, folderId), eq(documentFolders.organizationId, organizationId), isNull(documentFolders.deletedAt)))
    .returning()
  return folder
}

export async function deleteFolder(organizationId: string, folderId: string) {
  await guardDocumentPermission(organizationId, 'documents:delete')
  const [folder] = await db
    .update(documentFolders)
    .set({ deletedAt: new Date() } as any)
    .where(and(eq(documentFolders.id, folderId), eq(documentFolders.organizationId, organizationId), isNull(documentFolders.deletedAt)))
    .returning()
  return folder
}

export async function getFolders(organizationId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documentFolders)
    .where(and(eq(documentFolders.organizationId, organizationId), isNull(documentFolders.deletedAt)))
    .orderBy(asc(documentFolders.name))
}

export async function shareDocument(organizationId: string, input: DocumentShareInput) {
  await guardDocumentPermission(organizationId, 'documents:share')
  const user = await getCurrentUser()
  const data = documentShareSchema.parse(input)

  const [doc] = await db.select().from(documents).where(and(eq(documents.id, data.document_id), eq(documents.organizationId, organizationId), NOT_DELETED)).limit(1)
  if (!doc) throw new Error('Document not found')

  const [share] = await db
    .insert(documentShares)
    .values({
      documentId: data.document_id,
      shareType: data.share_type,
      sharedWithUserId: data.shared_with_user_id ?? null,
      sharedWithTeamId: data.shared_with_team_id ?? null,
      sharedWithDepartmentId: data.shared_with_department_id ?? null,
      permission: data.permission,
      shareToken: data.share_type === 'link' ? crypto.randomUUID() : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      organizationId,
      createdBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'document.share',
    resource: 'documents:share',
    resourceId: share.id,
    documentId: data.document_id,
    metadata: { shareType: data.share_type, permission: data.permission },
  })
  return share
}

export async function getDocumentShares(organizationId: string, documentId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documentShares)
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.organizationId, organizationId)))
    .orderBy(desc(documentShares.createdAt))
}

export async function revokeShare(organizationId: string, shareId: string) {
  await guardDocumentPermission(organizationId, 'documents:share')
  const [removed] = await db
    .delete(documentShares)
    .where(and(eq(documentShares.id, shareId), eq(documentShares.organizationId, organizationId)))
    .returning()
  if (removed) {
    await logDocumentActivity({
      organizationId,
      action: 'document.share_revoked',
      resource: 'documents:share',
      resourceId: shareId,
      documentId: removed.documentId,
    })
  }
  return removed
}

export async function addComment(organizationId: string, input: DocumentCommentInput) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const user = await getCurrentUser()
  const data = documentCommentSchema.parse(input)
  const [comment] = await db
    .insert(documentComments)
    .values({
      documentId: data.document_id,
      parentId: data.parent_id ?? null,
      content: data.content,
      mentions: JSON.stringify(data.mentions ?? []),
      organizationId,
      createdBy: user.id,
    } as any)
    .returning()
  return comment
}

export async function getComments(organizationId: string, documentId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documentComments)
    .where(and(eq(documentComments.documentId, documentId), eq(documentComments.organizationId, organizationId)))
    .orderBy(asc(documentComments.createdAt))
}

export async function resolveComment(organizationId: string, commentId: string) {
  await guardDocumentPermission(organizationId, 'documents:update')
  const user = await getCurrentUser()
  const [comment] = await db
    .update(documentComments)
    .set({ isResolved: true, resolvedBy: user.id, resolvedAt: new Date() } as any)
    .where(and(eq(documentComments.id, commentId), eq(documentComments.organizationId, organizationId)))
    .returning()
  return comment
}

export async function requestApproval(organizationId: string, input: DocumentApprovalInput) {
  await guardDocumentPermission(organizationId, 'documents:approve')
  const user = await getCurrentUser()
  const data = documentApprovalSchema.parse(input)
  const [approval] = await db
    .insert(documentApprovals)
    .values({
      documentId: data.document_id,
      requestedBy: user.id,
      assignedTo: data.assigned_to ?? null,
      status: 'pending',
      comment: data.comment ?? null,
      organizationId,
    } as any)
    .returning()

  await changeDocumentStatus(organizationId, data.document_id, 'approval')
  await logDocumentActivity({
    organizationId,
    action: 'document.approval_requested',
    resource: 'document_approval',
    resourceId: approval.id,
    documentId: data.document_id,
    metadata: { assignedTo: data.assigned_to ?? null },
  })
  return approval
}

export async function respondToApproval(organizationId: string, input: DocumentApprovalResponseInput) {
  await guardDocumentPermission(organizationId, 'documents:approve')
  const user = await getCurrentUser()
  const data = documentApprovalResponseSchema.parse(input)
  const [approval] = await db
    .update(documentApprovals)
    .set({ status: data.action, comment: data.comment ?? null, respondedAt: new Date() } as any)
    .where(and(eq(documentApprovals.id, data.approval_id), eq(documentApprovals.organizationId, organizationId)))
    .returning()

  if (approval) {
    const nextStatus = data.action === 'approve' ? 'approved' : 'review'
    await db.update(documents).set({ status: nextStatus } as any)
      .where(and(eq(documents.id, approval.documentId), eq(documents.organizationId, organizationId)))
    await logDocumentActivity({
      organizationId,
      action: `document.approval_${data.action}`,
      resource: 'document_approval',
      resourceId: approval.id,
      documentId: approval.documentId,
      metadata: { comment: data.comment ?? null },
    })
  }
  return approval
}

export async function getPendingApprovals(organizationId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const user = await getCurrentUser()
  return db
    .select({
      id: documentApprovals.id,
      documentId: documentApprovals.documentId,
      title: documents.title,
      status: documentApprovals.status,
      createdAt: documentApprovals.createdAt,
    })
    .from(documentApprovals)
    .innerJoin(documents, and(eq(documents.id, documentApprovals.documentId), eq(documents.organizationId, organizationId)))
    .where(and(
      eq(documentApprovals.organizationId, organizationId),
      eq(documentApprovals.status, 'pending'),
      or(eq(documentApprovals.assignedTo, user.id), eq(documentApprovals.requestedBy, user.id)) as any,
    ))
    .orderBy(desc(documentApprovals.createdAt))
}

export async function createTemplate(organizationId: string, input: DocumentTemplateInput) {
  await guardDocumentPermission(organizationId, 'documents:templates:manage')
  const user = await getCurrentUser()
  const data = documentTemplateSchema.parse(input)
  const [template] = await db
    .insert(documentTemplates)
    .values({
      name: data.name,
      description: data.description ?? null,
      documentType: data.document_type,
      content: data.content ? (data.content as any) : undefined,
      contentText: data.content_text ?? null,
      category: data.category ?? null,
      organizationId,
      createdBy: user.id,
    } as any)
    .returning()
  return template
}

export async function getTemplates(organizationId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  return db
    .select()
    .from(documentTemplates)
    .where(and(eq(documentTemplates.organizationId, organizationId), isNull(documentTemplates.deletedAt)))
    .orderBy(asc(documentTemplates.name))
}

export async function createKnowledgeArticle(organizationId: string, input: KnowledgeArticleInput) {
  await guardDocumentPermission(organizationId, 'documents:knowledge:manage')
  const user = await getCurrentUser()
  const data = knowledgeArticleSchema.parse(input)
  const [article] = await db
    .insert(knowledgeArticles)
    .values({
      title: data.title,
      summary: data.summary ?? null,
      content: data.content ? (data.content as any) : undefined,
      contentText: data.content_text ?? null,
      category: data.category,
      tags: data.tags ?? [],
      status: data.status,
      authorId: data.author_id ?? user.id,
      organizationId,
      createdBy: user.id,
      updatedBy: user.id,
    } as any)
    .returning()
  return article
}

export async function getKnowledgeArticles(organizationId: string, opts?: { category?: string; search?: string }) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(knowledgeArticles.organizationId, organizationId), isNull(knowledgeArticles.deletedAt)]
  if (opts?.category) conditions.push(eq(knowledgeArticles.category, opts.category))
  if (opts?.search) conditions.push(or(ilike(knowledgeArticles.title, `%${opts.search}%`), ilike(knowledgeArticles.contentText, `%${opts.search}%`)) as any)
  return db
    .select()
    .from(knowledgeArticles)
    .where(and(...conditions))
    .orderBy(desc(knowledgeArticles.updatedAt))
    .limit(100)
}

export async function searchDocuments(organizationId: string, query: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(documents.organizationId, organizationId), NOT_DELETED]
  if (query) conditions.push(or(ilike(documents.title, `%${query}%`), ilike(documents.contentText, `%${query}%`), ilike(documents.tags, `%${query}%`)) as any)
  return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.updatedAt)).limit(20)
}

export async function getDocumentActivity(organizationId: string) {
  await guardDocumentPermission(organizationId, 'documents:activity:read')
  return db
    .select()
    .from(documentActivities)
    .where(eq(documentActivities.organizationId, organizationId))
    .orderBy(desc(documentActivities.createdAt))
    .limit(50)
}