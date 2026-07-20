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
import GitHubRepoPicker from '@/components/GitHubRepoPicker'
import { createClient, oauthRedirectTo } from '@/lib/supabase'
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

// ─── Scan cache ──────────────────────────────────────────────────────────────
// Survives the full-page redirect that OAuth sign-in causes (React state does not),
// so unlocking bullets via Google/GitHub doesn't re-run the whole analysis.

const SCAN_CACHE_KEY = 'repomax:lastScan'

function readScanCache(repoUrl: string): AnalyzeResponse | null {
  try {
    const raw = sessionStorage.getItem(SCAN_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { repoUrl: string; data: AnalyzeResponse }
    return parsed.repoUrl === repoUrl ? parsed.data : null
  } catch {
    return null
  }
}

function writeScanCache(repoUrl: string, data: AnalyzeResponse) {
  try {
    sessionStorage.setItem(SCAN_CACHE_KEY, JSON.stringify({ repoUrl, data }))
  } catch {}
}

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
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [entryMode, setEntryMode] = useState<'url' | 'github'>('url')
  const [githubConnectLoading, setGithubConnectLoading] = useState(false)
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null)

  const supabase = createClient()

  const deriveGithubUsername = (session: { user: { app_metadata?: { provider?: string }; user_metadata?: { user_name?: string } } } | null) => {
    if (session?.user.app_metadata?.provider !== 'github') return null
    return session.user.user_metadata?.user_name ?? null
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      setGithubUsername(deriveGithubUsername(data.session))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(!!session)
      setGithubUsername(deriveGithubUsername(session))
      if (event === 'SIGNED_IN' && session) {
        const { created_at, last_sign_in_at } = session.user
        const isNewAccount =
          !!created_at &&
          !!last_sign_in_at &&
          Math.abs(new Date(last_sign_in_at).getTime() - new Date(created_at).getTime()) < 5000
        if (isNewAccount) {
          posthog.capture('account_created', { method: session.user.app_metadata?.provider ?? 'unknown' })
        }
      }
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

  // Every scan a signed-in user runs lands in their Repos Scored dashboard
  // automatically — no separate "Save Score" click required. Dedupes on
  // (user, repo, score) so an identical rescan doesn't create a redundant
  // history point; a changed score still gets its own row for the trend.
  const autoSaveScore = async (repoUrl: string, data: AnalyzeResponse) => {
    const score = data.repoScore
    if (!score) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const exists = await hasExistingSave(session.user.id, repoUrl, score.total)
    if (exists) return

    const { error } = await supabase.from('repo_scores').insert({
      user_id: session.user.id,
      repo_url: repoUrl,
      repo_name: repoUrl.replace('https://github.com/', ''),
      score: score.total,
      label: score.label,
      summary: score.summary,
      result: data,
    })

    if (error) {
      posthog.captureException(error)
      return
    }

    posthog.capture('repo_score_saved', { repo_url: repoUrl, score: score.total })
  }

  const submitUrl = async (url: string) => {
    const normalized = normalizeRepoUrl(url)
    setSubmittedUrl(normalized)
    setState({ status: 'loading' })
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
      writeScanCache(normalized, data as AnalyzeResponse)
      await autoSaveScore(normalized, data as AnalyzeResponse)
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

    const cached = readScanCache(normalized)
    if (cached) {
      setSubmittedUrl(normalized)
      setState({ status: 'results', data: cached })
      setHasScoredOnce(true)
      setUrlValue('')
      void autoSaveScore(normalized, cached)
      return
    }

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

  const handlePickRepo = (repoUrl: string) => {
    setUrlValue('')
    setValidationError('')
    void submitUrl(normalizeRepoUrl(repoUrl))
  }

  const handleGithubConnect = async () => {
    setGithubConnectLoading(true)
    posthog.capture('generate_github_connect_clicked')
    const next = submittedUrl
      ? `${window.location.pathname}?repo=${encodeURIComponent(submittedUrl)}`
      : `${window.location.pathname}${window.location.search}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: oauthRedirectTo(next) },
    })
    if (error) setGithubConnectLoading(false)
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
    <>
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
    {compact && !isAuthed && (
      <div className="mt-2 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={() => void handleGithubConnect()}
          disabled={githubConnectLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#242B3A] bg-[#161B22] px-4 py-2 text-sm font-semibold text-[#F5F3EA] transition hover:bg-[#1F2530] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          {githubConnectLoading ? 'Redirecting…' : 'Continue with GitHub'}
        </button>
      </div>
    )}
    </>
  )

  return (
    <main className="relative flex min-h-screen flex-col text-[#F5F3EA]">
      <GenerateBackground />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          redirectPath={
            submittedUrl
              ? `${window.location.pathname}?repo=${encodeURIComponent(submittedUrl)}`
              : undefined
          }
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
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col px-6 pb-16 sm:px-8 ${
          showCompactInput ? 'max-w-6xl lg:flex-row lg:items-start lg:gap-8' : 'max-w-5xl'
        } ${isIdle ? 'justify-center py-10 sm:py-14' : hasResults ? 'pt-4 sm:pt-6' : 'pt-10 sm:pt-14'}`}
      >
      <div className="min-w-0 flex-1">
        {/* Full idle/error input */}
        {showFullInput && (
          <section className="mb-8 anim-in" style={{ animationDelay: '80ms' }}>
            {!launchedFromQuery && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#F5F3EA] sm:text-3xl">
                  {githubUsername ? (
                    <>Pick a repo. <span className="text-[#7AA7FF]">Get your Repo Score.</span></>
                  ) : (
                    <>Paste your GitHub URL. <span className="text-[#7AA7FF]">Get your Repo Score.</span></>
                  )}
                </h1>
              </div>
            )}
            {isLoading && <LoadingLabel />}
            {(!launchedFromQuery || state.status === 'error') && (
              githubUsername ? (
                <GitHubRepoPicker username={githubUsername} onSelectRepo={handlePickRepo} />
              ) : isAuthed ? (
                repoInput(false)
              ) : (
                <div className="mx-auto w-full max-w-xl">
                  <div className="flex rounded-full border border-[#242B3A] bg-[#111827] p-1">
                    <button
                      type="button"
                      onClick={() => setEntryMode('url')}
                      className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                        entryMode === 'url' ? 'bg-[#F5F3EA] text-[#070A12]' : 'text-[#687386] hover:text-[#9AA3B5]'
                      }`}
                    >
                      Paste a link
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('github')}
                      className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                        entryMode === 'github' ? 'bg-[#F5F3EA] text-[#070A12]' : 'text-[#687386] hover:text-[#9AA3B5]'
                      }`}
                    >
                      Connect GitHub
                    </button>
                  </div>
                  <div className="mt-4">
                    {entryMode === 'url' ? (
                      repoInput(false)
                    ) : (
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => void handleGithubConnect()}
                          disabled={githubConnectLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#F5F3EA] px-7 py-3.5 text-sm font-semibold text-[#070A12] transition hover:bg-[#E7E2D7] disabled:cursor-wait disabled:opacity-60"
                        >
                          {githubConnectLoading ? 'Redirecting…' : 'Continue with GitHub'}
                        </button>
                        <p className="mt-3 text-xs text-[#687386]">We'll show your public repos so you can pick one to score.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </section>
        )}

        {/* Launched from query, still loading */}
        {launchedFromQuery && isLoading && !showFullInput && (
          <section className="mb-8 anim-in">
            <LoadingLabel />
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
          />
        </div>
      </div>

      {/* Keep scoring — always visible next to the results, not buried below them */}
      {showCompactInput && (
        <aside className="mt-6 w-full shrink-0 anim-in lg:sticky lg:top-20 lg:mt-0 lg:w-[300px]">
          {isAuthed && (
            <Link
              href="/profile"
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[#687386] transition hover:text-[#F5F3EA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
            </Link>
          )}

          {githubUsername ? (
            <GitHubRepoPicker
              username={githubUsername}
              onSelectRepo={handlePickRepo}
              excludeUrl={submittedUrl}
              title="Score another repo"
            />
          ) : (
            <div className="rounded-2xl border border-[#242B3A] bg-[#0D111C] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-sm font-semibold text-[#F5F3EA]">Score another repo</p>
              {repoInput(true)}
            </div>
          )}
        </aside>
      )}

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
