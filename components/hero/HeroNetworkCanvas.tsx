'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import RepoCardNode, { type RepoNodeData } from '@/components/hero/RepoCardNode'
import BeamEdge from '@/components/hero/BeamEdge'

const nodeTypes = { repoCard: RepoCardNode }
const edgeTypes = { beam: BeamEdge }

const REPOS: RepoNodeData[] = [
  { owner: 'onir', name: 'finance-agent', language: 'Python', languageColor: '#3572A5', meta: 'Public', floatDelay: 0 },
  { owner: 'onir', name: 'real-time-exchange', language: 'C++', languageColor: '#f34b7d', meta: 'Public', floatDelay: 0.3 },
  { owner: 'onir', name: 'investing-app', language: 'HTML', languageColor: '#e34c26', meta: 'Public', floatDelay: 0.6 },
  { owner: 'onir', name: 'skin-app', language: 'TypeScript', languageColor: '#3178c6', meta: 'Public', floatDelay: 0.9 },
  { owner: 'onir', name: 'Menserca', language: 'HTML', languageColor: '#e34c26', meta: 'Public', floatDelay: 0.5 },
  { owner: 'onir', name: 'spApp', language: 'HTML', languageColor: '#e34c26', meta: 'Public', floatDelay: 1.1 },
]

/** Positions in the right half — centered cluster, nudged slightly right */
const NODE_POSITIONS = [
  { x: 620, y: 0 },
  { x: 880, y: 50 },
  { x: 560, y: 220 },
  { x: 820, y: 420 },
  { x: 1000, y: 250 },
  { x: 660, y: 520 },
]

function buildNodes(): Node[] {
  return REPOS.map((repo, i) => ({
    id: `repo-${i}`,
    type: 'repoCard',
    position: NODE_POSITIONS[i],
    data: repo,
    draggable: false,
    selectable: false,
    connectable: false,
  }))
}

function buildEdges(): Edge[] {
  const pairs: [number, number][] = [
    [0, 2],
    [2, 3],
    [3, 5],
    [5, 1],
    [1, 4],
    [4, 0],
    [0, 3],
    [2, 4],
  ]

  return pairs.map(([a, b], i) => ({
    id: `beam-${i}`,
    source: `repo-${a}`,
    target: `repo-${b}`,
    type: 'beam',
    data: { pulseDuration: 3 + i * 0.5 },
    selectable: false,
  }))
}

export default function HeroNetworkCanvas() {
  const nodes = useMemo(() => buildNodes(), [])
  const edges = useMemo(() => buildEdges(), [])
  const flowRef = useRef<ReactFlowInstance | null>(null)

  useEffect(() => {
    const fit = () => {
      flowRef.current?.fitView({ padding: 0.04, duration: 200 })
    }
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="hero-network-canvas pointer-events-none absolute left-1/2 right-0 top-0 hidden h-full -translate-x-[5%] overflow-hidden lg:block">
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <linearGradient id="hero-beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.32)" />
            <stop offset="50%" stopColor="rgba(147,197,253,0.92)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.32)" />
          </linearGradient>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        selectionOnDrag={false}
        minZoom={0.92}
        maxZoom={0.92}
        onInit={(instance) => {
          flowRef.current = instance
          void instance.fitView({ padding: 0.04, duration: 0 })
        }}
      />
    </div>
  )
}
