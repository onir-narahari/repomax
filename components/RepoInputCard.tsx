'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (url: string) => void
  loading: boolean
  exampleUrl?: string
}

const EXAMPLE_URL = 'https://github.com/vercel/next.js'

export default function RepoInputCard({
  onSubmit,
  loading,
  exampleUrl = EXAMPLE_URL,
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
    <div className="rounded-2xl border border-[#1E3A5F]/70 bg-[#0A0F1E]/90 p-6 shadow-[0_0_40px_rgba(37,99,235,0.06)] sm:p-8">
      <h2 className="mb-1 text-lg font-semibold text-white">Paste your GitHub repo</h2>
      <p className="mb-6 text-sm text-[#8B9DC3]">
        Public repos only. We read your README, stack, and structure — nothing is stored.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="repo-url"
            type="url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setValidationError('')
            }}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-xl border border-white/10 bg-[#050508] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            disabled={loading}
          />
        </div>

        {validationError && (
          <p role="alert" className="text-xs text-red-400">
            {validationError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate project story'}
        </button>

        <p className="text-center text-xs text-white/30">
          Don&apos;t have one handy?{' '}
          <button
            type="button"
            onClick={handleExample}
            className="text-blue-400 transition hover:text-blue-300 hover:underline focus:outline-none focus:underline"
          >
            Try an example
          </button>
        </p>
      </form>
    </div>
  )
}
