'use client'

import React, { useEffect, useRef } from 'react'

export function AuthVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
      width = canvas.parentElement?.clientWidth || 600
      height = canvas.parentElement?.clientHeight || 700
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    resize()
    window.addEventListener('resize', resize)

    let angle = 0
    const rings = [
      { r: 90, speed: 0.005, nodes: 4, rotOffset: 0 },
      { r: 150, speed: -0.003, nodes: 6, rotOffset: Math.PI / 4 },
      { r: 220, speed: 0.002, nodes: 8, rotOffset: Math.PI / 3 },
      { r: 290, speed: -0.0015, nodes: 10, rotOffset: Math.PI / 6 },
    ]

    const particles = Array.from({ length: 48 }, () => ({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 0.8 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.5,
    }))

    const render = () => {
      angle += 0.01
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      // Atmospheric soft radial background glow
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 320)
      grad.addColorStop(0, 'rgba(120, 80, 255, 0.07)')
      grad.addColorStop(0.4, 'rgba(40, 140, 255, 0.04)')
      grad.addColorStop(0.8, 'rgba(255, 100, 150, 0.02)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Orbiting particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (Math.abs(p.x) > 280) p.vx *= -1
        if (Math.abs(p.y) > 280) p.vy *= -1

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.7})`
        ctx.beginPath()
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Concentric structural wireframe rings & nodes
      rings.forEach((ring, rIdx) => {
        const ringAngle = angle * ring.speed * 60 + ring.rotOffset

        // Ring trace
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + rIdx * 0.02})`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Nodes on ring
        for (let i = 0; i < ring.nodes; i++) {
          const theta = ringAngle + (i * 2 * Math.PI) / ring.nodes
          const nx = cx + Math.cos(theta) * ring.r
          const ny = cy + Math.sin(theta) * ring.r

          // Subtle connect lines to center occasionally
          if ((i + rIdx) % 3 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(nx, ny)
            ctx.stroke()
          }

          // Node dot
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.beginPath()
          ctx.arc(nx, ny, 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Central Nucleus Emblem
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
