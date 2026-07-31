'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DocumentsIndexPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${orgSlug}/documents/dashboard`)
  }, [orgSlug, router])

  return null
}