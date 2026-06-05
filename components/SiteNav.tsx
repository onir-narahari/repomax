import Wordmark from '@/components/Wordmark'
import ReposScoredBadge from '@/components/ReposScoredBadge'

interface SiteNavProps {
  scoredLabel: string | null
  variant?: 'landing' | 'generate'
  className?: string
}

export default function SiteNav({
  scoredLabel,
  variant = 'landing',
  className = '',
}: SiteNavProps) {
  return (
    <nav className={className}>
      <div className="flex items-center justify-between gap-4">
        <Wordmark
          variant={variant}
          className="text-xl font-bold tracking-tight text-[#F4F0E8] sm:text-2xl lg:text-[1.75rem]"
        />
        <ReposScoredBadge label={scoredLabel} />
      </div>
    </nav>
  )
}
