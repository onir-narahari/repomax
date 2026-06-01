interface WordmarkProps {
  className?: string
  variant?: 'landing' | 'generate'
}

export default function Wordmark({ className = '', variant = 'landing' }: WordmarkProps) {
  const hireClass =
    variant === 'generate'
      ? 'font-display italic text-[#7AA7FF]'
      : 'bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text font-display italic text-transparent'

  return (
    <span className={className}>
      ShipTo
      <span className={hireClass}>Hire</span>
    </span>
  )
}
