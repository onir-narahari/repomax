interface ScoreRingProps {
  score: number
  total?: number
  scoreClassName: string
  ringClassName: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreRing({
  score,
  total = 100,
  scoreClassName,
  ringClassName,
  size = 'md',
}: ScoreRingProps) {
  const r = size === 'sm' ? 32 : size === 'md' ? 38 : 44
  const view = size === 'sm' ? 76 : size === 'md' ? 88 : 100
  const cx = view / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, score / total)
  const offset = circumference * (1 - pct)
  const dim =
    size === 'sm' ? 'h-[4.25rem] w-[4.25rem]' : size === 'md' ? 'h-[5.5rem] w-[5.5rem]' : 'h-[6.25rem] w-[6.25rem]'
  const numSize = size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-4xl'
  const stroke = size === 'lg' ? 5 : size === 'md' ? 5 : 4

  return (
    <div className={`relative flex ${dim} shrink-0 items-center justify-center`}>
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${view} ${view}`}
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={size === 'sm' ? 4 : stroke}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'sm' ? 4 : stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={ringClassName}
        />
      </svg>
      <div className="flex items-baseline leading-none">
        <span className={`${numSize} font-bold tabular-nums ${scoreClassName}`}>{score}</span>
      </div>
    </div>
  )
}
