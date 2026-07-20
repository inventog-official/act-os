'use client'

import { Sparkles, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

const suggestions = [
  'What tasks are overdue?',
  'Summarize this week\'s activity',
  'Which projects need attention?',
]

export function AiWidget() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsLoading(true)
    // Simulate AI response
    setTimeout(() => setIsLoading(false), 1500)
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900" />
      <CardHeader className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle>AI Assistant</CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">Preview</Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask AI anything..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-400">
            Ask me anything about your business operations
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
