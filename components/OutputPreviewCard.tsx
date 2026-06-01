import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  icon: LucideIcon
  delay: string
  className?: string
  children: React.ReactNode
}

export default function OutputPreviewCard({
  title,
  icon: Icon,
  delay,
  className = '',
  children,
}: Props) {
  return (
    <div
      className={`demo-output-card rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] sm:rounded-2xl sm:p-4 ${className}`}
      style={{
        animationDelay: delay,
        boxShadow: '0 0 32px rgba(59,130,246,0.05)',
      }}
    >
      <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
        <Icon className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80 sm:text-[11px]">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}
