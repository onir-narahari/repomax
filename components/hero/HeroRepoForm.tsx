'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clipboard } from 'lucide-react'
import { buildGenerateHref, normalizeRepoUrl, validateRepoUrl } from '@/lib/repo-url'
import { EXAMPLE_REPO_URL } from '@/lib/score-mock'

export default function HeroRepoForm({ showLabel = true }: { showLabel?: boolean }) {
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

  const handleTryExample = () => {
    router.push(buildGenerateHref(EXAMPLE_REPO_URL))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {showLabel && (
        <label htmlFor="hero-repo-url" className="mb-2.5 block text-xs font-medium tracking-wide text-[#A7B0C3]">
          Paste your GitHub repo URL
        </label>
      )}
      <div className="flex items-center gap-2 rounded-full border border-[#A78BFA]/40 bg-[#202941] p-1.5">
        <button
          type="button"
          onClick={() => void handlePasteFromClipboard()}
          aria-label="Paste from clipboard"
          className="ml-1 shrink-0 text-[#A7B0C3]/60 transition hover:text-[#A78BFA]"
        >
          <Clipboard className="h-4 w-4" />
        </button>
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
          placeholder="github.com/your-username/your-project"
          disabled={isSubmitting}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          enterKeyHint="go"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#F8FAFC] outline-none placeholder:text-[#A7B0C3]/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#38D9FF] px-5 py-2.5 text-sm font-semibold text-[#07111F] transition hover:bg-[#5DE4FF] hover:shadow-[0_0_28px_rgba(56,217,255,0.40)] disabled:cursor-wait disabled:opacity-80"
        >
          {isSubmitting ? 'Starting…' : 'Score My Repo'}
          {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {validationError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {validationError}
        </p>
      )}

      <div className="mt-3 flex flex-col items-center gap-2">
        <span className="text-xs text-[#A7B0C3]/70 text-center">
          Public repos only · Results in ~45 seconds · Nothing stored
        </span>
        <button
          type="button"
          onClick={handleTryExample}
          className="text-xs text-[#A78BFA]/80 underline-offset-2 hover:text-[#C4B5FD] hover:underline transition-colors duration-150"
        >
          See a real result first →
        </button>
      </div>
    </form>
  )
}
