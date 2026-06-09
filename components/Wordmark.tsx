interface WordmarkProps {
  className?: string
  variant?: 'landing' | 'generate'
}

export default function Wordmark({ className = '', variant = 'landing' }: WordmarkProps) {
  const maxClass =
    variant === 'generate'
      ? 'font-display italic text-[#A78BFA]'
      : 'bg-gradient-to-r from-[#A78BFA] to-[#C4B5FD] bg-clip-text font-display italic text-transparent'

  return (
    <span className={className}>
      Repo
      <span className={maxClass}>Max</span>
    </span>
  )
}
