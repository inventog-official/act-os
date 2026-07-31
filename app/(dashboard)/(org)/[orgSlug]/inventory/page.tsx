'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InventoryIndexPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${orgSlug}/inventory/dashboard`)
  }, [orgSlug, router])

  return null
}