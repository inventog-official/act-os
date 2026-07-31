import { Box, AlertTriangle, TrendingDown, TrendingUp, ArrowUpDown, Building2 } from 'lucide-react'

export function InventoryPreview() {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-secondary)] overflow-hidden shadow-xl shadow-black/30">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
        <Box className="h-4 w-4 text-[var(--lp-accent)]" />
        <span className="text-[13px] font-semibold text-[var(--lp-text)]">Inventory Management</span>
        <span className="ml-auto text-[10px] text-[var(--lp-text-muted)]">12,840 items tracked</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Low stock alerts */}
        <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Low Stock Alerts</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 font-medium">3 items</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'MacBook Pro 16"', stock: 4, reorder: 15, sku: 'LAP-MBP16' },
              { name: 'USB-C Dock Station', stock: 8, reorder: 25, sku: 'ACC-USBC-D' },
              { name: 'Standing Desk Frame', stock: 2, reorder: 10, sku: 'FRN-STDK' },
            ].map((item) => (
              <div key={item.sku} className="flex items-center gap-3 py-1.5 border-b border-[var(--lp-border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--lp-text)] truncate">{item.name}</p>
                  <p className="text-[10px] text-[var(--lp-text-muted)] font-mono">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-red-400">{item.stock} units</p>
                  <p className="text-[10px] text-[var(--lp-text-muted)]">Reorder: {item.reorder}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock movement */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpDown className="h-3 w-3 text-[var(--lp-accent)]" />
              <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Movement</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--lp-text-secondary)]">Inbound</span>
                <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />+342</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--lp-text-secondary)]">Outbound</span>
                <span className="text-[var(--lp-accent)] flex items-center gap-1"><TrendingDown className="h-2.5 w-2.5" />-287</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--lp-text-secondary)]">Transfers</span>
                <span className="text-[var(--lp-text-muted)]">18</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 className="h-3 w-3 text-[var(--lp-accent)]" />
              <span className="text-[10px] font-medium text-[var(--lp-text-muted)] uppercase tracking-wider">Warehouses</span>
            </div>
            <div className="space-y-1.5">
              {[
                { name: 'Warehouse A', capacity: 68 },
                { name: 'Warehouse B', capacity: 92 },
                { name: 'Warehouse C', capacity: 45 },
              ].map((wh) => (
                <div key={wh.name}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--lp-text-secondary)]">{wh.name}</span>
                    <span className={`${wh.capacity > 90 ? 'text-amber-400' : 'text-[var(--lp-text-muted)]'}`}>{wh.capacity}%</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-[var(--lp-bg)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${wh.capacity}%`,
                        background: wh.capacity > 90 ? '#fbbf24' : 'var(--lp-accent)',
                        opacity: 0.6
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
