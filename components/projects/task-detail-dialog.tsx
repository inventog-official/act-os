'use client'

import { useState, useEffect } from 'react'
import { Loader2, Send, Plus, Check, X, Trash2, MessageSquare, ListChecks, Tags, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

interface TaskDetailDialogProps {
  task: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function TaskDetailDialog({ task, open, onOpenChange, onUpdate }: TaskDetailDialogProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [labels, setLabels] = useState<any[]>([])
  const [allLabels, setAllLabels] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!open || !task) return
    const fetch = async () => {
      setIsLoading(true)
      const [cRes, chRes, lRes, alRes] = await Promise.all([
        supabase.from('task_comments').select('*, user:auth.users(id, email, user_metadata)').eq('task_id', task.id).is('deleted_at', null).order('created_at'),
        supabase.from('task_checklist_items').select('*').eq('task_id', task.id).order('sort_order'),
        supabase.from('task_label_assignments').select('label:task_labels(*)').eq('task_id', task.id),
        supabase.from('task_labels').select('*').is('deleted_at', null),
      ])
      setComments(cRes.data || [])
      setChecklist(chRes.data || [])
      setLabels((lRes.data || []).map((a: any) => a.label))
      setAllLabels(alRes.data || [])
      setIsLoading(false)
    }
    fetch()
  }, [open, task?.id, supabase])

  const addComment = async () => {
    if (!newComment.trim()) return
    const user = (await supabase.auth.getUser()).data.user
    const { data, error } = await supabase.from('task_comments').insert({
      task_id: task.id, user_id: user?.id, content: newComment,
    }).select('*, user:auth.users(id, email, user_metadata)').single()
    if (error) { toast.error(error.message); return }
    setComments(prev => [...prev, data])
    setNewComment('')
  }

  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return
    const user = (await supabase.auth.getUser()).data.user
    const { data, error } = await supabase.from('task_checklist_items').insert({
      task_id: task.id, text: newCheckItem, sort_order: checklist.length, created_by: user?.id,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setChecklist(prev => [...prev, data])
    setNewCheckItem('')
  }

  const toggleCheck = async (item: any) => {
    const user = (await supabase.auth.getUser()).data.user
    const { data } = await supabase.from('task_checklist_items').update({
      completed: !item.completed,
      completed_at: !item.completed ? new Date().toISOString() : null,
      completed_by: !item.completed ? user?.id : null,
    }).eq('id', item.id).select().single()
    if (data) setChecklist(prev => prev.map(c => c.id === item.id ? data : c))
  }

  const deleteCheckItem = async (id: string) => {
    await supabase.from('task_checklist_items').delete().eq('id', id)
    setChecklist(prev => prev.filter(c => c.id !== id))
  }

  const toggleLabel = async (labelId: string) => {
    const existing = labels.some(l => l.id === labelId)
    if (existing) {
      await supabase.from('task_label_assignments').delete().eq('task_id', task.id).eq('label_id', labelId)
    } else {
      await supabase.from('task_label_assignments').insert({ task_id: task.id, label_id: labelId })
    }
    const { data } = await supabase.from('task_label_assignments').select('label:task_labels(*)').eq('task_id', task.id)
    setLabels((data || []).map((a: any) => a.label))
    onUpdate()
  }

  const checkProgress = checklist.length > 0 ? Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{task.title}</span>
            <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'} className="text-[9px]">{task.priority}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
          ) : (
            <div className="space-y-6">
              {task.description && (
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Description</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{task.description}</p>
                </div>
              )}

              {/* Labels */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1"><Tags className="h-3 w-3" /> Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {allLabels.map(l => (
                    <button key={l.id} onClick={() => toggleLabel(l.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        labels.some(la => la.id === l.id) ? 'text-white' : 'text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                      style={labels.some(la => la.id === l.id) ? { backgroundColor: l.color } : {}}
                    >
                      {l.name}
                    </button>
                  ))}
                  {allLabels.length === 0 && <p className="text-xs text-zinc-400">No labels</p>}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" /> Checklist ({checklist.filter(c => c.completed).length}/{checklist.length})
                </p>
                <div className="space-y-1 mb-2">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <button onClick={() => toggleCheck(item)} className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        {item.completed && <Check className="h-3 w-3 text-white" />}
                      </button>
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-zinc-400' : ''}`}>{item.text}</span>
                      <button onClick={() => deleteCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3 text-zinc-400" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Add item..." className="flex-1 text-xs rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700" onKeyDown={e => e.key === 'Enter' && addCheckItem()} />
                  <Button variant="ghost" size="icon-sm" onClick={addCheckItem}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments ({comments.length})</p>
                <div className="space-y-3 mb-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[9px] font-medium shrink-0 dark:bg-zinc-700">
                        {(c.user?.user_metadata?.name || c.user?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{c.user?.user_metadata?.name || c.user?.email}</p>
                        <p className="text-sm">{c.content}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{formatRelativeTime(c.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 text-sm rounded-lg border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-700" onKeyDown={e => e.key === 'Enter' && addComment()} />
                  <Button variant="ghost" size="icon" onClick={addComment}><Send className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Meta */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400 mb-2">Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[9px]">{task.status?.replace('_', ' ')}</Badge></div>
                  {task.due_date && <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-zinc-400" /><span className="text-xs text-zinc-500">Due {new Date(task.due_date).toLocaleDateString()}</span></div>}
                  {task.estimated_hours && <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-zinc-400" /><span className="text-xs text-zinc-500">{task.estimated_hours}h estimated</span></div>}
                  {task.assignee_id && <div className="flex items-center gap-1"><div className="h-4 w-4 rounded-full bg-zinc-200 text-[7px] flex items-center justify-center">{task.assignee_id.charAt(0).toUpperCase()}</div><span className="text-xs text-zinc-500">Assigned</span></div>}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
