'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { LANGUAGE_COLORS, fmtUpdated } from '@/components/GitHubRepoPicker'
import type { GitHubUserRepo } from '@/types'

// One-time onboarding confirm step (issue #15, docs/prd-job-matching.md §7,
// §9, §14). Two entry modes:
//  - 'onboarding': first-time setup. Fetches the auto-picked default repo
//    set from GET /api/jobs/candidate-repos, pre-checks it, and immediately
//    fires POST /api/jobs/profile with that default set in the background
//    to hide the "analyzing" latency behind the checkbox UI (§9). The
//    Confirm button doesn't wait on that background call — only the final
//    click does, and only if it needs to.
//  - 'edit': re-entry from the "Edit my projects" affordance. Pre-checks the
//    user's actual committed set (passed in via `initialRepoNames`, already
//    fetched by the parent from GET /api/jobs/profile). No background call
//    is kicked off — this is a deliberate revisit, not a latency-hiding
//    first visit, so the POST only fires on explicit Confirm.
//
// In both modes, Confirm posts the final checked selection to
// POST /api/jobs/profile and calls onComplete once that succeeds.

interface Props {
  mode: 'onboarding' | 'edit'
  githubRepos: GitHubUserRepo[]
  initialRepoNames: string[]
  onComplete: (repoNames: string[]) => void
  onCancel?: () => void
}

type BuildStatus = 'idle' | 'pending' | 'done' | 'error'

function sameSelection(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((n) => setB.has(n))
}

async function postProfile(repoNames: string[]) {
  return fetch('/api/jobs/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoNames }),
  })
}

export default function JobsOnboardingConfirm({ mode, githubRepos, initialRepoNames, onComplete, onCancel }: Props) {
  const [defaultNames, setDefaultNames] = useState<string[] | null>(mode === 'edit' ? initialRepoNames : null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(mode === 'edit' ? initialRepoNames : []))
  const [candidateError, setCandidateError] = useState('')
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const buildPromiseRef = useRef<Promise<Response> | null>(null)

  useEffect(() => {
    if (mode !== 'onboarding') return
    let cancelled = false

    fetch('/api/jobs/candidate-repos')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        const names = (data.repoNames as string[]) ?? []
        setDefaultNames(names)
        setSelected(new Set(names))

        // Kick off the real profile build now, in the background — this is
        // what hides the "analyzing" latency (§9). The user can keep
        // adjusting checkboxes while this runs.
        setBuildStatus('pending')
        const promise = postProfile(names)
        buildPromiseRef.current = promise
        promise
          .then((res) => { if (!cancelled) setBuildStatus(res.ok ? 'done' : 'error') })
          .catch(() => { if (!cancelled) setBuildStatus('error') })
      })
      .catch(() => {
        if (!cancelled) setCandidateError('Could not load a suggested starting set — pick your repos below.')
      })

    return () => { cancelled = true }
  }, [mode])

  const toggleRepo = useCallback((name: string) => {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    setSubmitError('')
    setSubmitting(true)
    const finalNames = Array.from(selected)
    try {
      let res: Response
      if (mode === 'onboarding' && defaultNames && buildPromiseRef.current && sameSelection(finalNames, defaultNames)) {
        // Selection matches what's already building (or built) — just wait
        // on that in-flight request instead of firing a duplicate one.
        res = await buildPromiseRef.current
      } else {
        // Either this is an edit, or the user changed the selection —
        // repos already committed from the in-flight/completed build are
        // diffed server-side and aren't rebuilt, so this stays cheap.
        res = await postProfile(finalNames)
      }
      if (!res.ok) throw new Error()
      onComplete(finalNames)
    } catch {
      setSubmitError('Could not save your projects — try again.')
    } finally {
      setSubmitting(false)
    }
  }, [selected, defaultNames, mode, onComplete])

  const loadingDefaults = mode === 'onboarding' && defaultNames === null && !candidateError
  const nothingToPrune = defaultNames !== null && githubRepos.length > 0 && defaultNames.length === githubRepos.length

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#F5F3EA]">
          {mode === 'edit' ? 'Edit your projects' : 'Confirm your projects'}
        </h2>
        <p className="mt-1 text-sm text-[#687386]">
          {mode === 'edit'
            ? 'Update which repos we match jobs against.'
            : nothingToPrune
              ? 'These are your usable public repos — confirm they represent you.'
              : 'We picked repos that show your range. Uncheck any that don’t fit, or add others below.'}
        </p>
      </div>

      {candidateError && <p className="mb-4 text-sm text-red-400">{candidateError}</p>}

      {loadingDefaults ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl border border-[#1E2A3D] bg-[#090D16]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {githubRepos.map((repo) => {
            const checked = selected.has(repo.name)
            const suggested = mode === 'onboarding' && (defaultNames?.includes(repo.name) ?? false)
            return (
              <button
                key={repo.name}
                type="button"
                onClick={() => toggleRepo(repo.name)}
                aria-pressed={checked}
                className={`group relative flex w-full flex-col rounded-xl border p-5 text-left transition ${
                  checked ? 'border-[#22C55E]/45 bg-[#0F1420]' : 'border-[#1E2A3D] bg-[#0D111C] hover:border-[#334155] hover:bg-[#0F1420]'
                }`}
              >
                <span
                  className={`absolute right-4 top-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    checked ? 'border-[#22C55E] bg-[#22C55E]/20' : 'border-[#334155]'
                  }`}
                >
                  {checked && <Check className="h-3 w-3 text-[#22C55E]" strokeWidth={3} />}
                </span>
                <p className="truncate pr-8 font-mono text-sm font-medium text-[#F5F3EA]">{repo.name}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-[#687386]">
                  {repo.language && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${LANGUAGE_COLORS[repo.language] ?? 'bg-[#687386]'}`} />
                  )}
                  <span className="truncate">{repo.language ? `${repo.language} · ` : ''}updated {fmtUpdated(repo.updatedAt)}</span>
                </p>
                {suggested && (
                  <span className="mt-5 inline-flex w-fit items-center gap-1 rounded-lg border border-[#7AA7FF]/25 bg-[#7AA7FF]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7AA7FF]">
                    Suggested
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {submitError && <p className="mt-4 text-sm text-red-400">{submitError}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-[#3D4A60]">
          <span>{selected.size} selected</span>
          {mode === 'onboarding' && buildStatus === 'pending' && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-[#7AA7FF]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7AA7FF]" />
              Analyzing your projects…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'edit' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-[#1E2A3D] px-4 py-2 text-sm font-medium text-[#9AA3B5] transition hover:border-[#334155] hover:text-[#F5F3EA]"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loadingDefaults || submitting}
            className="rounded-lg bg-[#F5F3EA] px-5 py-2 text-sm font-semibold text-[#070A12] transition hover:bg-white disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
