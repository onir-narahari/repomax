import { useMemo } from 'react'
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import { HighlightedText } from './HighlightedText'

type SlidePhotoCardProps = {
  imageUrl: string
  text: string
  fontSize?: number
}

function splitLabelBody(text: string): { label: string; body: string } {
  const lines = text.split('\n')
  const firstIdx = lines.findIndex((l) => l.trim())
  if (firstIdx === -1) return { label: '', body: '' }
  const label = lines[firstIdx].trim()
  const body = lines
    .slice(firstIdx + 1)
    .join('\n')
    .trim()
  return { label, body }
}

export function SlidePhotoCard({ imageUrl, text, fontSize = 40 }: SlidePhotoCardProps) {
    const { label, body } = useMemo(() => splitLabelBody(text), [text])

    return (
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        <div className="absolute left-0 right-0 top-[10%] flex flex-col items-center gap-5 px-10">
          {label && (
            <div
              className="rounded-[28px] px-8 py-5 text-center"
              style={{
                maxWidth: '92%',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
            >
              <p
                className="m-0 font-bold leading-tight tracking-[-0.02em] text-[#111]"
                style={{ fontSize: Math.round(fontSize * 1.15) }}
              >
                <HighlightedText text={label} useMarkers />
              </p>
            </div>
          )}
          {body && (
            <div
              className="rounded-[28px] px-8 py-7 text-left"
              style={{
                maxWidth: '88%',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
            >
              <div
                className="font-bold leading-[1.2] tracking-[-0.01em] text-[#111] whitespace-pre-wrap"
                style={{ fontSize }}
              >
                <HighlightedText text={body} useMarkers />
              </div>
            </div>
          )}
        </div>

        <p
          className="absolute bottom-10 left-0 right-0 text-center text-[24px] font-semibold uppercase"
          style={{
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 2px 8px rgba(0,0,0,0.45)',
          }}
        >
          RepoMax
        </p>
      </div>
    )
}
