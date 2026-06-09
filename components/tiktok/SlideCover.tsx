import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import { CoverSlideText } from './HighlightedText'

type SlideCoverProps = {
  imageUrl: string
  text: string
  highlightPhrase?: string
  fontSize: number
  textBottomPercent: number
  textLeftPercent: number
  underlineFirstLine: boolean
}

export function SlideCover({
  imageUrl,
  text,
  highlightPhrase,
  fontSize,
  textBottomPercent,
  textLeftPercent,
  underlineFirstLine,
}: SlideCoverProps) {
  return (
    <div
      className="relative overflow-hidden shrink-0"
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
            'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.12) 62%, transparent 100%)',
        }}
      />
      <div
        className="absolute max-w-[88%]"
        style={{
          left: `${textLeftPercent}%`,
          bottom: `${textBottomPercent}%`,
        }}
      >
        <CoverSlideText
          text={text}
          highlightPhrase={highlightPhrase}
          underlineFirstLine={underlineFirstLine}
          fontSize={fontSize}
        />
      </div>
    </div>
  )
}
