'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ClipboardPaste } from 'lucide-react'
import { buildGenerateHref, normalizeRepoUrl, validateRepoUrl } from '@/lib/repo-url'

export default function HeroRepoForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [repoInput, setRepoInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    router.push(buildGenerateHref(normalized))
  }

  const handlePasteFromClipboard = async () => {
    inputRef.current?.focus()
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) return
      setRepoInput(text.trim())
      setValidationError('')
    } catch {
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
    <form onSubmit={handleSubmit} className="anim-in mt-8 w-full max-w-md" style={{ animationDelay: '240ms' }}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="hero-repo-url" className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          GitHub repo
        </label>
        <button
          type="button"
          onClick={() => void handlePasteFromClipboard()}
          className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/45 transition hover:border-blue-500/25 hover:text-blue-300/90"
        >
          <ClipboardPaste className="h-3 w-3" />
          Paste
        </button>
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
        placeholder="https://github.com/owner/repo"
        disabled={isSubmitting}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="url"
        enterKeyHint="go"
        className="mt-2 w-full rounded-xl border border-[#1E3A5F]/80 bg-[#0A0F1E]/80 px-4 py-3.5 font-mono text-sm text-white/90 outline-none placeholder:text-white/25 backdrop-blur-sm focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60"
      />
      {validationError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {validationError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 hover:shadow-[0_0_36px_rgba(59,130,246,0.42)] disabled:cursor-wait disabled:opacity-80 sm:w-auto"
      >
        {isSubmitting ? 'Starting…' : 'Get your Repo Score'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  )
}
