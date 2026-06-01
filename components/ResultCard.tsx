'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  title: string
  helperText?: string
  badge?: string
  content: string | string[]
  charLimit?: number
}

export default function ResultCard({ title, helperText, badge, content, charLimit }: Props) {
  const [copied, setCopied] = useState(false)

  const textToCopy = Array.isArray(content)
    ? content.map((b) => `• ${b}`).join('\n')
    : content

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  const charCount = typeof content === 'string' ? content.length : null
  const overLimit = charLimit !== undefined && charCount !== null && charCount > charLimit

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F4F0E8]/8 bg-[#F4F0E8]/[0.03]">
      {/* Amber left accent */}
      <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500/40" />

      {/* Card header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#F4F0E8]/8 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#F4F0E8]">{title}</h3>
            {badge && (
              <span className="rounded-full border border-[#F4F0E8]/15 px-2 py-0.5 text-[11px] text-[#F4F0E8]/40">
                {badge}
              </span>
            )}
          </div>
          {helperText && (
            <p className="mt-0.5 text-xs text-[#F4F0E8]/35">{helperText}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {charLimit !== undefined && charCount !== null && (
            <span className={`text-xs tabular-nums ${overLimit ? 'text-red-400' : 'text-[#F4F0E8]/35'}`}>
              {charCount}/{charLimit}
            </span>
          )}
          <button
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : `Copy ${title}`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              copied
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-[#F4F0E8]/40 hover:bg-[#F4F0E8]/10 hover:text-[#F4F0E8]'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className="px-5 py-4">
        {Array.isArray(content) ? (
          <ul className="space-y-3">
            {content.map((bullet, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#F4F0E8]/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {bullet}
              </li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F4F0E8]/75">{content}</p>
        )}
      </div>
    </div>
  )
}
