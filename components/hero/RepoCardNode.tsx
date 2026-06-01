'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitFork } from 'lucide-react'
import { motion } from 'motion/react'

export type RepoNodeData = {
  owner: string
  name: string
  language: string
  languageColor: string
  meta?: string
  floatDelay?: number
}

function RepoCardNode({ data }: NodeProps) {
  const d = data as RepoNodeData
  const delay = d.floatDelay ?? 0

  return (
    <motion.div
      className="w-[176px] rounded-xl border border-white/[0.14] bg-[#0A0F1E]/88 p-3.5 shadow-[0_0_32px_rgba(59,130,246,0.15)] backdrop-blur-sm"
      style={{ opacity: 0.86 }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 6 + delay * 2, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0" />

      <div className="mb-2 flex items-center gap-1.5">
        <GitFork className="h-2.5 w-2.5 text-blue-400/55" />
        <span className="truncate font-mono text-[11px] text-white/58">
          {d.owner}/<span className="text-blue-300/80">{d.name}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: d.languageColor, opacity: 0.75 }}
          />
          <span className="text-[9px] text-white/38">{d.language}</span>
        </div>
        {d.meta && (
          <span className="rounded-full border border-white/[0.07] px-1.5 py-0.5 text-[8px] text-white/25">
            {d.meta}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default memo(RepoCardNode)
