'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clipboard } from 'lucide-react'
import posthog from 'posthog-js'
import { buildGenerateHref, normalizeRepoUrl, validateRepoUrl } from '@/lib/repo-url'
import { EXAMPLE_REPO_URL } from '@/lib/score-mock'
import { createClient } from '@/lib/supabase'

const GithubMark = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
)

export default function HeroRepoForm({ showLabel = true, showStrip = true }: { showLabel?: boolean; showStrip?: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [repoInput, setRepoInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [clipboardHint, setClipboardHint] = useState('')
  const supabase = createClient()

  const handleGithubConnect = async () => {
    setGithubLoading(true)
    posthog.capture('homepage_github_connect_clicked')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/profile` },
    })
    if (error) setGithubLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeRepoUrl(repoInput)
    const err = validateRepoUrl(normalized)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError('')
    setIsSubmitting(true)
    posthog.capture('repo_submitted', { repo_url: normalized })
    router.push(buildGenerateHref(normalized))
  }

  const showClipboardHint = (msg: string) => {
    setClipboardHint(msg)
    setTimeout(() => setClipboardHint(''), 2000)
  }

  const handlePasteFromClipboard = async () => {
    inputRef.current?.focus()
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        showClipboardHint('Clipboard is empty')
        return
      }
      setRepoInput(text.trim())
      setValidationError('')
    } catch {
      showClipboardHint('Paste your URL manually')
      inputRef.current?.select()
    }
  }

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (!pasted) return
    const normalized = normalizeRepoUrl(pasted)
    if (!validateRepoUrl(normalized)) {
      e.preventDefault()
      setRepoInput(normalized)
      setValidationError('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">

      {/* Entry mode toggle — equal weight, no "or" */}
      <div className="flex w-full rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button type="button" className="flex-1 rounded-full bg-[#38D9FF] py-2 text-xs font-semibold text-[#07111F] transition">
          Paste a link
        </button>
        <button
          type="button"
          onClick={() => void handleGithubConnect()}
          disabled={githubLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold text-[#A7B0C3]/70 transition hover:text-[#A7B0C3] disabled:cursor-wait disabled:opacity-80"
        >
          <GithubMark />
          {githubLoading ? 'Redirecting…' : 'Connect GitHub'}
        </button>
      </div>

      {/* Input pill */}
      <div className="flex w-full items-center gap-3 rounded-full border border-[#A78BFA]/40 bg-[#202941] px-4 py-3.5">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => void handlePasteFromClipboard()}
            aria-label="Paste from clipboard"
            className="text-[#A7B0C3]/60 transition hover:text-[#A78BFA]"
          >
            <Clipboard className="h-4 w-4" />
          </button>
          {clipboardHint && (
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1E293B] px-2.5 py-1 text-xs text-[#A7B0C3]">
              {clipboardHint}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          id="hero-repo-url"
          type="url"
          value={repoInput}
          onChange={(e) => {
            setRepoInput(e.target.value)
            setValidationError('')
          }}
          onPaste={handleInputPaste}
          placeholder="https://github.com/your-username/your-project-name"
          disabled={isSubmitting}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          enterKeyHint="go"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#A7B0C3]/50 disabled:opacity-60"
        />
      </div>

      {validationError && (
        <p role="alert" className="text-xs text-red-400">
          {validationError}
        </p>
      )}

      {/* CTA — below the pill */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-full bg-[#38D9FF] px-8 py-3 text-sm font-semibold text-[#07111F] transition hover:bg-[#5DE4FF] hover:shadow-[0_0_28px_rgba(56,217,255,0.35)] disabled:cursor-wait disabled:opacity-80"
      >
        {isSubmitting ? 'Starting…' : 'Score My Repo'}
        {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
      </button>

      {/* Example link */}
      <button
        type="button"
        onClick={() => {
          posthog.capture('example_result_clicked')
          router.push(buildGenerateHref(EXAMPLE_REPO_URL))
        }}
        className="text-xs text-[#A7B0C3]/60 hover:text-[#A7B0C3] transition-colors"
      >
        See an example score →
      </button>

    </form>
  )
}
