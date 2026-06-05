'use client'

import { useEffect, useState } from 'react'
import ReposScoredBadge from '@/components/ReposScoredBadge'

export default function ReposScoredNavBadge() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data: { label?: string | null }) => {
        if (!cancelled) setLabel(data.label ?? null)
      })
      .catch(() => {
        if (!cancelled) setLabel(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <ReposScoredBadge label={label} />
}
