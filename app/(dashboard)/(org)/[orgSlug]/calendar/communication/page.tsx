'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { MessagesSquare, Plus, Loader2, Send, Users, FileText, Briefcase, FolderKanban, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CalendarShell } from '@/components/calendar/calendar-shell'
import { useOrganizationStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getMyThreads, getThread, listMessages, sendMessage, createThread } from '@/lib/actions/calendar'
import { toast } from 'sonner'

const entityIcons: Record<string, any> = {
  company: Briefcase,
  contact: Users,
  deal: Briefcase,
  project: FolderKanban,
  document: FileText,
}

export default function CommunicationPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [threads, setThreads] = useState<any[]>([])
  const [selectedThread, setSelectedThread] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({ title: '', thread_type: 'direct' })

  const fetchThreads = useCallback(async () => {
    if (!currentOrganization) return
    setLoading(true)
    try {
      const data = await getMyThreads(currentOrganization.id)
      setThreads(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  const openThread = async (thread: any) => {
    if (!currentOrganization) return
    setSelectedThread(thread)
    try {
      const [t, m] = await Promise.all([
        getThread(currentOrganization.id, thread.id),
        listMessages(currentOrganization.id, thread.id).catch(() => []),
      ])
      setMembers(t.members || [])
      setMessages(m || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async () => {
    if (!messageText.trim() || !selectedThread || !currentOrganization) return
    setSending(true)
    try {
      await sendMessage(currentOrganization.id, { thread_id: selectedThread.id, body: messageText })
      setMessageText('')
      openThread(selectedThread)
      fetchThreads()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !currentOrganization) return
    setSaving(true)
    try {
      await createThread(currentOrganization.id, { title: formData.title, thread_type: formData.thread_type as any })
      toast.success('Thread created')
      setShowNew(false)
      setFormData({ title: '', thread_type: 'direct' })
      fetchThreads()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CalendarShell orgSlug={orgSlug}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Communication</h1>
            <p className="text-sm text-zinc-500">{threads.length} conversation threads</p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card>
            <CardContent className="p-3">
              {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
              ) : threads.length === 0 ? (
                <div className="text-center py-10">
                  <MessagesSquare className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No threads yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map(thread => {
                    const Icon = entityIcons[thread.entityType] || MessagesSquare
                    return (
                      <button
                        key={thread.id}
                        onClick={() => openThread(thread)}
                        className={cn(
                          'w-full text-left rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors',
                          selectedThread?.id === thread.id && 'bg-zinc-100 dark:bg-zinc-800/80'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <Icon className="h-4 w-4 text-zinc-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{thread.title || thread.thread_type}</p>
                            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                              {thread.thread_type}
                              {thread.isArchived && <Badge variant="outline" className="text-[8px]">archived</Badge>}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col min-h-[480px]">
            <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-medium">
                {selectedThread ? (selectedThread.title || selectedThread.thread_type) : 'Select a thread'}
              </CardTitle>
              {selectedThread && members.length > 0 && (
                <p className="text-[10px] text-zinc-400">{members.length} participant{members.length === 1 ? '' : 's'}</p>
              )}
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
              {!selectedThread ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-zinc-400">Select a conversation to view messages</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-zinc-400">No messages yet</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                      message.messageType === 'system'
                        ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
            {selectedThread && (
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                <Textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                />
                <Button onClick={handleSend} disabled={sending || !messageText.trim()} size="icon-sm">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>New Thread</DialogTitle>
              <DialogDescription>Start a new conversation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Thread title" />
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Type</label>
                <Select value={formData.thread_type} onValueChange={v => setFormData(p => ({ ...p, thread_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="entity">Entity</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.title.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CalendarShell>
    </DashboardShell>
  )
}