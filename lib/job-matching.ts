import { fetchPinnedRepoNames } from './github'
import type { GitHubUserRepo } from '@/types'

// Target committed set size (docs/prd-job-matching.md §7) — repo selection
// only engages scoring/pinning above this; at or below it, every usable repo
// is used with no ranking.
export const MAX_CANDIDATE_REPOS = 5
// Exported: shared with lib/matching-engine.ts as its TARGET_MATCHES. The PRD's
// funnel diagram (docs/prd-job-matching.md §8) and §8.5's worked examples
// illustrate "3", but migration 0002 already raised user_job_matches.match_rank's
// cap to 1-5 and the old live-compute path already targeted 5 — the PRD's "3"
// predates that cap raise. Keep this at 5, don't "fix" it back down to 3.
export const MAX_TOTAL_MATCHES = 5

// Name heuristics for coursework/tutorial repos (docs/prd-job-matching.md
// §7.2) — these look like real projects by size/stars but don't represent a
// student's own work.
const PENALIZED_NAME_PATTERNS: RegExp[] = [
  /tutorial/i,
  /(^|[-_])hw\d*($|[-_])/i,
  /assignment/i,
  /cs\d{2,4}/i,
  /clone/i,
  /^learn-/i,
  /dotfiles/i,
]

function hasPenalizedName(name: string): boolean {
  return name.startsWith('.') || PENALIZED_NAME_PATTERNS.some((p) => p.test(name))
}

const NAME_PENALTY = 40
const DESCRIPTION_BONUS = 15
const TOPICS_BONUS_PER_TOPIC = 3
const TOPICS_BONUS_CAP = 12
const SIZE_BONUS_CAP = 12
const RECENCY_BONUS_CAP = 8
const RECENCY_DECAY_DAYS = 30 // ~1 point lost per month since last update
const STAR_BONUS_CAP = 5
// Candidates within this many points of each other are treated as a close
// score (docs/prd-job-matching.md §7.2: "break toward tech/domain diversity
// on close scores" rather than piling onto the single top-scoring stack).
const CLOSE_SCORE_MARGIN = 8

function scoreRepo(repo: GitHubUserRepo, now: number): number {
  let score = 0

  if (repo.description && repo.description.trim().length > 0) score += DESCRIPTION_BONUS
  if (repo.topics.length > 0) score += Math.min(repo.topics.length * TOPICS_BONUS_PER_TOPIC, TOPICS_BONUS_CAP)

  score += Math.min(Math.log10(repo.size + 1) * 4, SIZE_BONUS_CAP)
  score += Math.min(Math.log10(repo.stars + 1) * 2, STAR_BONUS_CAP)

  const ageDays = (now - new Date(repo.updatedAt).getTime()) / 86_400_000
  score += Math.max(0, RECENCY_BONUS_CAP - ageDays / RECENCY_DECAY_DAYS)

  if (hasPenalizedName(repo.name)) score -= NAME_PENALTY

  return score
}

// Fills `count` slots from `candidates` by composite score, breaking close
// scores toward language diversity instead of always taking the next-highest
// score — a student's second-best web app shouldn't crowd out their one ML
// repo just because it scores a couple points higher. Never filters anyone
// out for a low/negative score: if every candidate is penalized, the top
// `count` (by score) are still returned.
function selectByCompositeScore(candidates: GitHubUserRepo[], count: number, now: number): GitHubUserRepo[] {
  const remaining = candidates
    .map((repo) => ({ repo, score: scoreRepo(repo, now) }))
    .sort((a, b) => b.score - a.score)

  const selected: GitHubUserRepo[] = []
  const usedLanguages = new Set<string>()

  while (selected.length < count && remaining.length > 0) {
    const topScore = remaining[0].score
    const closeCount = remaining.findIndex((c) => c.score < topScore - CLOSE_SCORE_MARGIN)
    const closeCandidates = remaining.slice(0, closeCount === -1 ? remaining.length : closeCount)

    let pickIdx = closeCandidates.findIndex((c) => !c.repo.language || !usedLanguages.has(c.repo.language))
    if (pickIdx === -1) pickIdx = 0

    const [pick] = remaining.splice(pickIdx, 1)
    selected.push(pick.repo)
    if (pick.repo.language) usedLanguages.add(pick.repo.language)
  }

  return selected
}

// Picks the candidate repo set (docs/prd-job-matching.md §7). Pure function
// of the repo list + pinned repo names so it's directly unit-testable
// without hitting GitHub. `now` defaults to the real clock but can be pinned
// in tests since recency is one of the scoring signals.
export function selectCandidateRepos(
  repos: GitHubUserRepo[],
  pinnedNames: string[] = [],
  now: number = Date.now()
): GitHubUserRepo[] {
  if (repos.length <= MAX_CANDIDATE_REPOS) return repos

  const pinnedSet = new Set(pinnedNames)
  const pinned = pinnedNames
    .map((name) => repos.find((r) => r.name === name))
    .filter((r): r is GitHubUserRepo => r !== undefined)
    .slice(0, MAX_CANDIDATE_REPOS)

  if (pinned.length >= MAX_CANDIDATE_REPOS) return pinned

  const unpinned = repos.filter((r) => !pinnedSet.has(r.name))
  const filled = selectByCompositeScore(unpinned, MAX_CANDIDATE_REPOS - pinned.length, now)

  return [...pinned, ...filled]
}

// Resolves just the candidate repo names (same selection logic as
// selectCandidateRepos, including pinned repos fetched via GitHub GraphQL
// when `username` is given) without fetching any per-repo GitHub context.
// Used by the onboarding auto-pick endpoint (app/api/jobs/candidate-repos)
// to suggest a default committed set; the live-compute match pipeline that
// used to consume the equivalent fetched-context version of this was
// removed in issue #17 (matches are read from precomputed rows now — see
// lib/matching-engine.ts's computeMatchesForUser).
export async function resolveCandidateRepoNames(repos: GitHubUserRepo[], username?: string): Promise<string[]> {
  const pinnedNames = username ? await fetchPinnedRepoNames(username) : []
  return selectCandidateRepos(repos, pinnedNames).map((r) => r.name)
}
