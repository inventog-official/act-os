'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { BarChart3, DollarSign, TrendingDown, Truck } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getDashboardMetrics, getInventoryValuation, listStockMovements, listPurchaseOrders } from '@/lib/actions/inventory'

export default function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [metrics, setMetrics] = useState<any>(null)
  const [valuation, setValuation] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [m, v, mov, po] = await Promise.all([
        getDashboardMetrics(currentOrganization.id),
        getInventoryValuation(currentOrganization.id),
        listStockMovements(currentOrganization.id, { limit: 20 }),
        listPurchaseOrders(currentOrganization.id),
      ])
      setMetrics(m)
      setValuation(v)
      setMovements(mov ?? [])
      setOrders(po ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0)
  const shippedValue = movements.filter(m => m.type === 'outbound').reduce((s, m) => s + Number(m.quantity) * Number(m.unitCost ?? 0), 0)

  const stat = (label: string, value: string, sub: string, icon: React.ReactNode) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{sub}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  const movementTypeLabel: Record<string, string> = {
    opening_balance: 'Opening Balance', purchase_receipt: 'Purchase Receipt', purchase_return: 'Purchase Return',
    transfer_out: 'Transfer Out', transfer_in: 'Transfer In', adjustment: 'Adjustment', allocation: 'Project Allocation', issue: 'Issue',
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Inventory Reports</h1>
            <p className="text-sm text-zinc-500 mt-1">Valuation, movement history, and procurement spend</p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-zinc-500">Loading reports...</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stat('Inventory Value (Cost)', formatCurrency(Number(metrics?.metrics?.total_value ?? 0)), 'Based on unit cost', <DollarSign className="h-4 w-4 text-zinc-500" />)}
                {stat('Inventory Value (Avg Cost)', formatCurrency(Number(valuation?.totalValueAvg ?? 0)), `${valuation?.itemCount ?? 0} tracked items`, <BarChart3 className="h-4 w-4 text-zinc-500" />)}
                {stat('Low Stock Items', String(metrics?.metrics?.low_stock_count ?? 0), 'Below reorder point', <TrendingDown className="h-4 w-4 text-zinc-500" />)}
                {stat('Procurement Spend', formatCurrency(totalSpend), `${orders.length} purchase orders`, <Truck className="h-4 w-4 text-zinc-500" />)}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Recent Movement History</CardTitle></CardHeader>
                <CardContent>
                  {movements.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-6 text-center">No stock movements recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            {['Type', 'Quantity', 'Reference', 'Date'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {movements.map((m) => (
                            <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                              <td className="px-4 py-3 text-sm font-medium">{movementTypeLabel[m.type] || m.type}</td>
                              <td className="px-4 py-3 text-sm">{Number(m.quantity)}</td>
                              <td className="px-4 py-3 text-sm font-mono text-zinc-500">{m.referenceId ? m.referenceId.slice(0, 8) : '—'}</td>
                              <td className="px-4 py-3 text-sm text-zinc-500">{m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Purchase Orders</CardTitle></CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-6 text-center">No purchase orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            {['PO Number', 'Status', 'Total', 'Created'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                              <td className="px-4 py-3 text-sm font-mono">{o.poNumber}</td>
                              <td className="px-4 py-3"><Badge variant="outline">{o.status?.replace(/_/g, ' ')}</Badge></td>
                              <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(Number(o.totalAmount))}</td>
                              <td className="px-4 py-3 text-sm text-zinc-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}