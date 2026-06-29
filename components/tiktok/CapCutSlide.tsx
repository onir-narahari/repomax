import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import { CoverSlideText } from './HighlightedText'

type CapCutSlideProps = {
  imageUrl: string
  text: string
  highlightPhrase?: string
  fontSize?: number
  textTopPercent?: number
  textLeftPercent?: number
  underlineFirstLine?: boolean
}

/** CapCut-style cover: photo + gradient + centered white text, freely positionable. */
export function CapCutSlide({
  imageUrl,
  text,
  highlightPhrase,
  fontSize = 72,
  textTopPercent = 50,
  textLeftPercent = 50,
  underlineFirstLine = false,
}: CapCutSlideProps) {
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
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        className="absolute"
        style={{
          top: `${textTopPercent}%`,
          left: `${textLeftPercent}%`,
          transform: 'translate(-50%, -50%)',
          width: '86%',
          textAlign: 'center',
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
