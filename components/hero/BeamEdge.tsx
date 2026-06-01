'use client'

import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

function BeamEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  })

  const pulseDur = (data as { pulseDuration?: number } | undefined)?.pulseDuration ?? 4

  return (
    <>
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          ...style,
          stroke: 'rgba(96, 165, 250, 0.28)',
          strokeWidth: 5.5,
          filter: 'blur(2px)',
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        className="hero-beam-edge"
        style={{
          ...style,
          stroke: 'url(#hero-beam-gradient)',
          strokeWidth: 1.65,
        }}
      />
      <circle r="2.5" fill="#93c5fd" opacity="0.9">
        <animateMotion dur={`${pulseDur}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  )
}

export default memo(BeamEdge)
