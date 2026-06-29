import { HIGHLIGHT_COLOR } from '@/lib/tiktok/constants'
import { applyPhraseHighlight, parseHighlightMarkers } from '@/lib/tiktok/parse-script'

type HighlightedTextProps = {
  text: string
  className?: string
  /** Card slides: parse **markers** */
  useMarkers?: boolean
  /** Cover slide: highlight a chosen phrase once */
  highlightPhrase?: string
}

export function HighlightedText({
  text,
  className = '',
  useMarkers = false,
  highlightPhrase,
}: HighlightedTextProps) {
  if (useMarkers) {
    return (
      <span className={className}>
        {text.split('\n').map((line, lineIdx) => (
          <span key={lineIdx} className={lineIdx > 0 ? 'block mt-[0.35em]' : 'block'}>
            {parseHighlightMarkers(line).map((seg, i) =>
              seg.highlight ? (
                <span key={i} style={{ color: HIGHLIGHT_COLOR }}>
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </span>
        ))}
      </span>
    )
  }

  if (highlightPhrase?.trim()) {
    const parts = applyPhraseHighlight(text, highlightPhrase)
    if (parts) {
      return (
        <span className={className}>
          {parts.before}
          <span style={{ color: HIGHLIGHT_COLOR }}>{parts.highlight}</span>
          {parts.after}
        </span>
      )
    }
  }

  return <span className={className}>{text}</span>
}

type CoverTextProps = {
  text: string
  highlightPhrase?: string
  underlineFirstLine: boolean
  fontSize: number
}

export function CoverSlideText({
  text,
  highlightPhrase,
  underlineFirstLine,
  fontSize,
}: CoverTextProps) {
  const lines = text.split('\n')

  return (
    <div className="flex flex-col items-center gap-[0.2em] text-center" style={{ fontSize }}>
      {lines.map((line, i) => {
        if (!line.trim()) {
          return <div key={i} className="h-[0.35em]" aria-hidden />
        }

        const content = (
          <HighlightedText
            text={line}
            highlightPhrase={highlightPhrase}
            useMarkers={!highlightPhrase?.trim()}
          />
        )
        const isFirst = i === 0

        return (
          <p
            key={i}
            className="m-0 font-bold leading-[1.08] tracking-[-0.02em] text-white"
            style={{
              textShadow: '0 2px 16px rgba(0,0,0,0.75)',
              ...(underlineFirstLine && isFirst
                ? {
                    textDecoration: 'underline',
                    textDecorationThickness: '0.08em',
                    textUnderlineOffset: '0.12em',
                  }
                : undefined),
            }}
          >
            {content}
          </p>
        )
      })}
    </div>
  )
}
