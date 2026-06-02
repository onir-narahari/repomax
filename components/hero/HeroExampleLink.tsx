'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { buildGenerateHref } from '@/lib/repo-url'
import { EXAMPLE_REPO_URL } from '@/lib/score-mock'

interface Props {
  className?: string
}

export default function HeroExampleLink({ className = '' }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(buildGenerateHref(EXAMPLE_REPO_URL))}
      className={`anim-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90 ${className}`}
      style={{ animationDelay: '300ms' }}
    >
      See an example repo
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}
