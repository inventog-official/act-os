'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ActOSCoreProps {
  className?: string
  interactive?: boolean
  scrollProgress?: number
  state?: 'booting' | 'active' | 'dispersed' | 'collapsed'
}

export function ActOSCore({
  className = '',
  interactive = true,
  scrollProgress = 0,
  state = 'active',
}: ActOSCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [bootProgress, setBootProgress] = useState(0)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  // Boot sequence timer (0 to 1 over 2.4s)
  useEffect(() => {
    let start = performance.now()
    const duration = 2400
    let rafId: number

    function tick(now: number) {
      const elapsed = now - start
      const p = Math.min(1, elapsed / duration)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setBootProgress(eased)
      if (p < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Mouse tracking
  useEffect(() => {
    if (!interactive) return
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [interactive])

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
      height = canvas.parentElement?.clientHeight || 600
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    resize()
    window.addEventListener('resize', resize)

    // Particle nodes for the Core
    const PARTICLE_COUNT = 90
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const radius = 60 + Math.random() * 220
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI
      const speed = 0.002 + Math.random() * 0.004
      return {
        radius,
        theta,
        phi,
        speed,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.7,
      }
    })

    // Systems connected to the Core
    const SYSTEMS = [
      { name: 'OPERATIONS', angle: 0, dist: 220, activeRate: '99.98%', latency: '4ms' },
      { name: 'PEOPLE', angle: (Math.PI * 2) / 5, dist: 230, activeRate: '100%', latency: '12ms' },
      { name: 'WORKFLOWS', angle: (Math.PI * 4) / 5, dist: 210, activeRate: '1,420/s', latency: '2ms' },
      { name: 'INVENTORY', angle: (Math.PI * 6) / 5, dist: 240, activeRate: '98.4%', latency: '8ms' },
      { name: 'INTELLIGENCE', angle: (Math.PI * 8) / 5, dist: 225, activeRate: 'SYNCHRONIZED', latency: '1ms' },
    ]

    let time = 0

    const render = () => {
      time += 0.015

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      const boot = bootProgress
      const rotY = time * 0.35 + mouseRef.current.x * 0.6
      const rotX = Math.sin(time * 0.2) * 0.15 + mouseRef.current.y * 0.4

      // Draw outer ambient ring glow
      const ambientGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 320)
      ambientGlow.addColorStop(0, `rgba(255, 255, 255, ${0.08 * boot})`)
      ambientGlow.addColorStop(0.5, `rgba(255, 255, 255, ${0.02 * boot})`)
      ambientGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = ambientGlow
      ctx.beginPath()
      ctx.arc(cx, cy, 320, 0, Math.PI * 2)
      ctx.fill()

      // Function to project 3D point (x,y,z) to 2D screen
      const project = (x: number, y: number, z: number) => {
        // Rotate around Y
        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
        const x1 = x * cosY - z * sinY
        const z1 = z * cosY + x * sinY

        // Rotate around X
        const cosX = Math.cos(rotX)
        const sinX = Math.sin(rotX)
        const y2 = y * cosX - z1 * sinX
        const z2 = z1 * cosX + y * sinX

        const fov = 650
        const scale = fov / (fov + z2)
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          scale,
          z: z2,
        }
      }

      // Draw Concentric Architectural 3D Rings
      const RINGS = [
        { radius: 100, segments: 48, tilt: 0.3, speed: 0.5 },
        { radius: 160, segments: 64, tilt: -0.4, speed: -0.3 },
        { radius: 220, segments: 72, tilt: 0.6, speed: 0.2 },
        { radius: 280, segments: 80, tilt: -0.2, speed: -0.15 },
      ]

      RINGS.forEach((ring, rIdx) => {
        const ringProgress = Math.max(0, Math.min(1, (boot - rIdx * 0.15) / 0.5))
        if (ringProgress <= 0) return

        ctx.beginPath()
        let firstPt: { x: number; y: number } | null = null

        const maxSegments = Math.floor(ring.segments * ringProgress)
        for (let s = 0; s <= maxSegments; s++) {
          const theta = (s / ring.segments) * Math.PI * 2 + time * ring.speed
          const rx = Math.cos(theta) * ring.radius
          const ry = Math.sin(theta) * ring.radius * Math.cos(ring.tilt)
          const rz = Math.sin(theta) * ring.radius * Math.sin(ring.tilt)

          const p = project(rx, ry, rz)
          if (s === 0) {
            ctx.moveTo(p.x, p.y)
            firstPt = p
          } else {
            ctx.lineTo(p.x, p.y)
          }
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * ringProgress})`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        ctx.stroke()
        ctx.setLineDash([])

        // Draw node markers on rings
        for (let s = 0; s < ring.segments; s += 8) {
          const theta = (s / ring.segments) * Math.PI * 2 + time * ring.speed
          const rx = Math.cos(theta) * ring.radius
          const ry = Math.sin(theta) * ring.radius * Math.cos(ring.tilt)
          const rz = Math.sin(theta) * ring.radius * Math.sin(ring.tilt)
          const p = project(rx, ry, rz)

          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * ringProgress})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.8 * p.scale, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw central crystalline node matrix (The Nucleus)
      const coreNodes = [
        { x: 0, y: 0, z: 0 },
        { x: 30, y: 20, z: -15 },
        { x: -30, y: -20, z: 15 },
        { x: -25, y: 25, z: 20 },
        { x: 25, y: -25, z: -20 },
        { x: 0, y: 40, z: 0 },
        { x: 0, y: -40, z: 0 },
      ]

      // Connect nucleus nodes
      if (boot > 0.3) {
        const nucleusProg = Math.min(1, (boot - 0.3) / 0.4)
        for (let i = 0; i < coreNodes.length; i++) {
          for (let j = i + 1; j < coreNodes.length; j++) {
            const p1 = project(coreNodes[i].x * boot, coreNodes[i].y * boot, coreNodes[i].z * boot)
            const p2 = project(coreNodes[j].x * boot, coreNodes[j].y * boot, coreNodes[j].z * boot)

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * nucleusProg})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // Draw nucleus vertices
      coreNodes.forEach((n) => {
        const p = project(n.x * boot, n.y * boot, n.z * boot)
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3 * p.scale * boot, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw Orbiting Particles & Data Stream
      particles.forEach((pt) => {
        pt.theta += pt.speed
        const px = Math.cos(pt.theta) * Math.cos(pt.phi) * pt.radius * boot
        const py = Math.sin(pt.phi) * pt.radius * boot
        const pz = Math.sin(pt.theta) * Math.cos(pt.phi) * pt.radius * boot

        const p = project(px, py, pz)
        const alpha = Math.max(0.1, (p.z + 200) / 400) * pt.alpha * boot
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, pt.size * p.scale, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw Systems & Data Pathways
      if (boot > 0.5) {
        const sysProgress = (boot - 0.5) / 0.5

        SYSTEMS.forEach((sys, i) => {
          const angle = sys.angle + time * 0.1
          const dist = sys.dist * (0.8 + sysProgress * 0.2)
          const sx = Math.cos(angle) * dist
          const sy = Math.sin(angle * 0.8) * 40
          const sz = Math.sin(angle) * dist

          const pSys = project(sx, sy, sz)
          const pCenter = project(0, 0, 0)

          // Data Pathway Line
          ctx.beginPath()
          ctx.moveTo(pCenter.x, pCenter.y)
          ctx.lineTo(pSys.x, pSys.y)
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * sysProgress})`
          ctx.lineWidth = 1
          ctx.setLineDash([3, 6])
          ctx.lineDashOffset = -time * 20
          ctx.stroke()
          ctx.setLineDash([])

          // Flowing data packet on the pathway
          const packetT = (time * 0.8 + i * 0.2) % 1
          const pkX = pCenter.x + (pSys.x - pCenter.x) * packetT
          const pkY = pCenter.y + (pSys.y - pCenter.y) * packetT

          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(pkX, pkY, 2.5 * pSys.scale, 0, Math.PI * 2)
          ctx.fill()

          // System Satellite Module Box (Monochrome Architectural Card)
          const cardW = 100 * pSys.scale
          const cardH = 36 * pSys.scale

          ctx.save()
          ctx.translate(pSys.x - cardW / 2, pSys.y - cardH / 2)

          // Module background
          ctx.fillStyle = 'rgba(10, 10, 10, 0.85)'
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.roundRect(0, 0, cardW, cardH, 6)
          ctx.fill()
          ctx.stroke()

          // System Label & Live Status
          ctx.font = `600 ${Math.max(9, 10 * pSys.scale)}px var(--font-geist-mono), monospace`
          ctx.fillStyle = '#FFFFFF'
          ctx.fillText(sys.name, 8 * pSys.scale, 16 * pSys.scale)

          ctx.font = `400 ${Math.max(8, 8.5 * pSys.scale)}px var(--font-geist-mono), monospace`
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.fillText(`${sys.activeRate} · ${sys.latency}`, 8 * pSys.scale, 28 * pSys.scale)

          ctx.restore()
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
  }, [bootProgress])

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
