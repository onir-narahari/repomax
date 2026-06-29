const SLIDE_BLOCK_RE = /Slide\s*(\d)\s*:\s*\n([\s\S]*?)(?=Slide\s*\d\s*:|$)/gi

/** Parse a full storyboard paste (Topic: ... Slide 1: ... Slide 2: ...) into per-slide text blocks. */
export function parseStoryboard(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []

  const re = /^Slide\s*\d+\s*:/gim
  const matches = [...text.matchAll(re)]

  if (matches.length === 0) {
    return text
      .replace(/^Topic\s*:.*(\n|$)/i, '')
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return matches.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    return text.slice(start, end).trim()
  })
}

export function parseSlideshowScript(raw: string): string[] {
  const slides = Array.from({ length: 5 }, () => '')
  const text = raw.trim()
  if (!text) return slides

  let match: RegExpExecArray | null
  SLIDE_BLOCK_RE.lastIndex = 0
  while ((match = SLIDE_BLOCK_RE.exec(text)) !== null) {
    const index = Number.parseInt(match[1], 10) - 1
    if (index >= 0 && index < 5) {
      slides[index] = match[2].trim()
    }
  }

  if (slides.every((s) => !s)) {
    const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    for (let i = 0; i < Math.min(5, parts.length); i++) {
      slides[i] = parts[i]
    }
  }

  return slides
}

/** Split **highlight** markers into segments for card slides. */
export type TextSegment = { text: string; highlight: boolean }

export function parseHighlightMarkers(line: string): TextSegment[] {
  const segments: TextSegment[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      segments.push({ text: line.slice(last, match.index), highlight: false })
    }
    segments.push({ text: match[1], highlight: true })
    last = match.index + match[0].length
  }

  if (last < line.length) {
    segments.push({ text: line.slice(last), highlight: false })
  }

  if (segments.length === 0) {
    segments.push({ text: line, highlight: false })
  }

  return segments
}

export function applyPhraseHighlight(
  text: string,
  phrase: string,
): { before: string; highlight: string; after: string } | null {
  const trimmed = phrase.trim()
  if (!trimmed) return null

  const lower = text.toLowerCase()
  const needle = trimmed.toLowerCase()
  const idx = lower.indexOf(needle)
  if (idx === -1) return null

  return {
    before: text.slice(0, idx),
    highlight: text.slice(idx, idx + trimmed.length),
    after: text.slice(idx + trimmed.length),
  }
}
