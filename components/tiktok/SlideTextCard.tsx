import { forwardRef } from 'react'
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import { HighlightedText } from './HighlightedText'

type SlideTextCardProps = {
  text: string
}

export const SlideTextCard = forwardRef<HTMLDivElement, SlideTextCardProps>(
  function SlideTextCard({ text }, ref) {
    return (
      <div
        ref={ref}
        className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden bg-[#F4F2EC] px-16"
        style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
      >
        <div className="flex w-full max-w-[900px] flex-1 flex-col items-center justify-center pb-24 pt-16 text-center">
          <HighlightedText
            text={text}
            useMarkers
            className="font-bold leading-[1.15] tracking-[-0.02em] text-[#111111] whitespace-pre-wrap"
            // Scale via parent font-size for export consistency
          />
        </div>
        <p className="absolute bottom-14 text-[28px] font-semibold tracking-[0.2em] text-[#9A958C] uppercase">
          RepoMax
        </p>
      </div>
    )
  },
)
