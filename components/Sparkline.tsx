'use client'

import { useEffect, useRef } from 'react'

const TONE_RGB: Record<'green' | 'blue' | 'amber' | 'red' | 'pink' | 'muted', [number, number, number]> = {
  green: [34, 197, 94],
  blue: [122, 167, 255],
  amber: [245, 158, 11],
  red: [248, 113, 113],
  pink: [249, 168, 212],
  muted: [104, 115, 134],
}

interface Props {
  points: number[]
  tone?: keyof typeof TONE_RGB
  className?: string
}

// Trend line for a repo's score history — one point per scan, oldest to
// newest. A single-point history is duplicated so it still renders as a
// flat, endpoint-only line instead of being blank.
export default function Sparkline({ points, tone = 'green', className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const data = points.length >= 2 ? points : [...points, ...points]

    const draw = () => {
      const rgb = TONE_RGB[tone]
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return
      canvas.width = w * dpr
      canvas.height = h * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const pad = 4
      const min = Math.min(...data)
      const max = Math.max(...data)
      const span = max - min || 1
      const xs = data.map((_, i) => pad + i * ((w - 2 * pad) / (data.length - 1 || 1)))
      const ys = data.map((p) => h - pad - ((p - min) / span) * (h - 2 * pad))

      ctx.strokeStyle = 'rgba(150,160,180,0.14)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, h - pad + 0.5)
      ctx.lineTo(w - pad, h - pad + 0.5)
      ctx.stroke()

      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.28)`)
      grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
      ctx.beginPath()
      ctx.moveTo(xs[0], h - pad)
      xs.forEach((x, i) => ctx.lineTo(x, ys[i]))
      ctx.lineTo(xs[xs.length - 1], h - pad)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i])))
      ctx.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
      ctx.lineWidth = 1.6
      ctx.stroke()

      const lastX = xs[xs.length - 1]
      const lastY = ys[ys.length - 1]
      ctx.beginPath()
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.22)`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(lastX, lastY, 2.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
      ctx.fill()
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [points, tone])

  return <canvas ref={ref} className={className} />
}
