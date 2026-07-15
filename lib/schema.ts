import { z } from 'zod'

const CategoryScoreSchema = z
  .object({
    score: z.number().int().min(0),
    max: z.number().int().min(1),
    reason: z.string(),
  })
  .refine((c) => c.score <= c.max, {
    message: 'Category score cannot exceed max',
  })

const RepoScoreCategoriesSchema = z.object({
  first_impression_clarity: CategoryScoreSchema,
  runnable_setup_dx: CategoryScoreSchema,
  technical_depth_system_design: CategoryScoreSchema,
  proof_of_shipping: CategoryScoreSchema,
  testing_reliability_quality: CategoryScoreSchema,
  documentation_depth: CategoryScoreSchema,
})

export const RepoScoreSchema = z.object({
  total: z.number().int().min(0).max(100),
  label: z.string(),
  summary: z.string(),
  categories: RepoScoreCategoriesSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  fixes: z.array(z.string()),
})

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

const resumeBulletStringSchema = z
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

export const BulletEvidenceSchema = z.object({
  label: z.string().min(1),
  type: z.enum(['file', 'dependency', 'commit']),
})

export const ResumeBulletWithEvidenceSchema = z.object({
  bullet: resumeBulletStringSchema,
  evidence: z.array(BulletEvidenceSchema).max(6).default([]),
})

export const ResumeBulletSchema = z
  .union([
    ResumeBulletWithEvidenceSchema,
    resumeBulletStringSchema.transform((s) => ({
      bullet: s,
      evidence: [] as z.infer<typeof BulletEvidenceSchema>[],
    })),
  ])

export const AnalyzeResponseSchema = z.object({
  resumeBullets: z.array(ResumeBulletSchema).min(3).max(4),
  warnings: z.array(z.string()).optional().default([]),
  repoScore: RepoScoreSchema.optional(),
})

export type AnalyzeResponseOutput = z.infer<typeof AnalyzeResponseSchema>
export type BulletEvidenceOutput = z.infer<typeof BulletEvidenceSchema>
export type ResumeBulletOutput = z.infer<typeof ResumeBulletSchema>

