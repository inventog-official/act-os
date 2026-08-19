'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Atmosphere } from './Atmosphere'

export function IntelligenceSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollP, setScrollP] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const p = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 1.2)))
      setScrollP(p)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Canvas 3D particle clustering animation (Entropy -> Structured 4 Clusters)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.parentElement?.clientWidth || 800
      height = canvas.parentElement?.clientHeight || 500
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    resize()
    window.addEventListener('resize', resize)

    const NUM_PARTICLES = 160
    const CLUSTERS = [
      { name: 'REVENUE', cx: -180, cy: -80 },
      { name: 'OPERATIONS', cx: 180, cy: -80 },
      { name: 'INVENTORY', cx: -180, cy: 90 },
      { name: 'PEOPLE', cx: 180, cy: 90 },
    ]

    const particles = Array.from({ length: NUM_PARTICLES }, (_, i) => {
      const clusterIdx = i % 4
      return {
        // Chaotic position
        chaosX: (Math.random() - 0.5) * 600,
        chaosY: (Math.random() - 0.5) * 400,
        // Target cluster position
        clusterIdx,
        targetOffsetX: (Math.random() - 0.5) * 90,
        targetOffsetY: (Math.random() - 0.5) * 90,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.01 + Math.random() * 0.02,
      }
    })

    let time = 0

    const render = () => {
      time += 0.015
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      // Interpolation factor between chaos (0) and cluster order (1)
      const order = scrollP

      particles.forEach((pt, idx) => {
        const cluster = CLUSTERS[pt.clusterIdx]
        const targetX = cluster.cx + pt.targetOffsetX + Math.sin(time + idx) * 5
        const targetY = cluster.cy + pt.targetOffsetY + Math.cos(time + idx) * 5

        const px = pt.chaosX * (1 - order) + targetX * order
        const py = pt.chaosY * (1 - order) + targetY * order

        ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`
        ctx.beginPath()
        ctx.arc(cx + px, cy + py, pt.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw cluster labels when ordered
      if (order > 0.4) {
        const labelAlpha = Math.min(1, (order - 0.4) / 0.6)
        CLUSTERS.forEach((cluster) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * labelAlpha})`
          ctx.font = '600 11px var(--font-geist-mono), monospace'
          ctx.textAlign = 'center'
          ctx.fillText(cluster.name, cx + cluster.cx, cy + cluster.cy - 55)

          ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * labelAlpha})`
          ctx.beginPath()
          ctx.arc(cx + cluster.cx, cy + cluster.cy, 50, 0, Math.PI * 2)
          ctx.stroke()
        })
      }

      ctx.restore()
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [scrollP])

  return (
    <section
      ref={containerRef}
      id="intelligence"
      className="lp-section min-h-[100vh] bg-black text-white relative flex flex-col justify-center overflow-hidden py-32"
    >
      <Atmosphere variant="cosmic" intensity={0.5} />

      {/* Particle Canvas Background (Chaos to Order) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-75 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full max-w-5xl max-h-[500px]" />
      </div>

      <div className="lp-container relative z-10 text-center max-w-4xl mx-auto space-y-12">
        <div>
          <span className="lp-eyebrow mb-4 block">
            06 — SYNTHESIS & REASONING
          </span>
          <h2 className="lp-headline-massive tracking-tight text-balance">
            Your business has data.
          </h2>
        </div>

        <div className="py-4">
          <p className="text-3xl md:text-5xl font-light text-neutral-300 tracking-tight">
            ACT OS gives it context.
          </p>
        </div>

        <div>
          <p className="text-2xl md:text-3xl font-light text-neutral-500 tracking-tight max-w-2xl mx-auto">
            And tells you what matters next.
          </p>
        </div>
      </div>
    </section>
  )
}
