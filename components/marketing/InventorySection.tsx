'use client'

import React, { useState } from 'react'
import { Atmosphere } from './Atmosphere'

interface WarehouseBay {
  id: string
  code: string
  label: string
  units: number
  capacityPct: number
  velocity: string
  alert?: string
}

const BAYS: WarehouseBay[] = [
  { id: 'bay-1', code: 'BAY 01', label: 'SEMICONDUCTOR BOARDS', units: 1420, capacityPct: 88, velocity: 'FAST' },
  { id: 'bay-2', code: 'BAY 02', label: 'OPTICAL SENSORS', units: 480, capacityPct: 35, velocity: 'OPTIMAL', alert: 'REORDER TRIGGERED' },
  { id: 'bay-3', code: 'BAY 03', label: 'CHASSIS HOUSINGS', units: 890, capacityPct: 92, velocity: 'HIGH' },
  { id: 'bay-4', code: 'BAY 04', label: 'POWER REGULATORS', units: 2100, capacityPct: 75, velocity: 'STABLE' },
  { id: 'bay-5', code: 'BAY 05', label: 'CONNECTIVITY MODULES', units: 620, capacityPct: 40, velocity: 'ACCELERATING' },
  { id: 'bay-6', code: 'BAY 06', label: 'PACKAGING UNITS', units: 3400, capacityPct: 95, velocity: 'RESERVE' },
]

export function InventorySection() {
  const [activeBay, setActiveBay] = useState<WarehouseBay>(BAYS[1])

  return (
    <section
      id="inventory"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-24"
    >
      <Atmosphere variant="ocean" intensity={0.6} />

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto mb-16">
        <span className="lp-eyebrow mb-4 block">
          08 — DIMENSIONAL SUPPLY
        </span>
        <h2 className="lp-headline-display mb-6 tracking-tight">
          Know what you have.
        </h2>
        <p className="text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
          Full-stack inventory intelligence spanning multi-warehouse balances, automated reorder thresholds, and demand velocity.
        </p>
      </div>

      {/* Architectural Dimensional Warehouse Grid */}
      <div className="lp-container relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 3D Architectural Stack Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BAYS.map((bay) => (
              <div
                key={bay.id}
                onClick={() => setActiveBay(bay)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] ${
                  activeBay.id === bay.id
                    ? 'bg-white/[0.12] border-white/60 shadow-xl scale-105'
                    : 'bg-neutral-950/60 border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>{bay.code}</span>
                  {bay.alert && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                </div>

                {/* Dimensional 3D Bar Indicator */}
                <div className="my-2 space-y-1.5">
                  <div className="text-xs font-semibold text-white tracking-wide truncate">
                    {bay.label}
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-500"
                      style={{ width: `${bay.capacityPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>{bay.units} UNITS</span>
                  <span>{bay.capacityPct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Selected Bay Deep Telemetry Panel */}
          <div className="lg:col-span-5 bg-neutral-950/85 border border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-mono text-xs text-white uppercase tracking-widest">
                BAY LOG // {activeBay.code}
              </span>
              <span className="font-mono text-[10px] text-emerald-400">
                AUDITED IN REAL TIME
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-lg font-medium text-white">{activeBay.label}</div>
                <div className="font-mono text-xs text-neutral-400 mt-0.5">
                  VELOCITY INDEX: <strong className="text-white">{activeBay.velocity}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                  <div className="text-[9px] text-neutral-500">ON-HAND STOCK</div>
                  <div className="text-sm text-white font-semibold mt-1">{activeBay.units} UNITS</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                  <div className="text-[9px] text-neutral-500">CAPACITY LOAD</div>
                  <div className="text-sm text-white font-semibold mt-1">{activeBay.capacityPct}%</div>
                </div>
              </div>

              {activeBay.alert ? (
                <div className="p-3 rounded-lg bg-white/[0.06] border border-white/20 font-mono text-xs text-neutral-200">
                  <div className="text-[10px] text-white font-semibold mb-1">AUTOMATED TRIGGER ENGAGED</div>
                  Threshold breached. Replenishment purchase order dispatched to tier-1 supplier.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 font-mono text-xs text-neutral-400">
                  Stock levels balanced within safety margin. Next replenishment cycle scheduled in 12 days.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 font-mono text-[10px] text-neutral-500 flex justify-between">
              <span>LEDGER: DRIZZLE_SUPABASE</span>
              <span>STATE: VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
