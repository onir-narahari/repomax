'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (url: string) => void
  loading: boolean
  exampleUrl?: string
  ctaLabel?: string
}

const EXAMPLE_URL = 'https://github.com/vercel/next.js'

export default function UrlInput({
  onSubmit,
  loading,
  exampleUrl = EXAMPLE_URL,
  ctaLabel = 'Generate',
}: Props) {
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState('')

  const validate = (url: string) => {
    if (!url.trim()) return 'Please enter a GitHub repo URL'
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.trim())) {
      return 'Enter a full GitHub repo URL (e.g. https://github.com/owner/repo)'
    }
    return ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate(value)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError('')
    onSubmit(value.trim())
  }

  const handleExample = () => {
    setValue(exampleUrl)
    setValidationError('')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setValidationError('')
          }}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repository URL"
          className="flex-1 rounded-xl border border-[#F4F0E8]/10 bg-[#F4F0E8]/5 px-4 py-3.5 text-sm text-[#F4F0E8] placeholder:text-[#F4F0E8]/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating…' : ctaLabel}
        </button>
      </div>

      {validationError && (
        <p role="alert" className="text-xs text-red-400">
          {validationError}
        </p>
      )}

      <p className="text-xs text-white/30">
        Don&apos;t have one handy?{' '}
        <button
          type="button"
          onClick={handleExample}
          className="text-blue-400 hover:underline focus:outline-none focus:underline"
        >
          Try an example
        </button>
      </p>
    </form>
  )
}
