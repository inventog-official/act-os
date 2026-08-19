'use client'

import React, { useRef } from 'react'
import { useScroll, useTransform } from 'framer-motion'
import { GoogleGeminiEffect } from '@/components/ui/google-gemini-effect'
import { Atmosphere } from './Atmosphere'

export function GeminiEffectSection() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2])
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2])
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2])
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2])
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2])

  return (
    <div
      ref={ref}
      id="neural-kernel"
      className="h-[280vh] bg-black w-full relative pt-24 overflow-clip text-white"
    >
      <Atmosphere variant="cosmic" intensity={0.65} />

      <GoogleGeminiEffect
        title="Intelligence at Scale."
        description="As your enterprise scales, ACT OS continuously weaves operations, finance, workforce, and supply into a single, self-optimizing nervous system."
        className="top-40 md:top-60"
        pathLengths={[
          pathLengthFirst,
          pathLengthSecond,
          pathLengthThird,
          pathLengthFourth,
          pathLengthFifth,
        ]}
      />
    </div>
  )
}
