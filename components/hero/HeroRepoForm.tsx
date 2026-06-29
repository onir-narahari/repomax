'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clipboard } from 'lucide-react'
import posthog from 'posthog-js'
import { buildGenerateHref, normalizeRepoUrl, validateRepoUrl } from '@/lib/repo-url'
import { EXAMPLE_REPO_URL } from '@/lib/score-mock'

export default function HeroRepoForm({ showLabel = true, showStrip = true }: { showLabel?: boolean; showStrip?: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [repoInput, setRepoInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clipboardHint, setClipboardHint] = useState('')

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
        {isSubmitting ? 'Starting…' : "Show Me What's Weak"}
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
