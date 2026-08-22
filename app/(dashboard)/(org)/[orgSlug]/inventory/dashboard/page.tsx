'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Package, Boxes, Wallet, AlertTriangle, PackageX, FileText, ShoppingCart, TrendingUp,
  ArrowDownToLine, Truck, Users, Sparkles, ArrowUpRight, ArrowDownRight, Activity, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { useOrganizationStore } from '@/lib/store'
import { getDashboardMetrics, getInventoryValuation } from '@/lib/actions/inventory'
import { listPurchaseOrders, listPurchaseRequests } from '@/lib/actions/inventory'
import { getReorderSuggestions } from '@/lib/actions/inventory'
import { searchProducts, listSuppliers } from '@/lib/actions/inventory'

function StatCard({ title, value, icon: Icon, color, bg, sub, href }: any) {
  const body = (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href} className="block">{body}</Link> : body
}

function currency(n: any) {
  const v = Number(n ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

const typeColor: Record<string, string> = {
  receipt: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  issue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  adjustment: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  opening_balance: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  reservation: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
}

export default function InventoryDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [metrics, setMetrics] = useState<any>(null)
  const [valuation, setValuation] = useState<any>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([])
  const [reorders, setReorders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id
    setLoading(true)
    Promise.all([
      getDashboardMetrics(orgId).catch(() => null),
      getInventoryValuation(orgId).catch(() => null),
      listPurchaseOrders(orgId, { status: 'sent' }).catch(() => []),
      listPurchaseRequests(orgId, { status: 'pending_review' }).catch(() => []),
      getReorderSuggestions(orgId).catch(() => []),
      searchProducts(orgId).catch(() => []),
      listSuppliers(orgId).catch(() => []),
    ])
      .then(([m, v, po, pr, rr, prod, sup]) => {
        setMetrics(m)
        setValuation(v)
        setPurchaseOrders(po)
        setPurchaseRequests(pr)
        setReorders(rr ?? [])
        setProducts(prod ?? [])
        setSuppliers(sup ?? [])
      })
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <InventoryShell orgSlug={orgSlug}>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-5 mb-3" /><Skeleton className="h-8 w-24 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
              ))}
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          </div>
        </InventoryShell>
      </DashboardShell>
    )
  }

  const m = metrics?.metrics ?? {}
  const lowStock = metrics?.lowStock ?? []
  const activity = metrics?.recentActivity ?? []
  const pendingPos = purchaseOrders.filter(p => p.status === 'sent').length
  const pendingPrs = purchaseRequests.filter(p => p.status === 'pending_review').length

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Inventory Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-1">Stock, procurement, suppliers, and assets at a glance</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI-ready tools
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Products" value={products.length} icon={Package} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950" sub={`${m.tracked_products ?? 0} tracked in stock`} href={`/${orgSlug}/inventory/products`} />
            <StatCard title="Inventory Value" value={currency(valuation?.totalValue ?? m.total_value)} icon={Wallet} color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950" sub={`${valuation?.itemCount ?? 0} stock items`} href={`/${orgSlug}/inventory/reports`} />
            <StatCard title="Total Quantity" value={Number(m.total_quantity ?? 0).toLocaleString()} icon={Boxes} color="text-violet-600" bg="bg-violet-100 dark:bg-violet-950" sub="Units on hand" href={`/${orgSlug}/inventory/stock`} />
            <StatCard title="Active Suppliers" value={suppliers.filter(s => s.isActive !== false).length} icon={Users} color="text-teal-600" bg="bg-teal-100 dark:bg-teal-950" sub="Vendors" href={`/${orgSlug}/inventory/suppliers`} />

            <StatCard title="Low Stock Items" value={Number(m.low_stock_count ?? 0)} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950" sub="At or below reorder point" href={`/${orgSlug}/inventory/stock`} />
            <StatCard title="Out of Stock" value={Number(m.out_of_stock_count ?? 0)} icon={PackageX} color="text-red-600" bg="bg-red-100 dark:bg-red-950" sub="Zero available" href={`/${orgSlug}/inventory/stock`} />
            <StatCard title="Pending Purchase Orders" value={pendingPos} icon={ShoppingCart} color="text-orange-600" bg="bg-orange-100 dark:bg-orange-950" sub="Sent to suppliers" href={`/${orgSlug}/inventory/purchase-orders`} />
            <StatCard title="Pending Purchase Requests" value={pendingPrs} icon={FileText} color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950" sub="Awaiting approval" href={`/${orgSlug}/inventory/purchase-requests`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Low Stock Items</CardTitle>
                <Link href={`/${orgSlug}/inventory/stock`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">View all</Link>
              </CardHeader>
              <CardContent>
                {lowStock.length > 0 ? (
                  <div className="space-y-2">
                    {lowStock.map((item: any, i: number) => {
                      const prod = products.find((p: any) => p.id === item.product_id)
                      const pct = Number(item.reorder_point) > 0 ? Math.min(100, (Number(item.available) / Number(item.reorder_point)) * 100) : 100
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{prod?.name ?? item.product_id?.slice(0, 8)}</p>
                              <Badge variant="outline" className="shrink-0">{Number(item.available)} / {Number(item.reorder_point)}</Badge>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle className="h-10 w-10 text-emerald-300 mb-2" />
                    <p className="text-sm text-zinc-500">No low stock items</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Reorder Suggestions</CardTitle>
                <CardDescription>Based on reorder rules and current stock</CardDescription>
              </CardHeader>
              <CardContent>
                {reorders.length > 0 ? (
                  <div className="space-y-2">
                    {reorders.slice(0, 6).map((r: any, i: number) => {
                      const prod = products.find((p: any) => p.id === r.product_id)
                      return (
                        <div key={i} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{prod?.name ?? r.product_id?.slice(0, 8)}</p>
                            <p className="text-xs text-zinc-500">On hand: {Number(r.on_hand)} · Point: {Number(r.reorder_point)}</p>
                          </div>
                          <Badge>Order {Number(r.reorder_quantity)}</Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle className="h-10 w-10 text-emerald-300 mb-2" />
                    <p className="text-sm text-zinc-500">Stock levels are healthy</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length > 0 ? (
                  <div className="space-y-1">
                    {activity.slice(0, 8).map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                          <Activity className="h-3.5 w-3.5 text-zinc-500" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{a.action}</p>
                          <p className="text-xs text-zinc-500">{a.resource}{a.resource_id ? ` · ${a.resource_id.slice(0, 8)}` : ''}</p>
                        </div>
                        <span className="text-xs text-zinc-400 shrink-0">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-zinc-500">No activity yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Procurement Pipeline</CardTitle>
                <Link href={`/${orgSlug}/inventory/purchase-orders`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">View all</Link>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length > 0 || purchaseRequests.length > 0 ? (
                  <div className="space-y-2">
                    {purchaseRequests.slice(0, 3).map((pr: any) => (
                      <div key={pr.id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{pr.title}</p>
                          <p className="text-xs text-zinc-500">{pr.request_number} · {pr.status}</p>
                        </div>
                        <Badge variant="outline">{currency(pr.total_amount)}</Badge>
                      </div>
                    ))}
                    {purchaseOrders.slice(0, 3).map((po: any) => (
                      <div key={po.id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{po.po_number}</p>
                          <p className="text-xs text-zinc-500">Supplier · {po.status}</p>
                        </div>
                        <Badge variant="outline">{currency(po.total_amount)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ShoppingCart className="h-10 w-10 text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-500">No procurement activity</p>
                    <Link href={`/${orgSlug}/inventory/purchase-orders`} className="mt-3">
                      <Button variant="outline" size="sm">Create Purchase Order</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}

function CheckCircle(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg> }