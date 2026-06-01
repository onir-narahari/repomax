import OpenAI from 'openai'
import type { RepoContext } from '@/types'
import { AnalyzeResponseSchema, type AnalyzeResponseOutput } from './schema'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Resume bullet generation prompt ─────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a senior technical resume writer and SWE/AI recruiter.

Read the full README and write exactly 3 resume bullets for a CS student applying to SWE, AI/ML, systems, quant/dev, or startup internships.

Your goal is to make the project look as strong as it truthfully can on a resume.

Use only the README and provided repo context. Never invent users, production usage, scale, accuracy, revenue, metrics, or outcomes. Use numbers only if they are explicitly stated.

Do not summarize the README. Do not try to include everything. Pick the strongest technical signals only.

What counts as a strong resume signal:

1. A real technical system or product the user built
2. A non-trivial implementation detail: algorithm, data structure, architecture, pipeline, validation, API/backend design, ML/AI workflow, database design, automation, infrastructure, or domain-specific logic
3. A supported metric that proves technical impact: runtime, latency, throughput, accuracy, scale, benchmark, cost, memory, PnL, error reduction, or before/after result
4. A domain-specific calculation, simulation, model, rule system, or analysis method
5. A feature that shows engineering depth, not just product surface area

Weak signals to avoid unless there is nothing stronger:

* basic UI/dashboard work
* generic WebSocket or API usage with no technical depth
* simple framework usage
* internal labels that sound small
* vague “full-stack” claims
* generic “AI-powered” descriptions
* feature lists with no engineering depth
* metrics that are not clearly tied to the feature

Bullet structure:

Bullet 1 — Overall project:
State what was built, the main stack, and the 2–3 strongest capabilities. This should make the project instantly understandable and impressive. No metric unless it naturally describes project scale.

Bullet 2 — Best technical proof:
Pick the strongest technical implementation from the README. Lead with what was built and how it works. If a supported metric directly proves this work, include it.

Bullet 3 — Second-best technical proof:
Pick the next strongest technical implementation, optimization, architecture decision, calculation method, pipeline, validation logic, or domain-specific feature. If a supported metric directly proves this work, include it.

Metric rules:
Metrics strengthen bullets, but they do not replace technical substance.
Attach metrics only to the feature or implementation they actually support.
If a metric’s cause is unclear, use it in a broader optimization bullet instead of forcing it onto the wrong feature.
Do not dump unrelated metrics into one bullet.
Do not ignore a strong metric when it clearly supports one of the selected technical proofs.
Never invent, infer, estimate, calculate, or “make reasonable” metrics.

Writing rules:

* exactly 3 bullets
* one sentence per bullet
* plain text only
* strong action verbs
* concise and recruiter-readable
* technical enough to prove engineering skill
* impressive but truthful
* no markdown, bold, backticks, first person, or explanations

Avoid:

* “efficient,” “robust,” “scalable,” “advanced,” “significantly,” “capable of,” “featuring,” “enhancing,” “improving,” or “ensuring”
* “AI-powered,” “leveraged,” “utilized,” or “cutting-edge”
* vague endings like “improving performance,” “enhancing efficiency,” or “enhancing visualization”
* title casing project names unless it is the official repo/product name
* weak metric pairings, such as attaching backend latency to UI/WebSocket work unless the README explicitly says that metric measures that path

Before outputting, silently check:

1. Did I choose the strongest technical features, not just the most obvious features?
2. Does Bullet 1 clearly explain the full project?
3. Do Bullets 2 and 3 prove technical depth?
4. Is every metric attached to the correct feature?
5. Did I remove filler and weak wording?
6. Would these bullets look strong on a real internship resume?

Return only the final 3 bullets.

`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBulletMessage(ctx: RepoContext, targetRole?: string): string {
  const parts: string[] = []

  if (targetRole) {
    parts.push(`Target role: ${targetRole}`)
  }

  parts.push(`Repo: ${ctx.name}`)
  if (ctx.description) parts.push(`Description: ${ctx.description}`)
  if (ctx.primaryLanguage) parts.push(`Language: ${ctx.primaryLanguage}`)
  if (ctx.dependencies.length > 0) {
    parts.push(`Dependencies: ${ctx.dependencies.join(', ')}`)
  }

  const readmeText = ctx.readme ?? 'No README available.'

  parts.push(`\nREADME:\n---\n${readmeText}\n---`)
  parts.push(`\nRead the full README. Write 3 bullets — bullets 2 and 3 use the same rules: strongest technical proof + README metric when it belongs to that work. Call generate_bullets.`)

  return parts.join('\n')
}

// ─── Bullet generation ────────────────────────────────────────────────────────

const BULLETS_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'generate_bullets',
    description: "Generate Jake's Resume-style project bullets for a GitHub repository",
    parameters: {
      type: 'object',
      required: ['projectName', 'detectedTechStack', 'metricsFound', 'featuresFound', 'resumeBullets'],
      properties: {
        projectName: {
          type: 'string',
          description: 'The name of the project as understood from the repo.',
        },
        detectedTechStack: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technologies, frameworks, libraries, and tools detected in the repo.',
        },
        metricsFound: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional scratch notes — metrics explicitly stated in the README. Empty array if none.',
        },
        featuresFound: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional scratch notes — key features noticed while reading the README.',
        },
        resumeBullets: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 bullets. Bullets 2–3: strongest technical proof each; include a README metric only when it clearly belongs to that work.',
        },
      },
    },
  },
}

type BulletsResult = {
  projectName: string
  detectedTechStack: string[]
  metricsFound: string[]
  featuresFound: string[]
  resumeBullets: string[]
}

async function generateBulletsFirst(bulletMsg: string): Promise<BulletsResult> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: bulletMsg },
    ],
    tools: [BULLETS_TOOL],
    tool_choice: { type: 'function', function: { name: 'generate_bullets' } },
  })

  const choice = response.choices[0]
  const toolCall = choice?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') {
    console.error('[RepoStory] Bullet gen — no tool call. finish_reason:', choice?.finish_reason, 'content:', choice?.message?.content)
    throw new Error('LLM_ERROR')
  }

  const result = JSON.parse(toolCall.function.arguments) as BulletsResult
  if (!Array.isArray(result.resumeBullets) || result.resumeBullets.length < 3) {
    console.error('[RepoStory] Bullet gen — too few bullets:', result.resumeBullets?.length, result.resumeBullets)
    throw new Error('LLM_ERROR')
  }
  return result
}

// ─── Posts from finalized bullets ────────────────────────────────────────────

const POSTS_SYSTEM_PROMPT = `You are a content writer for software developers. You write LinkedIn posts and X/Twitter posts that sound like a real builder sharing a project.

You receive finalized resume bullets that describe the project accurately. Use them as your sole source of truth for technical claims, features, and metrics.

LINKEDIN POST RULES:
- 150–250 words, human and conversational
- Open with a specific hook about what was built or the problem it solves
- Mention the most interesting technical implementation detail from the bullets
- Include a lesson learned or engineering insight
- End with a question or call-to-action
- 3–5 relevant hashtags only
- Do NOT open with "I am thrilled to announce" or "Excited to share"
- Do NOT sound like a press release

X/TWITTER POST RULES:
- 280 characters total maximum
- Strong specific first line — name the project and what it does
- One concrete technical detail drawn from the bullets
- 0–2 hashtags max
- Sound like a builder posting, not a marketer announcing

TRUTH RULE: Only reference technical details, features, and metrics present in the provided bullets. Do not invent anything new.`

const POSTS_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'generate_posts',
    description: 'Generate LinkedIn and X/Twitter posts anchored to the finalized resume bullets',
    parameters: {
      type: 'object',
      required: ['linkedInPost', 'twitterPost'],
      properties: {
        linkedInPost: {
          type: 'string',
          description: '150–250 word LinkedIn post grounded in the provided bullets',
        },
        twitterPost: {
          type: 'string',
          maxLength: 280,
          description: 'Tweet of ≤280 characters grounded in the provided bullets',
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only warn if missing info limits post quality. Leave empty if not needed. Never emit meta-commentary about instructions.',
        },
      },
    },
  },
}

function filterPostWarnings(warnings: string[]): string[] {
  return warnings.filter((w) => {
    const lower = w.toLowerCase()
    return !(
      lower.includes('not used') ||
      lower.includes('project context') ||
      lower.includes('was not part of') ||
      lower.includes('finalized resume bullets')
    )
  })
}

function buildPostsMessage(bulletsResult: BulletsResult): string {
  const parts: string[] = []

  parts.push(`=== RESUME BULLETS ===`)
  bulletsResult.resumeBullets.forEach((b, i) => parts.push(`${i + 1}. ${b}`))

  parts.push(`\nWrite a LinkedIn post and an X/Twitter post using only the bullets above. Call generate_posts.`)

  return parts.join('\n\n')
}

async function generatePostsFromBullets(postsMsg: string): Promise<{
  linkedInPost: string
  twitterPost: string
  warnings: string[]
}> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    max_tokens: 700,
    messages: [
      { role: 'system', content: POSTS_SYSTEM_PROMPT },
      { role: 'user', content: postsMsg },
    ],
    tools: [POSTS_TOOL],
    tool_choice: { type: 'function', function: { name: 'generate_posts' } },
  })

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') throw new Error('LLM_ERROR')

  const result = JSON.parse(toolCall.function.arguments) as {
    linkedInPost: string
    twitterPost: string
    warnings?: string[]
  }

  return {
    linkedInPost: result.linkedInPost,
    twitterPost: result.twitterPost,
    warnings: result.warnings ?? [],
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function generateContent(
  ctx: RepoContext,
  targetRole?: string
): Promise<AnalyzeResponseOutput> {
  const bulletMsg = buildBulletMessage(ctx, targetRole)
  const bulletsResult = await generateBulletsFirst(bulletMsg)

  const postsMsg = buildPostsMessage(bulletsResult)
  const posts = await generatePostsFromBullets(postsMsg)

  // Validate final output shape
  const parsed = AnalyzeResponseSchema.safeParse({
    resumeBullets: bulletsResult.resumeBullets,
    linkedInPost: posts.linkedInPost,
    twitterPost: posts.twitterPost,
    warnings: [],
  })

  const resumeBullets = parsed.success
    ? parsed.data.resumeBullets
    : bulletsResult.resumeBullets.slice(0, 3)

  const allWarnings = [...new Set([...ctx.warnings, ...filterPostWarnings(posts.warnings)])]
  return { resumeBullets, linkedInPost: posts.linkedInPost, twitterPost: posts.twitterPost, warnings: allWarnings }
}

// ─── Exported helpers (used by tests / external callers) ─────────────────────

export function buildUserMessage(ctx: RepoContext, targetRole?: string): string {
  return buildBulletMessage(ctx, targetRole)
}
