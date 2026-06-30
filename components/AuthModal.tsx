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
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
    setUsername('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) setError(error.message)
      else onSuccess()
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onSuccess()
    }

    setLoading(false)
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
          <div>
            <p className="text-base font-semibold text-[#F5F3EA]">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </p>
            <p className="mt-0.5 text-xs text-[#687386]">
              {mode === 'signup'
                ? 'Score and track your repos for free.'
                : 'Sign in to continue scoring repos.'}
            </p>
          </div>
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#9AA3B5]">Username</label>
                <input
                  type="text"
                  placeholder="your-handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#242B3A] bg-[#090D16] px-4 py-2.5 text-sm text-[#F5F3EA] placeholder:text-[#3D4A60] transition focus:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/15"
                />
              </div>
            )}

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
