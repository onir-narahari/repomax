'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_HIGHLIGHT,
  DEFAULT_SCRIPT,
  DEFAULT_SLIDE1_IMAGE,
  DEFAULT_SLIDE_IMAGES,
} from '@/lib/tiktok/constants'
import { downloadAllSlides, downloadBlob, exportSlideToPng } from '@/lib/tiktok/export-slides'
import { parseSlideshowScript } from '@/lib/tiktok/parse-script'
import { SlideCover } from './SlideCover'
import { SlidePhotoCard } from './SlidePhotoCard'
import { SlidePreview } from './SlidePreview'

function cardFontSize(text: string): number {
  const len = text.length
  if (len < 80) return 64
  if (len < 140) return 56
  if (len < 220) return 48
  if (len < 360) return 42
  return 36
}

export default function SlideshowGenerator() {
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [imageUrl, setImageUrl] = useState(DEFAULT_SLIDE1_IMAGE)
  const [slideImages, setSlideImages] = useState<string[]>([...DEFAULT_SLIDE_IMAGES])
  const [highlightPhrase, setHighlightPhrase] = useState(DEFAULT_HIGHLIGHT)
  const [fontSize, setFontSize] = useState(72)
  const [textBottom, setTextBottom] = useState(14)
  const [textLeft, setTextLeft] = useState(7)
  const [underlineFirstLine, setUnderlineFirstLine] = useState(true)
  const [exporting, setExporting] = useState(false)

  const exportRefs = useRef<(HTMLDivElement | null)[]>([])

  const slides = useMemo(() => parseSlideshowScript(script), [script])

  const setExportRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      exportRefs.current[index] = el
    },
    [],
  )

  const handleImageUpload = (file: File | null) => {
    if (!file) return
    setImageUrl(URL.createObjectURL(file))
  }

  const handleSlideImageUpload = (slideIndex: number, file: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setSlideImages((prev) => {
      const next = [...prev]
      next[slideIndex] = url
      return next
    })
  }

  const exportOne = async (index: number) => {
    const el = exportRefs.current[index]
    if (!el) return
    setExporting(true)
    try {
      const blob = await exportSlideToPng(el)
      downloadBlob(blob, `slide${index + 1}.png`)
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setExporting(false)
    }
  }

  const exportAll = async () => {
    const elements = exportRefs.current.filter(Boolean) as HTMLElement[]
    if (elements.length !== 5) return
    setExporting(true)
    try {
      await downloadAllSlides(elements)
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setExporting(false)
    }
  }

  const slideProps = {
    cover: {
      imageUrl,
      text: slides[0],
      highlightPhrase,
      fontSize,
      textBottomPercent: textBottom,
      textLeftPercent: textLeft,
      underlineFirstLine,
    },
    cards: slides.slice(1).map((slideText, i) => ({
      key: i,
      imageUrl: slideImages[i] ?? DEFAULT_SLIDE_IMAGES[i],
      text: slideText,
      fontSize: cardFontSize(slideText),
    })),
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      {/* Full-size slides used for export — same components as preview */}
      <div aria-hidden className="pointer-events-none fixed left-[-9999px] top-0">
        <div ref={setExportRef(0)}>
          <SlideCover {...slideProps.cover} />
        </div>
        {slideProps.cards.map((props, i) => (
          <div key={props.key} ref={setExportRef(i + 1)}>
            <SlidePhotoCard imageUrl={props.imageUrl} text={props.text} fontSize={props.fontSize} />
          </div>
        ))}
      </div>

      <header className="border-b border-[#E8E4DC] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9A958C]">
              RepoMax
            </p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-tight md:text-3xl">
              TikTok Slideshow Generator
            </h1>
            <p className="mt-1 text-sm text-[#6B6560]">
              Preview your slides → download 1080×1920 PNGs
            </p>
          </div>
          <button
            type="button"
            onClick={exportAll}
            disabled={exporting}
            className="rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Download all slides'}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[380px_1fr]">
        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Slide 1 photo</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D4CC] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B6560] transition hover:border-[#B8B4AC]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
              />
              Upload background
            </label>
          </section>

          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Slides 2–5 photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_SLIDE_IMAGES.map((src, i) => (
                <label
                  key={i}
                  className="relative aspect-[9/16] cursor-pointer overflow-hidden rounded-lg border border-[#E8E4DC]"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSlideImageUpload(i, e.target.files?.[0] ?? null)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slideImages[i] ?? src}
                    alt={`Slide ${i + 2}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-[10px] font-medium text-white">
                    Slide {i + 2}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Slideshow script</h2>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={16}
              className="w-full resize-y rounded-xl border border-[#E8E4DC] bg-[#FAF9F6] p-3 font-mono text-xs leading-relaxed outline-none focus:border-[#111]"
              spellCheck={false}
            />
          </section>

          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Slide 1 styling</h2>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#6B6560]">
                Highlight phrase
                <input
                  type="text"
                  value={highlightPhrase}
                  onChange={(e) => setHighlightPhrase(e.target.value)}
                  className="rounded-lg border border-[#E8E4DC] bg-[#FAF9F6] px-3 py-2 text-sm text-[#111] outline-none focus:border-[#111]"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#6B6560]">
                Text size — {fontSize}px
                <input
                  type="range"
                  min={48}
                  max={96}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#6B6560]">
                Vertical position — {textBottom}%
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={textBottom}
                  onChange={(e) => setTextBottom(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-[#6B6560]">
                Horizontal position — {textLeft}%
                <input
                  type="range"
                  min={4}
                  max={16}
                  value={textLeft}
                  onChange={(e) => setTextLeft(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={underlineFirstLine}
                  onChange={(e) => setUnderlineFirstLine(e.target.checked)}
                />
                Underline first line
              </label>
            </div>
          </section>
        </aside>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#9A958C]">
            Previews
          </h2>
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
            <SlidePreview
              label="Slide 1 — Cover"
              onDownload={() => exportOne(0)}
              downloading={exporting}
            >
              <SlideCover {...slideProps.cover} />
            </SlidePreview>
            {slideProps.cards.map((props, i) => (
              <SlidePreview
                key={props.key}
                label={`Slide ${i + 2}`}
                onDownload={() => exportOne(i + 1)}
                downloading={exporting}
              >
                <SlidePhotoCard
                  imageUrl={props.imageUrl}
                  text={props.text}
                  fontSize={props.fontSize}
                />
              </SlidePreview>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
