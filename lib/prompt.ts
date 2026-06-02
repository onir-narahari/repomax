import OpenAI from 'openai'
import type { RepoContext, RepoScore } from '@/types'
import { normalizeRepoScore } from './repo-score'
import { AnalyzeResponseSchema, RepoScoreSchema, type AnalyzeResponseOutput } from './schema'

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
    console.error('[RepoMax] Bullet gen — no tool call. finish_reason:', choice?.finish_reason, 'content:', choice?.message?.content)
    throw new Error('LLM_ERROR')
  }

  const result = JSON.parse(toolCall.function.arguments) as BulletsResult
  if (!Array.isArray(result.resumeBullets) || result.resumeBullets.length < 3) {
    console.error('[RepoMax] Bullet gen — too few bullets:', result.resumeBullets?.length, result.resumeBullets)
    throw new Error('LLM_ERROR')
  }
  return result
}


// ─── Repo scoring ─────────────────────────────────────────────────────────────

const SCORE_SYSTEM_PROMPT = `You are a senior software engineer and technical recruiter auditing a GitHub repository.

Score this repo across 7 categories. Each category has a max score listed below.

CATEGORIES (total max = 100):
1. first_impression_clarity — max 15
   Does the README immediately explain what the project does, who it's for, and what problem it solves?
   10–15: clear project summary, audience, and purpose in first scroll
   5–9: partially explains the project but requires reading to understand
   0–4: confusing, empty, or generic README opener

2. runnable_setup_dx — max 15
   Can a developer clone and run this project without guessing? Are setup instructions present and complete?
   10–15: clear install + run steps, environment setup, prerequisites
   5–9: partial setup instructions, missing steps or env config
   0–4: no setup instructions or clearly broken/missing instructions

3. technical_depth_system_design — max 20
   Does the code show meaningful engineering work beyond basic CRUD or tutorial-following?
   15–20: real system design, non-trivial architecture, interesting algorithms, API/backend design, ML pipeline, or domain logic
   8–14: shows some technical effort but is mostly standard framework usage
   0–7: basic CRUD, tutorial clone, or no discernible engineering depth

4. proof_of_shipping — max 15
   Does the repo show that something was actually built and works? Are there demos, screenshots, commit history, deployed links, or measurable outputs?
   10–15: deployed link, screenshots/GIFs, many commits, or clear evidence of a working product
   5–9: some commits or a demo, but limited proof
   0–4: no demo, no screenshots, sparse commits, no deployment evidence visible

5. testing_reliability_quality — max 15
   Does the repo have tests, CI/CD, linting, or other quality signals?
   10–15: test files present and meaningful, CI config, code quality tooling
   5–9: partial tests or only CI lint, no meaningful test coverage visible
   0–4: no tests, no CI, no quality signals visible

6. documentation_depth — max 10
   Beyond the README opener, is the project well documented? Architecture notes, API docs, contributing guide, inline code comments for non-obvious logic?
   7–10: architecture explanation, API reference, contributing guide, or well-commented non-obvious code
   3–6: minimal docs beyond README, or README is the only documentation
   0–2: essentially undocumented

7. recruiter_resume_extractability — max 10
   Can a recruiter or the repo author extract 3 strong resume bullets within 30 seconds?
   7–10: project value, tech stack, and engineering work are all immediately clear
   3–6: requires effort to understand what's impressive
   0–2: unclear value, buried implementation, or looks like a class assignment

SCORING RULES:
- Score only what is visible in the README, file tree, dependencies, and commit messages provided.
- Do NOT assume tests exist unless you see test files listed.
- Do NOT assume deployment unless you see a live link, Dockerfile/CI deploy config, or explicit mention.
- Do NOT assume production usage, users, or metrics unless explicitly stated.
- If something is completely absent, say "Not visible in repo" in the reason.
- Each category score MUST be an integer from 0 up to that category's max (never above max).
- total = sum of all 7 category scores exactly (max 100).
- label: 90–100 = "Recruiter-Ready", 80–89 = "Strong Signal", 70–79 = "Needs Polish", 60–69 = "Weak Signal", below 60 = "Not Ready Yet"
- summary: one honest sentence about the repo's biggest strength and biggest gap.
- strengths: exactly 3, each grounded in specific repo evidence.
- weaknesses: exactly 3, each explaining what is missing or unclear.
- fixes: exactly 3, each a specific, actionable improvement to the repo itself.
- resume_positioning_tips: exactly 3, advice for how to describe this project on a resume.

Call generate_score.`

const SCORE_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'generate_score',
    description: 'Generate an evidence-based repo quality score for recruiter and resume purposes',
    parameters: {
      type: 'object',
      required: ['total', 'label', 'summary', 'categories', 'strengths', 'weaknesses', 'fixes', 'resume_positioning_tips'],
      properties: {
        total: { type: 'number', description: 'Sum of all 7 category scores (0–100).' },
        label: { type: 'string', description: 'One of: Recruiter-Ready, Strong Signal, Needs Polish, Weak Signal, Not Ready Yet' },
        summary: { type: 'string', description: 'One sentence: biggest strength + biggest gap.' },
        categories: {
          type: 'object',
          required: [
            'first_impression_clarity', 'runnable_setup_dx', 'technical_depth_system_design',
            'proof_of_shipping', 'testing_reliability_quality', 'documentation_depth',
            'recruiter_resume_extractability',
          ],
          properties: {
            first_impression_clarity: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [15] },
                reason: { type: 'string' },
              },
            },
            runnable_setup_dx: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [15] },
                reason: { type: 'string' },
              },
            },
            technical_depth_system_design: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [20] },
                reason: { type: 'string' },
              },
            },
            proof_of_shipping: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [15] },
                reason: { type: 'string' },
              },
            },
            testing_reliability_quality: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [15] },
                reason: { type: 'string' },
              },
            },
            documentation_depth: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [10] },
                reason: { type: 'string' },
              },
            },
            recruiter_resume_extractability: {
              type: 'object',
              required: ['score', 'max', 'reason'],
              properties: {
                score: { type: 'number' },
                max: { type: 'number', enum: [10] },
                reason: { type: 'string' },
              },
            },
          },
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 specific strengths grounded in repo evidence.',
        },
        weaknesses: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 specific weaknesses or missing elements.',
        },
        fixes: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 specific, actionable repo improvements.',
        },
        resume_positioning_tips: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 tips for describing this project on a resume.',
        },
      },
    },
  },
}

function buildScoreMessage(ctx: RepoContext): string {
  const parts: string[] = []
  parts.push(`Repo: ${ctx.name}`)
  if (ctx.description) parts.push(`Description: ${ctx.description}`)
  if (ctx.primaryLanguage) parts.push(`Primary language: ${ctx.primaryLanguage}`)
  if (ctx.topics.length > 0) parts.push(`Topics: ${ctx.topics.join(', ')}`)
  if (ctx.dependencies.length > 0) parts.push(`Dependencies: ${ctx.dependencies.join(', ')}`)
  if (ctx.fileTree.length > 0) parts.push(`File tree (sample):\n${ctx.fileTree.join('\n')}`)
  if (ctx.architectureSignals.length > 0) parts.push(`Architecture signals: ${ctx.architectureSignals.join(', ')}`)
  if (ctx.recentCommits.length > 0) parts.push(`Recent commits:\n${ctx.recentCommits.join('\n')}`)
  parts.push(`Has CI: ${ctx.hasCI}`)
  parts.push(`Stars: ${ctx.stars}`)
  parts.push(`Forks: ${ctx.forksCount}`)
  const readmeText = ctx.readme ?? 'No README available.'
  parts.push(`\nREADME:\n---\n${readmeText}\n---`)
  parts.push(`\nScore this repo across all 7 categories based only on the evidence above. Call generate_score.`)
  return parts.join('\n')
}

async function generateScore(ctx: RepoContext): Promise<RepoScore | undefined> {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: SCORE_SYSTEM_PROMPT },
        { role: 'user', content: buildScoreMessage(ctx) },
      ],
      tools: [SCORE_TOOL],
      tool_choice: { type: 'function', function: { name: 'generate_score' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    if (!toolCall || toolCall.type !== 'function') return undefined

    const raw = JSON.parse(toolCall.function.arguments) as RepoScore
    const normalized = normalizeRepoScore(raw)
    const parsed = RepoScoreSchema.safeParse(normalized)
    if (!parsed.success) {
      console.error('[RepoMax] Score schema validation failed:', parsed.error.flatten())
      return undefined
    }
    return parsed.data
  } catch (err) {
    console.error('[RepoMax] Score generation error:', err)
    return undefined
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function generateContent(
  ctx: RepoContext,
  targetRole?: string
): Promise<AnalyzeResponseOutput> {
  const bulletMsg = buildBulletMessage(ctx, targetRole)

  // Run bullets and scoring in parallel
  const [bulletsResult, repoScore] = await Promise.all([
    generateBulletsFirst(bulletMsg),
    generateScore(ctx),
  ])

  const parsed = AnalyzeResponseSchema.safeParse({
    resumeBullets: bulletsResult.resumeBullets,
    warnings: [],
    repoScore,
  })

  const resumeBullets = parsed.success
    ? parsed.data.resumeBullets
    : bulletsResult.resumeBullets.slice(0, 3)

  const allWarnings = [...new Set([...ctx.warnings])]
  return { resumeBullets, warnings: allWarnings, repoScore }
}

// ─── Exported helpers (used by tests / external callers) ─────────────────────

export function buildUserMessage(ctx: RepoContext, targetRole?: string): string {
  return buildBulletMessage(ctx, targetRole)
}
