import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, Folder, Box, Building, Map, BarChart2, Activity, Truck, Users, FileText, CreditCard, RefreshCw, Shield } from 'lucide-react'

const tabs = [
  { label: 'Dashboard', href: 'dashboard', Icon: LayoutDashboard },
  { label: 'Products', href: 'products', Icon: Package },
  { label: 'Categories', href: 'categories', Icon: Folder },
  { label: 'Units', href: 'units', Icon: Box },
  { label: 'Warehouses', href: 'warehouses', Icon: Building },
  { label: 'Locations', href: 'locations', Icon: Map },
  { label: 'Stock', href: 'stock', Icon: BarChart2 },
  { label: 'Movements', href: 'movements', Icon: Activity },
  { label: 'Transfers', href: 'transfers', Icon: Truck },
  { label: 'Suppliers', href: 'suppliers', Icon: Users },
  { label: 'Purchase Requests', href: 'purchase-requests', Icon: FileText },
  { label: 'Purchase Orders', href: 'purchase-orders', Icon: CreditCard },
  { label: 'Receiving', href: 'receiving', Icon: Truck },
  { label: 'Returns', href: 'returns', Icon: RefreshCw },
  { label: 'Reports', href: 'reports', Icon: BarChart2 },
  { label: 'Assets', href: 'assets', Icon: Shield },
]

interface InventoryShellProps {
  children: ReactNode
  orgSlug: string
}

export function InventoryShell({ children, orgSlug }: InventoryShellProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 overflow-x-auto rounded-2xl bg-neutral-200/50 p-1 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md w-fit max-w-full no-scrollbar shadow-xs">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href) || (tab.href === 'dashboard' && (pathname.endsWith('/inventory') || pathname.endsWith('/inventory/')))
          const TabIcon = tab.Icon
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/inventory/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs sm:text-[13px] font-medium transition-all duration-150 flex items-center gap-2',
                active
                  ? 'bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.18] dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-semibold'
                  : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}
