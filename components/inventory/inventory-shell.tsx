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
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 w-fit max-w-full">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href) || (tab.href === 'dashboard' && (pathname.endsWith('/inventory') || pathname.endsWith('/inventory/')))
          const TabIcon = tab.Icon
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/inventory/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2',
                active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
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
