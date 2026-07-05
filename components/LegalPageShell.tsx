import Link from 'next/link'
import Wordmark from '@/components/Wordmark'

interface Props {
  title: string
  updated: string
  children: React.ReactNode
}

export default function LegalPageShell({ title, updated, children }: Props) {
  return (
    <main className="min-h-dvh bg-[#131929] text-[#F8FAFC]">
      <nav className="border-b border-white/[0.06] bg-[#131929]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Wordmark className="text-lg font-bold tracking-tight sm:text-xl" />
          </Link>
          <Link href="/" className="text-xs font-medium text-[#8B9CC4] transition-colors hover:text-[#F8FAFC]">
            Back to home
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
        <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-xs font-mono uppercase tracking-[0.1em] text-[#8B9CC4]">
          Last updated {updated}
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-[#B8C4DC]">
          {children}
        </div>
      </article>

      <footer className="border-t border-[#2f3a52] bg-[#0c101a] px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-xs text-[#8B9CC4]">© {new Date().getFullYear()} RepoMax</span>
          <div className="flex items-center gap-4 text-xs text-[#8B9CC4]">
            <Link href="/privacy" className="transition-colors hover:text-[#F8FAFC]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#F8FAFC]">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
