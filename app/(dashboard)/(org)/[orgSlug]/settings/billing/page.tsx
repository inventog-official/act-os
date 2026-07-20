'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CreditCard, Download, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { formatCurrency } from '@/lib/utils'

const plans = [
  { name: 'Free', price: 0, features: ['1 workspace', '5 team members', '1GB storage', 'Basic analytics'], id: 'free' },
  { name: 'Starter', price: 29, features: ['5 workspaces', '25 team members', '10GB storage', 'Advanced analytics', 'API access'], id: 'starter' },
  { name: 'Business', price: 99, features: ['Unlimited workspaces', 'Unlimited members', '100GB storage', 'All analytics', 'API access', 'Priority support'], id: 'business' },
  { name: 'Enterprise', price: null, features: ['Everything in Business', 'Custom storage', 'Dedicated support', 'SSO', 'Custom integrations'], id: 'enterprise', custom: true },
]

const invoices = [
  { id: 'INV-001', date: 'Dec 1, 2024', amount: 29, status: 'paid' },
  { id: 'INV-002', date: 'Nov 1, 2024', amount: 29, status: 'paid' },
  { id: 'INV-003', date: 'Oct 1, 2024', amount: 29, status: 'paid' },
]

export default function BillingPage() {
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [currentPlan, setCurrentPlan] = useState('starter')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!currentOrganization) return
      setIsLoading(true)
      try {
        if (!isSupabaseConfigured()) return

        const { data } = await supabase
          .from('organizations')
          .select('plan')
          .eq('id', currentOrganization.id)
          .single()

        if (data?.plan) setCurrentPlan(data.plan)
      } catch { /* use default */ }
      finally { setIsLoading(false) }
    }
    load()
  }, [currentOrganization, supabase])

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(planId)
    try {
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 1000))
        setCurrentPlan(planId)
        toast.success(`Upgraded to ${plans.find(p => p.id === planId)?.name}`)
        return
      }

      const { error } = await supabase
        .from('organizations')
        .update({ plan: planId })
        .eq('id', currentOrganization?.id)

      if (error) throw error
      setCurrentPlan(planId)
      toast.success('Plan updated')
    } catch (err: any) {
      toast.error(err.message || 'Upgrade failed')
    } finally {
      setIsUpgrading(null)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="text-sm text-zinc-500">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are on the {plans.find(p => p.id === currentPlan)?.name || 'Starter'} plan</CardDescription>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map(plan => {
                const isCurrent = plan.id === currentPlan
                return (
                  <div key={plan.name} className={`rounded-xl border-2 p-5 ${isCurrent ? 'border-zinc-900 dark:border-zinc-50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{plan.name}</h3>
                      {isCurrent && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="mb-4">
                      {plan.custom ? (
                        <p className="text-2xl font-bold">Custom</p>
                      ) : (
                        <><span className="text-2xl font-bold">${plan.price}</span><span className="text-sm text-zinc-400">/mo</span></>
                      )}
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-zinc-500 flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    ) : (
                      <Button
                        variant={plan.name === 'Business' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => plan.custom ? toast.info('Contact sales at sales@actos.io') : handleUpgrade(plan.id)}
                        disabled={isUpgrading === plan.id}
                      >
                        {isUpgrading === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {plan.custom ? 'Contact Sales' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-zinc-400" />
            <CardTitle>Payment Method</CardTitle>
          </div>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Visa ending in 4242</p>
              <p className="text-xs text-zinc-500">Expires 12/26</p>
            </div>
            <Badge variant="secondary">Default</Badge>
            <Button variant="outline" size="sm" onClick={() => toast.info('Payment method management coming soon')}>Update</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.id}</p>
                  <p className="text-xs text-zinc-500">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{formatCurrency(inv.amount)}</span>
                  <Badge variant="success" className="text-[10px]">Paid</Badge>
                  <Button variant="ghost" size="icon-sm" onClick={() => toast.info('Invoice download coming soon')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
