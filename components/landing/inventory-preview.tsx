'use client'

import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/landing/reveal'
import { GradientAtmosphere } from '@/components/landing/gradient-atmosphere'
import { Box, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react'

const inventoryItems = [
  { sku: 'SKU-MBP-01', name: 'Workstation Unit M3 Max', stock: '4 units', status: 'CRITICAL LOW', reorder: '20 on order' },
  { sku: 'SKU-DSK-44', name: 'Motorized Standing System', stock: '18 units', status: 'OPTIMAL', reorder: 'Next review in 14d' },
  { sku: 'SKU-HUB-90', name: 'Enterprise ThunderDock Pro', stock: '8 units', status: 'REORDER TRIGGERED', reorder: 'PO-2026-042 sent' },
  { sku: 'SKU-DIS-12', name: '4K Color-Accurate Display 32"', stock: '26 units', status: 'OPTIMAL', reorder: 'Stock nominal' },
]

export function InventoryPreview() {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="lp-section bg-black" id="inventory">
      {/* Subtle Purple / Cyan Atmospheric Gradient */}
      <GradientAtmosphere variant="violet" intensity="low" />

      <div className="relative z-10 lp-container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <Reveal variant="up">
            <span className="lp-eyebrow mb-4 sm:mb-6">INVENTORY</span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="lp-headline text-white font-normal mt-3">
              Know what you have. Know what needs attention.
            </h2>
          </Reveal>
          <Reveal variant="up" delay={200}>
            <p className="mt-6 text-base sm:text-lg text-[#A1A1A1] leading-relaxed font-normal max-w-2xl mx-auto">
              Real-time asset telemetry, procurement automation, and multi-location warehouse synchronization in one unified ledger.
            </p>
          </Reveal>
        </div>

        {/* Clean Monochrome Inventory Interface */}
        <div
          ref={ref}
          className="mx-auto max-w-4xl rounded-2xl border border-white/[0.12] bg-[#0A0A0A] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8)] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          {/* Top Inventory Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-base font-normal text-white">Central SKU & Stock Control</h3>
                <span className="text-[12px] text-[#666666]">3 Warehouses · 12,840 Total Units</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white px-3 py-1 rounded-full border border-white/20 bg-black">
                Automated Reordering Active
              </span>
            </div>
          </div>

          {/* Table Rows - Pure Monochrome Typography & Contrast */}
          <div className="divide-y divide-white/[0.06] pt-2">
            {inventoryItems.map((item) => (
              <div
                key={item.sku}
                className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-white/[0.02] px-2 rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] text-[#666666]">{item.sku}</span>
                    <span className="text-[14px] font-normal text-white">{item.name}</span>
                  </div>
                  <div className="text-[12px] text-[#A1A1A1]">{item.reorder}</div>
                </div>

                <div className="flex items-center sm:text-right justify-between sm:justify-end gap-4">
                  <span className="text-[14px] font-normal text-white">{item.stock}</span>
                  <span className="text-[11px] tracking-wider uppercase px-2.5 py-1 rounded border border-white/10 bg-black text-[#A1A1A1]">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
