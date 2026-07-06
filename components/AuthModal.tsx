'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

interface Props {
  initialMode?: Mode
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ initialMode = 'signup', onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        onSuccess()
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onSuccess()
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (!mounted) return null

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/75 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-[#1E2A3D] bg-[#0D111C] shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2A3D] px-6 py-4">
          <p className="text-base font-semibold text-[#F5F3EA]">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1E2A3D] text-[#687386] transition hover:border-[#334155] hover:text-[#9AA3B5]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2A3D]">
          {(['signup', 'signin'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === m
                  ? 'border-b-2 border-[#F5F3EA] text-[#F5F3EA]'
                  : 'text-[#687386] hover:text-[#9AA3B5]'
              }`}
              style={{ marginBottom: mode === m ? '-1px' : undefined }}
            >
              {m === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          {process.env.NODE_ENV !== 'production' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#DADCE0] bg-white px-4 py-2.5 text-sm font-medium text-[#3C4043] transition hover:bg-[#F8F8F8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" />
                </svg>
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#1E2A3D]" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#3D4A60]">or</span>
                <div className="h-px flex-1 bg-[#1E2A3D]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9AA3B5]">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-[#242B3A] bg-[#090D16] px-4 py-2.5 text-sm text-[#F5F3EA] placeholder:text-[#3D4A60] transition focus:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#9AA3B5]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full rounded-xl border border-[#242B3A] bg-[#090D16] px-4 py-2.5 text-sm text-[#F5F3EA] placeholder:text-[#3D4A60] transition focus:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/15"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-[#F5F3EA] px-4 py-2.5 text-sm font-semibold text-[#070A12] transition hover:bg-[#E7E2D7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
