'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import posthog from 'posthog-js'
import { createClient, oauthRedirectTo } from '@/lib/supabase'

const GithubMark = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
)

const SIZE_CLASSES = {
  md: 'gap-2 px-6 py-3 text-sm',
  lg: 'gap-2.5 px-7 py-3.5 text-[15px]',
}

export default function HeroGithubCta({
  className = '',
  size = 'md',
  label = 'Start free with GitHub',
}: {
  className?: string
  size?: 'md' | 'lg'
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGithubConnect = async () => {
    setLoading(true)
    posthog.capture('homepage_github_connect_clicked')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: oauthRedirectTo('/profile') },
    })
    if (error) setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={() => void handleGithubConnect()}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full bg-[#EC4899] font-semibold text-white transition hover:bg-[#F472B6] hover:shadow-[0_0_28px_rgba(236,72,153,0.35)] disabled:cursor-wait disabled:opacity-80 ${SIZE_CLASSES[size]} ${className}`}
    >
      <GithubMark className={size === 'lg' ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
      {loading ? 'Redirecting…' : label}
      {!loading && <ArrowRight className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />}
    </button>
  )
}
