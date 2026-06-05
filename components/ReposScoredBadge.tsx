interface ReposScoredBadgeProps {
  label: string | null
  className?: string
}

export default function ReposScoredBadge({ label, className = '' }: ReposScoredBadgeProps) {
  if (!label) return null

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium tabular-nums text-white/55 sm:text-xs ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/90" />
      </span>
      {label}
    </span>
  )
}
