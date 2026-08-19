'use client'

import React from 'react'

export type AtmosphereVariant = 'cosmic' | 'solar' | 'aurora' | 'nebula' | 'ocean' | 'hero' | 'subtle'

interface AtmosphereProps {
  variant?: AtmosphereVariant
  className?: string
  intensity?: number // 0 to 1, default 0.8
}

const PALETTES: Record<AtmosphereVariant, { primary: string; secondary: string; tertiary: string }> = {
  hero: {
    primary: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(10, 47, 138, 0.42) 0%, rgba(99, 102, 241, 0.22) 40%, rgba(168, 85, 247, 0.12) 65%, transparent 100%)',
    secondary: 'radial-gradient(circle 500px at 80% 40%, rgba(192, 132, 252, 0.18) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 80%)',
    tertiary: 'radial-gradient(circle 450px at 20% 50%, rgba(14, 165, 233, 0.15) 0%, rgba(10, 47, 138, 0.15) 60%, transparent 80%)',
  },
  cosmic: {
    primary: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124, 58, 237, 0.35) 0%, rgba(192, 38, 211, 0.22) 40%, rgba(10, 47, 138, 0.18) 70%, transparent 100%)',
    secondary: 'radial-gradient(circle 480px at 25% 45%, rgba(147, 51, 234, 0.22) 0%, transparent 75%)',
    tertiary: 'radial-gradient(circle 440px at 75% 55%, rgba(219, 39, 119, 0.18) 0%, transparent 75%)',
  },
  solar: {
    primary: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249, 115, 22, 0.32) 0%, rgba(244, 63, 94, 0.22) 45%, rgba(236, 72, 153, 0.12) 75%, transparent 100%)',
    secondary: 'radial-gradient(circle 480px at 70% 35%, rgba(251, 146, 60, 0.2) 0%, transparent 75%)',
    tertiary: 'radial-gradient(circle 440px at 30% 65%, rgba(244, 63, 94, 0.18) 0%, transparent 75%)',
  },
  aurora: {
    primary: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6, 182, 212, 0.32) 0%, rgba(99, 102, 241, 0.22) 45%, rgba(10, 47, 138, 0.2) 75%, transparent 100%)',
    secondary: 'radial-gradient(circle 480px at 30% 40%, rgba(20, 184, 166, 0.2) 0%, transparent 75%)',
    tertiary: 'radial-gradient(circle 450px at 70% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 75%)',
  },
  nebula: {
    primary: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(168, 85, 247, 0.32) 0%, rgba(236, 72, 153, 0.22) 45%, rgba(239, 68, 68, 0.14) 75%, transparent 100%)',
    secondary: 'radial-gradient(circle 480px at 75% 45%, rgba(192, 38, 211, 0.2) 0%, transparent 75%)',
    tertiary: 'radial-gradient(circle 440px at 25% 55%, rgba(239, 68, 68, 0.16) 0%, transparent 75%)',
  },
  ocean: {
    primary: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14, 165, 233, 0.35) 0%, rgba(10, 47, 138, 0.3) 45%, rgba(99, 102, 241, 0.15) 75%, transparent 100%)',
    secondary: 'radial-gradient(circle 480px at 25% 40%, rgba(6, 182, 212, 0.22) 0%, transparent 75%)',
    tertiary: 'radial-gradient(circle 460px at 75% 60%, rgba(59, 130, 246, 0.2) 0%, transparent 75%)',
  },
  subtle: {
    primary: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(10, 47, 138, 0.2) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 80%)',
    secondary: 'radial-gradient(circle 400px at 75% 40%, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
    tertiary: 'radial-gradient(circle 400px at 25% 60%, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
  },
}

export function Atmosphere({ variant = 'cosmic', className = '', intensity = 1 }: AtmosphereProps) {
  const palette = PALETTES[variant] || PALETTES.cosmic

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
      style={{ opacity: intensity }}
    >
      {/* Primary Atmospheric Field */}
      <div
        className="absolute inset-0"
        style={{
          background: palette.primary,
          filter: 'blur(80px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Secondary Dynamic Drift Orb */}
      <div
        className="absolute inset-0"
        style={{
          background: palette.secondary,
          filter: 'blur(90px)',
          animation: 'lp-atm-drift-1 22s ease-in-out infinite',
          transform: 'translateZ(0)',
        }}
      />

      {/* Tertiary Ambient Drift Orb */}
      <div
        className="absolute inset-0"
        style={{
          background: palette.tertiary,
          filter: 'blur(100px)',
          animation: 'lp-atm-drift-2 28s ease-in-out infinite',
          transform: 'translateZ(0)',
        }}
      />

      {/* Soft Vignette Overlay to maintain dark edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 50%, #000000 100%)',
        }}
      />
    </div>
  )
}
