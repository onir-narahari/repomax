import { domToBlob } from 'modern-screenshot'
import JSZip from 'jszip'
import { SLIDE_HEIGHT, SLIDE_WIDTH } from './constants'

export async function exportSlideToPng(element: HTMLElement): Promise<Blob> {
  const blob = await domToBlob(element, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    scale: 1,
    backgroundColor: null,
  })

  if (!blob) throw new Error('Export returned empty file')
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAllSlides(elements: HTMLElement[]) {
  const zip = new JSZip()

  for (let i = 0; i < elements.length; i++) {
    const blob = await exportSlideToPng(elements[i])
    zip.file(`slide${i + 1}.png`, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'repomax-tiktok-slides.zip')
}
