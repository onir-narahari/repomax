import { PREVIEW_SCALE, SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import type { ReactNode } from 'react'

type SlidePreviewProps = {
  label: string
  children: ReactNode
  onDownload?: () => void
  downloading?: boolean
}

export function SlidePreview({ label, children, onDownload, downloading }: SlidePreviewProps) {
  const w = SLIDE_WIDTH * PREVIEW_SCALE
  const h = SLIDE_HEIGHT * PREVIEW_SCALE

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[#8A857C]">
          {label}
        </span>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="text-xs font-medium text-[#1a1a1a] underline-offset-2 hover:underline disabled:opacity-50"
          >
            PNG
          </button>
        )}
      </div>
      <div
        className="overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#ECEAE4] shadow-sm"
        style={{ width: w, height: h }}
      >
        <div
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
