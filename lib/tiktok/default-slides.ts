import { parseStoryboard } from './parse-script'

export const DEFAULT_STORYBOARD = `Topic:
The recruiter scan

Slide 1:
this is how your CS project
gets judged

Slide 2:
recruiter sees:

project name
one bullet
GitHub link

that's it.

Slide 3:
so your bullet has to carry:

what you built
why it's technical
why it matters

Slide 4:
RepoMax reads your repo
and gives you:

repo score
fix list
resume bullets

tryrepomax.com`

const DEFAULT_IMAGES = [
  '/tiktok/photos/slide1.jpeg',
  '/tiktok/photos/slide2.jpeg',
  '/tiktok/photos/slide3.jpeg',
  '/tiktok/photos/slide4.jpeg',
] as const

/** Per-slide layout tuned for the default photo set. */
const DEFAULT_LAYOUT = [
  { textTop: 30, textLeft: 50, fontSize: 64 },
  { textTop: 14, textLeft: 50, fontSize: 44 },
  { textTop: 12, textLeft: 50, fontSize: 40 },
  { textTop: 11, textLeft: 50, fontSize: 38 },
] as const

export type DefaultSlideSeed = {
  id: number
  text: string
  imageUrl: string
  textTop: number
  textLeft: number
  fontSize: number
  highlightPhrase: string
  underlineFirstLine: boolean
}

let _defaultId = 1

export function buildDefaultSlides(): DefaultSlideSeed[] {
  const texts = parseStoryboard(DEFAULT_STORYBOARD)
  return texts.map((text, i) => ({
    id: _defaultId++,
    text,
    imageUrl: DEFAULT_IMAGES[i] ?? '',
    textTop: DEFAULT_LAYOUT[i]?.textTop ?? 50,
    textLeft: DEFAULT_LAYOUT[i]?.textLeft ?? 50,
    fontSize: DEFAULT_LAYOUT[i]?.fontSize ?? (i === 0 ? 64 : 40),
    highlightPhrase: '',
    underlineFirstLine: false,
  }))
}
