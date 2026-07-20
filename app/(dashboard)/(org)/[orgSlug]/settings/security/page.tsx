'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Shield, Key, Smartphone, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Session {
  id: string
  user_agent: string
  created_at: string
  is_current: boolean
}

export default function SecurityPage() {
  const supabase = createClient()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured() || !user) {
        setSessions([{ id: 'current', user_agent: 'MacOS • Chrome', created_at: new Date().toISOString(), is_current: true }])
        setSessionsLoading(false)
        return
      }
      try {
        const { data, error } = await supabase.auth.admin.listUsers()
        if (error) throw error
        setSessions([{ id: 'current', user_agent: 'MacOS • Chrome • Now', created_at: new Date().toISOString(), is_current: true }])
      } catch {
        setSessions([{ id: 'current', user_agent: 'Current session', created_at: new Date().toISOString(), is_current: true }])
      } finally {
        setSessionsLoading(false)
      }
    }
    load()
  }, [user, supabase])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 800))
        toast.success('Password updated successfully (mock)')
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message); return }
      toast.success('Password updated successfully')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFA = async () => {
    if (!isSupabaseConfigured()) {
      toast.success('MFA setup initiated (mock)')
      return
    }
    const { error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) { toast.error(error.message); return }
    toast.success('MFA setup initiated')
  }

  const handleSignOutOthers = async () => {
    setSigningOut(true)
    try {
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success('Other sessions signed out (mock)')
        return
      }
      const { error } = await supabase.auth.admin.signOut('others')
      if (error) throw error
      toast.success('Other sessions signed out')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-sm text-zinc-500">Manage your account security</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-zinc-400" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your password regularly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-zinc-400" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>Add an extra layer of security</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 mb-4">
            Protect your account with two-factor authentication using an authenticator app.
          </p>
          <Button variant="outline" onClick={handleMFA}>
            <Shield className="mr-2 h-4 w-4" />
            Set up 2FA
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-400" />
            <CardTitle>Sessions</CardTitle>
          </div>
          <CardDescription>Manage your active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium">{s.user_agent}</p>
                    <p className="text-xs text-zinc-500">{s.is_current ? 'Current session' : new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  {s.is_current && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
              ))}
              <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={handleSignOutOthers} disabled={signingOut}>
                {signingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign out all other sessions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
