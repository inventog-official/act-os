'use client'

import { useState, useRef, useCallback } from 'react'
import { Bold, Italic, List, AtSign, Pin, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  onSubmit: (data: { title: string; content: string; is_pinned: boolean; is_private: boolean }) => Promise<void>
  onCancel?: () => void
}

export function NoteEditor({ onSubmit, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({ title, content, is_pinned: isPinned, is_private: isPrivate })
      setTitle('')
      setContent('')
      setIsPinned(false)
      setIsPrivate(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true)
    }
    if (e.key === 'Escape') {
      setShowMentions(false)
    }
  }

  const insertMention = (name: string) => {
    setContent(prev => prev + name + ' ')
    setShowMentions(false)
    editorRef.current?.focus()
  }

  const wrapSelection = (before: string, after: string) => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newContent)
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Note title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full text-sm font-medium bg-transparent border-b border-zinc-200 pb-2 focus:outline-none focus:border-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-500"
      />

      <div className="relative">
        <textarea
          ref={editorRef}
          placeholder="Write a note... Use @ to mention someone"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[120px] text-sm bg-transparent resize-none focus:outline-none leading-relaxed"
        />

        {showMentions && (
          <div className="absolute bottom-12 left-0 w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {['Admin User', 'Sarah Chen', 'Mike Johnson'].map(name => (
              <button
                key={name}
                onClick={() => insertMention(name)}
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                @{name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => wrapSelection('**', '**')}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*')}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMention('')}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            title="Mention"
          >
            <AtSign className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={cn('p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800', isPinned ? 'text-amber-500' : 'text-zinc-500')}
            title="Pin note"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={cn('p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800', isPrivate ? 'text-red-500' : 'text-zinc-500')}
            title="Private note"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          )}
          <Button type="button" size="sm" onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save Note
          </Button>
        </div>
      </div>
    </div>
  )
}
