import { z } from 'zod'

export const AnalyzeRequestSchema = z.object({
  repoUrl: z
    .string()
    .regex(
      /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/,
      'Must be a valid GitHub repo URL (e.g. https://github.com/owner/repo)'
    ),
  targetRole: z.string().max(100).optional(),
})

const GENERIC_PHRASES = [
  'various technologies',
  'cutting-edge',
  'leveraged',
  'utilizing',
  'several',
  'multiple technologies',
  'tech stack',
]

const resumeBulletSchema = z
  .string()
  .min(80)
  .refine(
    (bullet) => {
      const lower = bullet.toLowerCase()
      return !GENERIC_PHRASES.some((phrase) => lower.includes(phrase))
    },
    {
      message:
        'Resume bullet contains a generic phrase (e.g. "various technologies", "cutting-edge", "leveraged", "utilizing", "several", "multiple technologies", "tech stack"). Rewrite using specific technical language.',
    }
  )

export const AnalyzeResponseSchema = z.object({
  resumeBullets: z.array(resumeBulletSchema).min(3).max(4),
  linkedInPost: z.string().min(300).max(1500),
  twitterPost: z.string().min(20).max(280),
  warnings: z.array(z.string()).optional().default([]),
})

export type AnalyzeResponseOutput = z.infer<typeof AnalyzeResponseSchema>
