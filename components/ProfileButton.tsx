'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { ChevronDown } from 'lucide-react'

export default function ProfileButton() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAuthSuccess = () => {
    setShowAuth(false)
    router.push('/profile')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
  }

  const username =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'user'

  const initial = username[0].toUpperCase()

  if (!authReady) {
    return (
      <div
        className="h-9 w-[132px] animate-pulse rounded-full border border-[#1E2A3D] bg-[#0D111C]"
        aria-hidden="true"
      />
    )
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => { setAuthMode('signin'); setShowAuth(true) }}
          className="flex items-center gap-2 rounded-full border border-[#2E3A52] bg-[#131929] px-4 py-2 text-sm font-medium text-[#C8D3E8] transition hover:border-[#4B5A75] hover:bg-[#1A2438] hover:text-white focus:outline-none"
        >
          Sign in / Sign up
        </button>

        {showAuth && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
            redirectPath="/profile"
          />
        )}
      </>
    )
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full border border-[#1E2A3D] bg-[#0D111C] py-1.5 pl-1.5 pr-3 text-sm font-medium text-[#C8D3E8] transition hover:border-[#2E3A52] hover:text-white focus:outline-none"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-xs font-bold text-black">
            {initial}
          </span>
          <span className="max-w-[120px] truncate text-[#F5F3EA]">{username}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#687386] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#0D111C] shadow-2xl shadow-black/60">
            <div className="border-b border-[#1E2A3D] px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-sm font-bold text-black">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#F5F3EA]">{username}</p>
                  <p className="truncate text-xs text-[#687386]">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="p-1.5">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#9AA3B5] transition hover:bg-[#111827] hover:text-[#F5F3EA]"
              >
                My Scores
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#9AA3B5] transition hover:bg-[#111827] hover:text-[#F5F3EA]"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
