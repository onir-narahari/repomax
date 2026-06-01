'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Wordmark from '@/components/Wordmark'
import GenerateBackground from '@/components/GenerateBackground'
import OutputTabs from '@/components/OutputTabs'
import ErrorBanner from '@/components/ErrorBanner'
import type { AnalyzeResponse, AppErrorCode } from '@/types'

type GeneratorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: AnalyzeResponse }
  | { status: 'error'; code: AppErrorCode }

const LOADING_LABELS = [
  'Reading your repository…',
  'Extracting project signals…',
  'Writing resume bullets…',
  'Polishing your story…',
]

function InputLoading() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % LOADING_LABELS.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <p
      key={i}
      className="loading-label mx-auto mb-6 max-w-lg text-center text-sm text-[#687386]"
      aria-live="polite"
    >
      {LOADING_LABELS[i]}
    </p>
  )
}

export default function GeneratePage() {
  const [state, setState] = useState<GeneratorState>({ status: 'idle' })
  const [submittedUrl, setSubmittedUrl] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [validationError, setValidationError] = useState('')

  const validate = (url: string) => {
    if (!url.trim()) return 'Please enter a GitHub repo URL'
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.trim())) {
      return 'Enter a full GitHub repo URL (e.g. https://github.com/owner/repo)'
    }
    return ''
  }

  const submitUrl = async (url: string) => {
    setSubmittedUrl(url)
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', code: (data.error as AppErrorCode) ?? 'UNKNOWN' })
        return
      }
      setState({ status: 'results', data: data as AnalyzeResponse })
    } catch {
      setState({ status: 'error', code: 'UNKNOWN' })
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate(urlValue)
    if (err) { setValidationError(err); return }
    setValidationError('')
    await submitUrl(urlValue.trim())
  }

  const dismissError = () => setState({ status: 'idle' })

  const isLoading = state.status === 'loading'
  const results = state.status === 'results' ? state.data : undefined
  const centerIdle = state.status === 'idle' || state.status === 'error'

  return (
    <main className="relative flex min-h-screen flex-col text-[#F5F3EA]">
      <GenerateBackground />

      {/* Header */}
      <header className="relative z-20 border-b border-[#242B3A] bg-[#070A12]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Wordmark variant="generate" className="text-lg font-bold tracking-tight" />
          </Link>
          <Link
            href="/"
            aria-label="Back to home"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#242B3A] bg-[#0D111C] text-[#687386] transition hover:border-[#334155] hover:text-[#9AA3B5]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div
        className={`relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 sm:px-8 ${
          centerIdle ? 'justify-center py-10 sm:py-14' : 'pt-10 sm:pt-14'
        }`}
      >
        {/* Input studio bar */}
        <section className="mb-8 anim-in" style={{ animationDelay: '80ms' }}>
          <p className="mx-auto max-w-lg text-center text-xl font-semibold tracking-[-0.02em] text-[#F5F3EA] sm:text-2xl">
            Paste GitHub URL.{' '}
            <span className="font-display italic text-[#7AA7FF]">Get hired.</span>
          </p>
          {isLoading && <InputLoading />}
          <form onSubmit={handleFormSubmit} className={`mx-auto max-w-2xl ${isLoading ? 'mt-0' : 'mt-7 sm:mt-8'}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="min-w-0 flex-1">
                <label htmlFor="repo-url" className="sr-only">
                  Repository URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={urlValue}
                  onChange={(e) => {
                    setUrlValue(e.target.value)
                    setValidationError('')
                  }}
                  placeholder="https://github.com/owner/repo"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#242B3A] bg-[#090D16] px-4 py-3.5 font-mono text-sm text-[#F5F3EA] placeholder:font-sans placeholder:text-[#687386] transition focus:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/15 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="shrink-0 rounded-xl bg-[#F5F3EA] px-7 py-3.5 text-sm font-semibold text-[#070A12] transition hover:bg-[#E7E2D7] focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[168px]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-flex gap-1" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1 w-1 rounded-full bg-[#070A12]/70"
                          style={{
                            animation: 'dotPulse 1.4s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </span>
                    Generating
                  </span>
                ) : (
                  'Generate story →'
                )}
              </button>
            </div>

            {validationError && (
              <p role="alert" className="mt-2.5 text-xs text-red-400">
                {validationError}
              </p>
            )}
          </form>
        </section>

        {/* Error Banner */}
        {state.status === 'error' && (
          <div className="mb-6 anim-in">
            <ErrorBanner code={state.code} onDismiss={dismissError} />
          </div>
        )}

        {/* Output */}
        {!isLoading && (
          <div className="anim-in" style={{ animationDelay: '100ms' }}>
            <OutputTabs data={results} />
          </div>
        )}

      </div>

      <footer className="relative z-10 pb-10 text-center text-xs text-[#687386]">
        Only reads public repos. No data is stored.
      </footer>
    </main>
  )
}
