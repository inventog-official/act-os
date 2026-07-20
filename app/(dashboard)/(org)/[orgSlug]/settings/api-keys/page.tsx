'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Key, Plus, Copy, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizationStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { formatRelativeTime } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
}

export default function ApiKeysPage() {
  const supabase = createClient()
  const { user } = useAuth()
  const { currentOrganization } = useOrganizationStore()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const fetchKeys = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setKeys([
          { id: '1', name: 'Production API Key', key_prefix: 'act_pub_', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), last_used_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), expires_at: null },
          { id: '2', name: 'Development Key', key_prefix: 'act_dev_', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), last_used_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() },
        ])
        return
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at, expires_at')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setKeys(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim() || !currentOrganization || !user) return
    setIsCreating(true)
    try {
      const fullKey = `act_${crypto.randomUUID().replace(/-/g, '')}`
      const keyPrefix = fullKey.slice(0, 12) + '...'

      if (!isSupabaseConfigured()) {
        setNewlyCreatedKey(fullKey)
        setKeys(prev => [{
          id: crypto.randomUUID(), name: newKeyName, key_prefix: keyPrefix,
          created_at: new Date().toISOString(), last_used_at: null, expires_at: null,
        }, ...prev])
        setNewKeyName('')
        toast.success('API key created (mock)')
        return
      }

      const { error } = await supabase.from('api_keys').insert({
        name: newKeyName,
        key_prefix: keyPrefix,
        key_hash: fullKey,
        organization_id: currentOrganization.id,
        created_by: user.id,
      })

      if (error) throw error

      setNewlyCreatedKey(fullKey)
      await fetchKeys()
      setNewKeyName('')
      toast.success('API key created')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!isSupabaseConfigured()) {
        setKeys(prev => prev.filter(k => k.id !== id))
        toast.success('API key deleted')
        return
      }

      const { error } = await supabase
        .from('api_keys')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await fetchKeys()
      toast.success('API key deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete API key')
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  }

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-zinc-500">Manage API keys for programmatic access</p>
        </div>
        <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>Create a new API key for external access</DialogDescription>
            </DialogHeader>

            {newlyCreatedKey ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Copy this key now. You won&apos;t be able to see it again.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input value={newlyCreatedKey} readOnly />
                  <Button variant="outline" size="icon" onClick={() => copyKey(newlyCreatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setNewlyCreatedKey(null); setShowNewKey(false) }}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <Input label="Key Name" placeholder="e.g. Production API Key" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewKey(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-zinc-400" />
            <CardTitle>Your API Keys</CardTitle>
          </div>
          <CardDescription>Keys used to authenticate API requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : keys.length === 0 ? (
            <EmptyState icon={Key} title="No API keys yet" description="Create one to get started." action={
              <Button onClick={() => setShowNewKey(true)}><Plus className="mr-2 h-4 w-4" />Create Key</Button>
            } />
          ) : (
            <div className="space-y-4">
              {keys.map(key => (
                <div key={key.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{key.name}</p>
                      <Badge variant="secondary" className="text-[10px] font-mono">{key.key_prefix}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>Created {formatRelativeTime(key.created_at)}</span>
                      {key.last_used_at && <span>• Last used {formatRelativeTime(key.last_used_at)}</span>}
                      {key.expires_at && <span>• Expires {formatRelativeTime(key.expires_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleVisibility(key.id)}>
                      {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(key.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
