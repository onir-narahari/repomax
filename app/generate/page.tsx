'use client'

import posthog from 'posthog-js'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Wordmark from '@/components/Wordmark'
import GenerateBackground from '@/components/GenerateBackground'
import OutputTabs from '@/components/OutputTabs'
import ErrorBanner from '@/components/ErrorBanner'
import AuthModal from '@/components/AuthModal'
import ProfileButton from '@/components/ProfileButton'
import type { SaveStatus } from '@/components/RepoScoreCard'
import { createClient } from '@/lib/supabase'
import { normalizeRepoUrl, validateRepoUrl } from '@/lib/repo-url'
import type { AnalyzeResponse, AppErrorCode } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type GeneratorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: AnalyzeResponse }
  | { status: 'error'; code: AppErrorCode }

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_LABELS = [
  'Reading your repository…',
  'Extracting project signals…',
  'Writing resume bullets…',
  'Scoring your repo…',
  'Finalizing results…',
]

// ─── Loading label ─────────────────────────────────────────────────────────────

function LoadingLabel() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % LOADING_LABELS.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <p key={i} className="loading-label text-center text-sm text-[#687386]" aria-live="polite">
      {LOADING_LABELS[i]}
    </p>
  )
}

// ─── Main page content ─────────────────────────────────────────────────────────

function GeneratePageContent() {
  const searchParams = useSearchParams()
  const autoSubmitted = useRef(false)
  const [launchedFromQuery, setLaunchedFromQuery] = useState(false)

  const [state, setState] = useState<GeneratorState>({ status: 'idle' })
  const [submittedUrl, setSubmittedUrl] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [validationError, setValidationError] = useState('')
  const [hasScoredOnce, setHasScoredOnce] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const requireAuth = (action: () => void | Promise<void>) => {
    pendingActionRef.current = action
    setShowAuthModal(true)
  }

  const hasExistingSave = async (userId: string, repoUrl: string, score: number) => {
    const { data } = await supabase
      .from('repo_scores')
      .select('id')
      .eq('user_id', userId)
      .eq('repo_url', repoUrl)
      .eq('score', score)
      .maybeSingle()
    return !!data
  }

  const refreshSaveStatus = async (repoUrl: string, score: number | null) => {
    if (score === null) {
      setSaveStatus('unsaved')
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaveStatus('unsaved')
      return
    }
    setSaveStatus('checking')
    const exists = await hasExistingSave(session.user.id, repoUrl, score)
    setSaveStatus(exists ? 'saved' : 'unsaved')
  }

  const handleSaveScore = async () => {
    if (state.status !== 'results' || saveStatus === 'saved' || saveStatus === 'saving' || saveStatus === 'checking') return
    const score = state.data.repoScore
    if (!score) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      requireAuth(() => handleSaveScore())
      return
    }

    setSaveStatus('saving')
    const exists = await hasExistingSave(session.user.id, submittedUrl, score.total)
    if (exists) {
      setSaveStatus('saved')
      return
    }

    const { error } = await supabase.from('repo_scores').insert({
      user_id: session.user.id,
      repo_url: submittedUrl,
      repo_name: submittedUrl.replace('https://github.com/', ''),
      score: score.total,
      label: score.label,
      summary: score.summary,
      result: state.data,
    })

    if (error) {
      posthog.captureException(error)
      setSaveStatus('unsaved')
      return
    }

    posthog.capture('repo_score_saved', { repo_url: submittedUrl, score: score.total })
    setSaveStatus('saved')
  }

  const submitUrl = async (url: string) => {
    const normalized = normalizeRepoUrl(url)
    setSubmittedUrl(normalized)
    setState({ status: 'loading' })
    setSaveStatus('idle')
    posthog.capture('repo_submitted', { repo_url: normalized })
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-posthog-distinct-id': posthog.get_distinct_id() ?? '',
          'x-posthog-session-id': posthog.get_session_id() ?? '',
        },
        body: JSON.stringify({ repoUrl: normalized }),
      })
      const data = await res.json()
      if (!res.ok) {
        const code = (data.error as AppErrorCode) ?? 'UNKNOWN'
        posthog.capture('repo_score_failed', { error_code: code, repo_url: normalized })
        setState({ status: 'error', code })
        return
      }
      setState({ status: 'results', data: data as AnalyzeResponse })
      setHasScoredOnce(true)
      setUrlValue('')
      await refreshSaveStatus(normalized, (data as AnalyzeResponse).repoScore?.total ?? null)
    } catch (err) {
      posthog.captureException(err)
      posthog.capture('repo_score_failed', { error_code: 'UNKNOWN', repo_url: normalized })
      setState({ status: 'error', code: 'UNKNOWN' })
    }
  }

  useEffect(() => {
    const repoParam = searchParams.get('repo')
    if (!repoParam || autoSubmitted.current) return
    autoSubmitted.current = true
    const normalized = normalizeRepoUrl(repoParam)
    const err = validateRepoUrl(normalized)
    if (err) {
      setUrlValue(repoParam)
      setValidationError(err)
      return
    }
    setUrlValue(normalized)
    setLaunchedFromQuery(true)
    void submitUrl(normalized)
  }, [searchParams])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeRepoUrl(urlValue)
    const err = validateRepoUrl(normalized)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError('')
    if (hasScoredOnce && !isAuthed) {
      requireAuth(() => submitUrl(normalized))
      return
    }
    await submitUrl(normalized)
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    if (action) await action()
  }

  const isLoading = state.status === 'loading'
  const results = state.status === 'results' ? state.data : undefined
  const hasResults = state.status === 'results'
  const isIdle = state.status === 'idle' || state.status === 'error'
  const showFullInput = !hasScoredOnce && (!launchedFromQuery || state.status === 'error')
  const showCompactInput = hasScoredOnce
  const homeHref = isAuthed ? '/profile' : '/'

  const repoInput = (compact: boolean) => (
    <form
      onSubmit={handleFormSubmit}
      className={compact ? '' : 'mt-7 sm:mt-8'}
    >
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-stretch ${compact ? 'gap-1.5' : ''}`}>
        <div className="min-w-0 flex-1">
          <label htmlFor="repo-url" className="sr-only">Repository URL</label>
          <input
            id="repo-url"
            type="text"
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value)
              setValidationError('')
            }}
            placeholder="owner/repo or github.com/owner/repo"
            disabled={isLoading}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            className={`w-full rounded-xl border border-[#242B3A] bg-[#090D16] font-mono text-sm text-[#F5F3EA] placeholder:font-sans placeholder:text-[#687386] transition focus:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/15 disabled:opacity-50 ${
              compact ? 'px-3 py-2' : 'px-4 py-3.5'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={
            compact
              ? 'shrink-0 rounded-xl border border-[#242B3A] bg-[#111827] px-4 py-2 text-sm font-semibold text-[#F5F3EA] transition hover:border-[#334155] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:whitespace-nowrap'
              : 'shrink-0 rounded-xl bg-[#F5F3EA] px-7 py-3.5 text-sm font-semibold text-[#070A12] transition hover:bg-[#E7E2D7] focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[168px]'
          }
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`inline-block h-1 w-1 rounded-full ${compact ? 'bg-current opacity-70' : 'bg-[#070A12]/70'}`}
                    style={{ animation: 'dotPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </span>
              Scoring
            </span>
          ) : compact ? (
            'Try another repo →'
          ) : (
            'Get your Repo Score →'
          )}
        </button>
      </div>
      {validationError && (
        <p role="alert" className="mt-2.5 text-xs text-red-400">{validationError}</p>
      )}
    </form>
  )

  return (
    <main className="relative flex min-h-screen flex-col text-[#F5F3EA]">
      <GenerateBackground />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#070A12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href={homeHref} className="transition-opacity hover:opacity-80">
            <Wordmark variant="generate" className="text-xl font-bold tracking-tight sm:text-2xl" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={homeHref}
              aria-label="Back to home"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#242B3A] bg-[#0D111C] text-[#687386] transition hover:border-[#334155] hover:text-[#9AA3B5]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <ProfileButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div
        className={`relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 sm:px-8 ${
          isIdle ? 'justify-center py-10 sm:py-14' : hasResults ? 'pt-4 sm:pt-6' : 'pt-10 sm:pt-14'
        }`}
      >
        {/* Full idle/error input */}
        {showFullInput && (
          <section className="mb-8 anim-in" style={{ animationDelay: '80ms' }}>
            {!launchedFromQuery && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#F5F3EA] sm:text-3xl">
                  Paste your GitHub URL.{' '}
                  <span className="text-[#7AA7FF]">Get your Repo Score.</span>
                </h1>
              </div>
            )}
            {isLoading && <LoadingLabel />}
            {(!launchedFromQuery || state.status === 'error') && repoInput(false)}
          </section>
        )}

        {/* Launched from query, still loading */}
        {launchedFromQuery && isLoading && !showFullInput && (
          <section className="mb-8 anim-in">
            <LoadingLabel />
          </section>
        )}

        {/* Compact input after first score */}
        {showCompactInput && (
          <section className="mb-5 anim-in" style={{ animationDelay: '80ms' }}>
            {repoInput(true)}
          </section>
        )}

        {/* Error banner */}
        {state.status === 'error' && (
          <div className="mb-6 anim-in">
            <ErrorBanner code={state.code} onDismiss={() => setState({ status: 'idle' })} />
          </div>
        )}

        {/* Results */}
        <div className="anim-in" style={{ animationDelay: '100ms' }}>
          <OutputTabs
            data={results}
            repoUrl={submittedUrl}
            isLoading={isLoading}
            isAuthed={isAuthed}
            onRequireAuth={requireAuth}
            saveStatus={saveStatus}
            onSaveScore={handleSaveScore}
          />
        </div>

      </div>

      <footer className="relative z-10 pb-10 text-center text-xs text-[#687386]">
        Only reads public repos.
      </footer>
    </main>
  )
}

// ─── Fallback ──────────────────────────────────────────────────────────────────

function GeneratePageFallback() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center text-[#687386]">
      <GenerateBackground />
      <p className="relative z-10 text-sm">Loading…</p>
    </main>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<GeneratePageFallback />}>
      <GeneratePageContent />
    </Suspense>
  )
}
