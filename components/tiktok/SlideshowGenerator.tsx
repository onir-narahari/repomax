'use client'

import { useRef, useState } from 'react'
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/tiktok/constants'
import { buildDefaultSlides, DEFAULT_STORYBOARD } from '@/lib/tiktok/default-slides'
import { downloadAllSlides, downloadBlob, exportSlideToPng } from '@/lib/tiktok/export-slides'
import { parseStoryboard } from '@/lib/tiktok/parse-script'
import { SlideCover } from './SlideCover'
import { SlidePhotoCard } from './SlidePhotoCard'

const PREVIEW_SCALE = 0.16

type Slide = {
  id: number
  text: string
  imageUrl: string
  textTop: number   // 2–95 — vertical center %
  textLeft: number  // 5–95 — horizontal center %
  fontSize: number
  highlightPhrase: string
  underlineFirstLine: boolean
}

let _id = 1
function newSlide(index: number, text = ''): Slide {
  return {
    id: _id++,
    text,
    imageUrl: '',
    textTop: 50,
    textLeft: 50,
    fontSize: index === 0 ? 72 : 44,
    highlightPhrase: '',
    underlineFirstLine: false,
  }
}

const INITIAL_SLIDES = buildDefaultSlides()

async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.set('file', file)
  try {
    const res = await fetch('/api/tiktok/upload', { method: 'POST', body: form })
    if (res.ok) {
      const { url } = (await res.json()) as { url: string }
      return url
    }
  } catch {}
  return URL.createObjectURL(file)
}

function SlideContent({
  slide,
  index,
}: {
  slide: Slide
  index: number
}) {
  if (index === 0) {
    return (
      <SlideCover
        imageUrl={slide.imageUrl}
        text={slide.text}
        highlightPhrase={slide.highlightPhrase}
        fontSize={slide.fontSize}
        textTopPercent={slide.textTop}
        textLeftPercent={slide.textLeft}
        underlineFirstLine={slide.underlineFirstLine}
      />
    )
  }
  return (
    <SlidePhotoCard
      imageUrl={slide.imageUrl}
      text={slide.text}
      fontSize={slide.fontSize}
      textTopPercent={slide.textTop}
      textLeftPercent={slide.textLeft}
    />
  )
}

export default function SlideshowGenerator() {
  const [slides, setSlides] = useState<Slide[]>(INITIAL_SLIDES)
  const [storyboard, setStoryboard] = useState(DEFAULT_STORYBOARD)
  const [exporting, setExporting] = useState(false)

  const exportRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  function getExportRef(id: number) {
    return (el: HTMLDivElement | null) => {
      if (el) exportRefs.current.set(id, el)
      else exportRefs.current.delete(id)
    }
  }

  function update(id: number, patch: Partial<Omit<Slide, 'id'>>) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  async function handlePhotoUpload(id: number, file: File) {
    const url = await uploadFile(file)
    update(id, { imageUrl: url })
  }

  function applyStoryboard() {
    const texts = parseStoryboard(storyboard)
    if (!texts.length) return
    setSlides((prev) => {
      const count = Math.max(prev.length, texts.length)
      return Array.from({ length: count }, (_, i) => {
        const existing = prev[i] ?? newSlide(i)
        return texts[i] !== undefined ? { ...existing, text: texts[i] } : existing
      })
    })
  }

  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>, id: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    update(id, {
      textLeft: Math.max(5, Math.min(95, x)),
      textTop: Math.max(2, Math.min(95, y)),
    })
  }

  async function handleExportAll() {
    const els = slides
      .map((s) => exportRefs.current.get(s.id))
      .filter(Boolean) as HTMLElement[]
    setExporting(true)
    try {
      await downloadAllSlides(els)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportOne(id: number, index: number) {
    const el = exportRefs.current.get(id)
    if (!el) return
    setExporting(true)
    try {
      const blob = await exportSlideToPng(el)
      downloadBlob(blob, `slide${index + 1}.png`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const previewW = Math.round(SLIDE_WIDTH * PREVIEW_SCALE)
  const previewH = Math.round(SLIDE_HEIGHT * PREVIEW_SCALE)

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* Hidden full-res export targets */}
      <div aria-hidden className="pointer-events-none fixed left-[-9999px] top-0">
        {slides.map((slide, i) => (
          <div key={slide.id} ref={getExportRef(slide.id)}>
            <SlideContent slide={slide} index={i} />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#1a1a1a] border-b border-[#222]">
        <h1 className="text-sm font-bold">TikTok Slideshow</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setStoryboard(DEFAULT_STORYBOARD)
              setSlides(buildDefaultSlides())
            }}
            className="text-xs text-[#666] hover:text-white transition-colors"
          >
            Reset template
          </button>
          <button
            type="button"
            onClick={handleExportAll}
            disabled={exporting}
            className="rounded-lg px-5 py-2 text-sm font-semibold bg-white text-[#111] hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export All'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Storyboard paste */}
        <div className="rounded-xl bg-[#1a1a1a] border border-[#222] p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#555]">
            Paste storyboard — auto-fills all text fields
          </p>
          <p className="text-xs text-[#666] leading-relaxed">
            Photos upload via <code className="text-[#888]">/api/tiktok/upload</code>. Click the preview to place text, then Export All.
          </p>
          <textarea
            value={storyboard}
            onChange={(e) => setStoryboard(e.target.value)}
            rows={5}
            placeholder={'Slide 1:\nyour text here\n\nSlide 2:\nyour text here'}
            className="w-full resize-none rounded-lg bg-[#222] border border-[#2a2a2a] p-3 text-sm font-mono text-white outline-none focus:border-[#444] placeholder:text-[#333]"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={applyStoryboard}
            disabled={!storyboard.trim()}
            className="self-start rounded-lg px-4 py-2 text-xs font-semibold bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors disabled:opacity-30"
          >
            Apply to slides
          </button>
        </div>

        {/* Slide cards */}
        {slides.map((slide, i) => (
          <div key={slide.id} className="rounded-xl bg-[#1a1a1a] border border-[#222] overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                Slide {i + 1}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExportOne(slide.id, i)}
                  disabled={exporting}
                  className="text-[11px] text-[#555] hover:text-white transition-colors disabled:opacity-30"
                >
                  Export PNG
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSlides((p) => p.filter((s) => s.id !== slide.id))}
                    className="text-[11px] text-[#555] hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Photo + text row */}
            <div className="flex gap-4 p-4">

              {/* Preview — click anywhere to place text */}
              <div className="shrink-0 flex flex-col gap-1.5">
                <div
                  className="relative overflow-hidden rounded-xl border border-[#2a2a2a]"
                  style={{ width: previewW, height: previewH, cursor: 'crosshair' }}
                  onClick={(e) => handlePreviewClick(e, slide.id)}
                >
                  {slide.imageUrl ? (
                    <div
                      style={{
                        width: SLIDE_WIDTH,
                        height: SLIDE_HEIGHT,
                        transform: `scale(${PREVIEW_SCALE})`,
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                      }}
                    >
                      <SlideContent slide={slide} index={i} />
                    </div>
                  ) : (
                    <label className="h-full flex flex-col items-center justify-center gap-2 text-[#333] cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(slide.id, file)
                        }}
                      />
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                      <span className="text-[11px] text-center leading-snug">Upload<br />photo</span>
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-[#444] text-center">
                  {slide.imageUrl ? 'Click to place text' : ''}
                </p>
                {/* Photo swap when image is already set */}
                {slide.imageUrl && (
                  <label className="cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(slide.id, file)
                      }}
                    />
                    <span className="text-[10px] text-[#444] hover:text-white transition-colors">
                      Change photo
                    </span>
                  </label>
                )}
              </div>

              {/* Text + controls */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <textarea
                  value={slide.text}
                  onChange={(e) => update(slide.id, { text: e.target.value })}
                  rows={5}
                  placeholder="Type slide text…"
                  className="w-full resize-none rounded-xl bg-[#222] border border-[#2a2a2a] p-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-[#444] placeholder:text-[#333]"
                  spellCheck={false}
                />

                {/* Position sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-[11px] text-[#555]">
                    ↕ Vertical {slide.textTop}%
                    <input
                      type="range"
                      min={2}
                      max={95}
                      value={slide.textTop}
                      onChange={(e) => update(slide.id, { textTop: Number(e.target.value) })}
                      className="accent-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] text-[#555]">
                    ↔ Horizontal {slide.textLeft}%
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={slide.textLeft}
                      onChange={(e) => update(slide.id, { textLeft: Number(e.target.value) })}
                      className="accent-white"
                    />
                  </label>
                </div>

                {/* Font size */}
                <label className="flex flex-col gap-1 text-[11px] text-[#555]">
                  Font {slide.fontSize}px
                  <input
                    type="range"
                    min={i === 0 ? 48 : 24}
                    max={i === 0 ? 96 : 72}
                    value={slide.fontSize}
                    onChange={(e) => update(slide.id, { fontSize: Number(e.target.value) })}
                    className="accent-white"
                  />
                </label>

                {/* Cover extras — hidden by default; plain white text only */}
                {i === 0 && (slide.highlightPhrase || slide.underlineFirstLine) && (
                  <div className="flex flex-col gap-2 pt-1">
                    <input
                      type="text"
                      value={slide.highlightPhrase}
                      onChange={(e) => update(slide.id, { highlightPhrase: e.target.value })}
                      placeholder="Highlight phrase (optional)"
                      className="w-full rounded-lg bg-[#222] border border-[#2a2a2a] px-3 py-1.5 text-xs text-white outline-none focus:border-[#444] placeholder:text-[#333]"
                    />
                    <label className="flex items-center gap-2 text-[11px] text-[#555] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slide.underlineFirstLine}
                        onChange={(e) => update(slide.id, { underlineFirstLine: e.target.checked })}
                        className="accent-white"
                      />
                      Underline first line
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add slide */}
        <button
          type="button"
          onClick={() => setSlides((p) => [...p, newSlide(p.length)])}
          className="rounded-xl border-2 border-dashed border-[#222] hover:border-[#444] py-4 text-sm text-[#444] hover:text-white transition-all"
        >
          + Add slide
        </button>
      </div>
    </div>
  )
}
