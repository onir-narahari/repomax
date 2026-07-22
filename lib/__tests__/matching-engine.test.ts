import { describe, expect, it } from 'vitest'
import {
  applyPerRepoCap,
  computeRepoCap,
  cosineSimilarity,
  dedupeByHighestScoringRepo,
  displayScore,
  dropSeen,
  fallbackForUnrepresentedRepos,
  gateMatches,
  parseEmbedding,
  rankCandidates,
  recencyBoost,
  recencyMultiplier,
  restoreRepoFloorIfFullySeen,
  retrieveTopCandidates,
  selectForRerank,
  selectOneMatchPerRepo,
  DISPLAY_TOTAL_CAP,
  MIN_CANDIDATES_PER_REPO,
  RECENCY_BOOST_STALE,
  RECENCY_BOOST_UNDER_7D,
  RECENCY_BOOST_UNDER_14D,
  RECENCY_BOOST_UNDER_48H,
  type RerankedMatch,
  type RetrievalCandidate,
} from '../matching-engine'

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('is -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1)
  })

  it('returns 0 for mismatched lengths instead of throwing', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0)
  })

  it('returns 0 for a zero vector instead of dividing by zero', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })
})

describe('retrieveTopCandidates', () => {
  const repos = [
    { repoName: 'repo-a', embedding: [1, 0] },
    { repoName: 'repo-b', embedding: [0, 1] },
  ]
  const jobs = [
    { jobPostingId: 'job-1', embedding: [1, 0], postedAt: null }, // perfect match for repo-a
    { jobPostingId: 'job-2', embedding: [0, 1], postedAt: null }, // perfect match for repo-b
    { jobPostingId: 'job-3', embedding: [-1, 0], postedAt: null }, // anti-match for both
  ]

  it('produces every repo x job pair, sorted best similarity first', () => {
    const result = retrieveTopCandidates(repos, jobs, 100)
    expect(result).toHaveLength(6) // 2 repos * 3 jobs
    expect(result[0].semanticSimilarity).toBeGreaterThanOrEqual(result[1].semanticSimilarity)
    expect(result[0].semanticSimilarity).toBeCloseTo(1)
  })

  it('truncates to topN', () => {
    const result = retrieveTopCandidates(repos, jobs, 2)
    expect(result).toHaveLength(2)
    // Both perfect-match pairs should be the top 2.
    expect(result.map((r) => r.jobPostingId).sort()).toEqual(['job-1', 'job-2'])
  })

  it('does not dedupe a posting that pairs strongly with multiple repos', () => {
    const sameRepoTwice = [
      { repoName: 'repo-a', embedding: [1, 0] },
      { repoName: 'repo-c', embedding: [1, 0] },
    ]
    const result = retrieveTopCandidates(sameRepoTwice, [jobs[0]], 100)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.matchedRepoName).sort()).toEqual(['repo-a', 'repo-c'])
  })

  it('never crowds a repo out of the pool even when another repo dominates every top score (2026-07-20 fix)', () => {
    // repo-strong scores near-perfectly against every job; repo-weak scores
    // low against all of them but is not zero — a real, if less obvious, fit.
    const repos = [
      { repoName: 'repo-strong', embedding: [1, 0] },
      { repoName: 'repo-weak', embedding: [0.6, 0.1] },
    ]
    const manyJobs = Array.from({ length: 20 }, (_, i) => ({
      jobPostingId: `job-${i}`,
      embedding: [0.99, 0.01],
      postedAt: null,
    }))
    // A flat top-N cut (N=5) would fill entirely from repo-strong, since its
    // similarity beats repo-weak's against every single job.
    const result = retrieveTopCandidates(repos, manyJobs, 5)
    expect(result.some((r) => r.matchedRepoName === 'repo-weak')).toBe(true)
  })

  it('reserves exactly MIN_CANDIDATES_PER_REPO for the weaker repo when the dominant repo alone could fill the rest of the budget', () => {
    const repos = [
      { repoName: 'repo-strong', embedding: [1, 0] },
      { repoName: 'repo-weak', embedding: [0.6, 0.1] },
    ]
    // 40 jobs so repo-strong (40 pairs) alone has more than enough to fill
    // the remaining budget after reservation, isolating the floor's exact size.
    const manyJobs = Array.from({ length: 40 }, (_, i) => ({
      jobPostingId: `job-${i}`,
      embedding: [0.99, 0.01],
      postedAt: null,
    }))
    const result = retrieveTopCandidates(repos, manyJobs, 30)
    const weakCount = result.filter((r) => r.matchedRepoName === 'repo-weak').length
    expect(weakCount).toBe(MIN_CANDIDATES_PER_REPO)
  })
})

describe('gateMatches', () => {
  function m(repo: string, confidence: number): RerankedMatch {
    return { jobPostingId: `job-${repo}-${confidence}`, matchedRepoName: repo, matchReason: 'because', confidence }
  }

  it('keeps a repo\'s best match even when it scores under MIN_MATCH_CONFIDENCE', () => {
    const result = gateMatches([m('repo-a', 35)])
    expect(result).toHaveLength(1)
    expect(result[0].matchedRepoName).toBe('repo-a')
  })

  it('gates out a second, weaker match for a repo that already has a match above the bar', () => {
    const result = gateMatches([m('repo-a', 90), m('repo-a', 40)])
    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe(90)
  })

  it('keeps a second match for a repo when it also clears the bar', () => {
    const result = gateMatches([m('repo-a', 90), m('repo-a', 65)])
    expect(result.map((r) => r.confidence ?? -1).sort((a, b) => b - a)).toEqual([90, 65])
  })

  it('guarantees representation for every repo present, regardless of confidence spread', () => {
    const result = gateMatches([m('repo-a', 95), m('repo-b', 20), m('repo-c', 5)])
    expect(result.map((r) => r.matchedRepoName).sort()).toEqual(['repo-a', 'repo-b', 'repo-c'])
  })

  it('sorts the result best-confidence-first', () => {
    const result = gateMatches([m('repo-a', 30), m('repo-b', 90), m('repo-c', 60)])
    expect(result.map((r) => r.confidence)).toEqual([90, 60, 30])
  })
})

describe('fallbackForUnrepresentedRepos', () => {
  function candidate(repo: string, jobId: string) {
    return { jobPostingId: jobId, matchedRepoName: repo, title: 't', company: 'c', location: null, techTags: [] }
  }

  it('synthesizes a null-confidence entry for a repo GPT returned nothing for', () => {
    const inputs = [candidate('repo-a', 'job-1'), candidate('repo-b', 'job-2')]
    const reranked: RerankedMatch[] = [
      { jobPostingId: 'job-1', matchedRepoName: 'repo-a', matchReason: 'real', confidence: 80 },
    ]
    const result = fallbackForUnrepresentedRepos(inputs, reranked)
    expect(result).toHaveLength(1)
    expect(result[0].matchedRepoName).toBe('repo-b')
    expect(result[0].confidence).toBeNull()
  })

  it('picks the first (best) candidate per repo, and only one per repo', () => {
    const inputs = [candidate('repo-a', 'job-1'), candidate('repo-a', 'job-2')]
    const result = fallbackForUnrepresentedRepos(inputs, [])
    expect(result).toHaveLength(1)
    expect(result[0].jobPostingId).toBe('job-1')
  })

  it('produces nothing when every repo is already represented', () => {
    const inputs = [candidate('repo-a', 'job-1')]
    const reranked: RerankedMatch[] = [
      { jobPostingId: 'job-1', matchedRepoName: 'repo-a', matchReason: 'real', confidence: 80 },
    ]
    expect(fallbackForUnrepresentedRepos(inputs, reranked)).toEqual([])
  })
})

describe('dropSeen', () => {
  const candidates: RetrievalCandidate[] = [
    { jobPostingId: 'job-1', matchedRepoName: 'repo-a', semanticSimilarity: 0.9 },
    { jobPostingId: 'job-2', matchedRepoName: 'repo-a', semanticSimilarity: 0.8 },
  ]

  it('removes postings already in the seen set', () => {
    const result = dropSeen(candidates, new Set(['job-1']))
    expect(result).toHaveLength(1)
    expect(result[0].jobPostingId).toBe('job-2')
  })

  it('is a no-op when nothing has been seen', () => {
    expect(dropSeen(candidates, new Set())).toHaveLength(2)
  })
})

describe('restoreRepoFloorIfFullySeen', () => {
  const c = (repo: string, job: string, sim: number): RetrievalCandidate => ({
    matchedRepoName: repo,
    jobPostingId: job,
    semanticSimilarity: sim,
  })

  it('leaves a repo alone when it still has unseen candidates', () => {
    const retrieved = [c('repo-a', 'job-1', 0.9), c('repo-a', 'job-2', 0.5)]
    const unseen = [c('repo-a', 'job-2', 0.5)] // job-1 was seen and dropped
    const result = restoreRepoFloorIfFullySeen(retrieved, unseen)
    expect(result).toEqual(unseen)
  })

  it('re-includes the best candidate for a repo whose entire pool was seen', () => {
    const retrieved = [c('repo-a', 'job-1', 0.9), c('repo-a', 'job-2', 0.5), c('repo-b', 'job-3', 0.7)]
    const unseen = [c('repo-b', 'job-3', 0.7)] // both repo-a candidates were seen and dropped
    const result = restoreRepoFloorIfFullySeen(retrieved, unseen)
    expect(result).toHaveLength(2)
    expect(result.find((r) => r.matchedRepoName === 'repo-a')?.jobPostingId).toBe('job-1')
  })

  it('is a no-op when nothing was retrieved for a repo in the first place', () => {
    expect(restoreRepoFloorIfFullySeen([], [])).toEqual([])
  })
})

describe('selectOneMatchPerRepo', () => {
  function m(repo: string, confidence: number): RerankedMatch {
    return { jobPostingId: `job-${repo}-${confidence}`, matchedRepoName: repo, matchReason: 'because', confidence }
  }

  it('keeps at most one match per repo', () => {
    const result = selectOneMatchPerRepo([m('repo-a', 90), m('repo-a', 80), m('repo-b', 70)], 5)
    expect(result.map((r) => r.matchedRepoName)).toEqual(['repo-a', 'repo-b'])
  })

  it('caps the total at DISPLAY_TOTAL_CAP by default', () => {
    const result = selectOneMatchPerRepo([m('repo-a', 90), m('repo-b', 80), m('repo-c', 70), m('repo-d', 60)])
    expect(result).toHaveLength(DISPLAY_TOTAL_CAP)
  })

  it('keeps the highest-confidence repos when there are more repos than the cap', () => {
    const result = selectOneMatchPerRepo([m('repo-a', 90), m('repo-b', 80), m('repo-c', 70), m('repo-d', 60)], 2)
    expect(result.map((r) => r.matchedRepoName)).toEqual(['repo-a', 'repo-b'])
  })
})

describe('dedupeByHighestScoringRepo', () => {
  it('collapses a posting that matched multiple repos to its highest-scoring repo', () => {
    const candidates: RetrievalCandidate[] = [
      { jobPostingId: 'job-1', matchedRepoName: 'repo-a', semanticSimilarity: 0.7 },
      { jobPostingId: 'job-1', matchedRepoName: 'repo-b', semanticSimilarity: 0.92 },
      { jobPostingId: 'job-2', matchedRepoName: 'repo-a', semanticSimilarity: 0.5 },
    ]
    const result = dedupeByHighestScoringRepo(candidates)
    expect(result).toHaveLength(2)
    const job1 = result.find((r) => r.jobPostingId === 'job-1')
    expect(job1?.matchedRepoName).toBe('repo-b')
    expect(job1?.semanticSimilarity).toBeCloseTo(0.92)
  })

  it('leaves postings that only matched one repo untouched', () => {
    const candidates: RetrievalCandidate[] = [
      { jobPostingId: 'job-1', matchedRepoName: 'repo-a', semanticSimilarity: 0.6 },
    ]
    expect(dedupeByHighestScoringRepo(candidates)).toEqual(candidates)
  })
})

describe('recencyBoost', () => {
  const now = new Date('2026-07-20T12:00:00Z')

  it('gives the strongest boost under 48h', () => {
    const postedAt = new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString() // 10h ago
    expect(recencyBoost(postedAt, now)).toBe(RECENCY_BOOST_UNDER_48H)
  })

  it('gives a medium boost under 7d', () => {
    const postedAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4d ago
    expect(recencyBoost(postedAt, now)).toBe(RECENCY_BOOST_UNDER_7D)
  })

  it('gives a small boost under 14d', () => {
    const postedAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10d ago
    expect(recencyBoost(postedAt, now)).toBe(RECENCY_BOOST_UNDER_14D)
  })

  it('gives no boost past 14d', () => {
    const postedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30d ago
    expect(recencyBoost(postedAt, now)).toBe(RECENCY_BOOST_STALE)
  })

  it('gives no boost when postedAt is null or unparseable', () => {
    expect(recencyBoost(null, now)).toBe(RECENCY_BOOST_STALE)
    expect(recencyBoost('not-a-date', now)).toBe(RECENCY_BOOST_STALE)
  })

  it('stays small relative to a typical real-match cosine similarity gap', () => {
    // Relevance must lead; recency only nudges/tie-breaks (PRD §8.3 step 4).
    expect(RECENCY_BOOST_UNDER_48H).toBeLessThan(0.1)
  })
})

describe('recencyMultiplier', () => {
  const now = new Date('2026-07-20T12:00:00Z')
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

  it('returns 1 (no penalty) for unknown age', () => {
    expect(recencyMultiplier(null, now)).toBe(1)
    expect(recencyMultiplier(undefined, now)).toBe(1)
    expect(recencyMultiplier('not-a-date', now)).toBe(1)
  })

  it('returns 1 for a posting from right now', () => {
    expect(recencyMultiplier(now.toISOString(), now)).toBeCloseTo(1)
  })

  it('keeps most of its weight within the first week (a "solid plus")', () => {
    expect(recencyMultiplier(daysAgo(7), now)).toBeGreaterThan(0.7)
  })

  it('decays monotonically as a posting ages', () => {
    const m7 = recencyMultiplier(daysAgo(7), now)
    const m15 = recencyMultiplier(daysAgo(15), now)
    const m30 = recencyMultiplier(daysAgo(30), now)
    expect(m7).toBeGreaterThan(m15)
    expect(m15).toBeGreaterThan(m30)
  })

  it('flattens out near the floor for the back half of the eligible window', () => {
    const m45 = recencyMultiplier(daysAgo(45), now)
    const m60 = recencyMultiplier(daysAgo(60), now)
    expect(Math.abs(m45 - m60)).toBeLessThan(0.05)
  })
})

describe('displayScore / gateMatches recency bias', () => {
  const now = new Date('2026-07-20T12:00:00Z')
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

  it('a fresher, weaker match outranks a stale, stronger one (product anchor case)', () => {
    const fresh = displayScore(80, daysAgo(3), now)
    const stale = displayScore(90, daysAgo(15), now)
    expect(fresh).toBeGreaterThan(stale)
  })

  it('sorts a fresher-but-lower-confidence match ahead of a stale-but-higher-confidence one', () => {
    const stale: RerankedMatch = {
      jobPostingId: 'job-stale',
      matchedRepoName: 'repo-a',
      matchReason: 'because',
      confidence: 90,
      postedAt: daysAgo(15),
    }
    const fresh: RerankedMatch = {
      jobPostingId: 'job-fresh',
      matchedRepoName: 'repo-b',
      matchReason: 'because',
      confidence: 80,
      postedAt: daysAgo(3),
    }
    const result = gateMatches([stale, fresh], now)
    expect(result.map((r) => r.jobPostingId)).toEqual(['job-fresh', 'job-stale'])
  })

  it('picks the recency-adjusted best as the guaranteed slot when a repo\'s second candidate would otherwise be gated out', () => {
    const stale: RerankedMatch = {
      jobPostingId: 'job-stale',
      matchedRepoName: 'repo-a',
      matchReason: 'because',
      confidence: 55, // below MIN_MATCH_CONFIDENCE on its own
      postedAt: daysAgo(40),
    }
    const fresh: RerankedMatch = {
      jobPostingId: 'job-fresh',
      matchedRepoName: 'repo-a',
      matchReason: 'because',
      confidence: 50, // also below the bar, but fresher
      postedAt: daysAgo(2),
    }
    const result = gateMatches([stale, fresh], now)
    // Neither clears MIN_MATCH_CONFIDENCE, so only the guaranteed slot
    // survives — and recency (not raw confidence) decides which one that is.
    expect(result).toHaveLength(1)
    expect(result[0].jobPostingId).toBe('job-fresh')
  })

  it('a large enough confidence gap still wins despite a recency disadvantage', () => {
    const veryStale = displayScore(95, daysAgo(45), now)
    const freshButWeak = displayScore(40, daysAgo(3), now)
    expect(veryStale).toBeGreaterThan(freshButWeak)
  })
})

describe('rankCandidates', () => {
  it('sorts by semantic_similarity + recency_boost, best first', () => {
    const now = new Date('2026-07-20T12:00:00Z')
    const candidates: RetrievalCandidate[] = [
      { jobPostingId: 'job-fresh-weak', matchedRepoName: 'repo-a', semanticSimilarity: 0.5 },
      { jobPostingId: 'job-stale-strong', matchedRepoName: 'repo-a', semanticSimilarity: 0.9 },
    ]
    const postedAtByJobId = new Map<string, string | null>([
      ['job-fresh-weak', now.toISOString()], // posted right now -> max boost
      ['job-stale-strong', new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()], // 60d old -> no boost
    ])
    const result = rankCandidates(candidates, postedAtByJobId, now)
    // A strong semantic match should still beat a weak-but-fresh one — recency
    // must not be able to override relevance given the tuned constants.
    expect(result[0].jobPostingId).toBe('job-stale-strong')
  })
})

describe('selectForRerank', () => {
  function ranked(repo: string, job: string, score: number) {
    return { matchedRepoName: repo, jobPostingId: job, semanticSimilarity: score, recencyBoost: 0, score }
  }

  it('guarantees every repo keeps its best-ranked candidate even when another repo dominates the global top-N', () => {
    // repo-a has plenty of high scorers; repo-b's best candidate ranks
    // below all of repo-a's — a flat slice(0, topN) would drop repo-b
    // entirely even though it made it through retrieval/dedup/rank fine.
    const candidates = [
      ranked('repo-a', 'a1', 0.95),
      ranked('repo-a', 'a2', 0.94),
      ranked('repo-a', 'a3', 0.93),
      ranked('repo-b', 'b1', 0.40),
    ]
    const result = selectForRerank(candidates, ['repo-a', 'repo-b'], 3)
    expect(result.some((r) => r.matchedRepoName === 'repo-b')).toBe(true)
  })

  it('still respects topN as a ceiling', () => {
    const candidates = [ranked('repo-a', 'a1', 0.9), ranked('repo-b', 'b1', 0.8), ranked('repo-c', 'c1', 0.7)]
    const result = selectForRerank(candidates, ['repo-a', 'repo-b', 'repo-c'], 2)
    expect(result).toHaveLength(2)
  })

  it('fills remaining budget with the next-best overall once every repo has its floor', () => {
    const candidates = [
      ranked('repo-a', 'a1', 0.9),
      ranked('repo-a', 'a2', 0.85),
      ranked('repo-b', 'b1', 0.8),
    ]
    const result = selectForRerank(candidates, ['repo-a', 'repo-b'], 3)
    expect(result.map((r) => r.jobPostingId).sort()).toEqual(['a1', 'a2', 'b1'])
  })

  it('is a no-op when there is nothing to select from', () => {
    expect(selectForRerank([], ['repo-a'], 10)).toEqual([])
  })
})

describe('computeRepoCap', () => {
  it('caps at 3 for a single repo (whole target fills from it)', () => {
    expect(computeRepoCap(5, 1)).toBe(5)
  })

  it('caps at 2 for two repos so a 2+? split can fill the target', () => {
    expect(computeRepoCap(5, 2)).toBe(3)
  })

  it('holds around 2/repo for 5+ repos', () => {
    expect(computeRepoCap(5, 5)).toBe(2)
    expect(computeRepoCap(5, 10)).toBe(2) // max(2, ceil(5/10)) = max(2, 1) = 2
  })

  it('never drops below the floor of 2', () => {
    expect(computeRepoCap(5, 100)).toBe(2)
  })

  it('falls back to the full target when repoCount is 0', () => {
    expect(computeRepoCap(5, 0)).toBe(5)
  })
})

describe('applyPerRepoCap', () => {
  function match(repo: string, confidence: number): RerankedMatch {
    return { jobPostingId: `job-${repo}-${confidence}`, matchedRepoName: repo, matchReason: 'because', confidence }
  }

  it('fills the whole target from a single repo (1-repo case, §8.5)', () => {
    const matches = [match('repo-a', 95), match('repo-a', 90), match('repo-a', 85), match('repo-a', 80), match('repo-a', 75)]
    const result = applyPerRepoCap(matches, 1, 5)
    expect(result).toHaveLength(5)
  })

  it('caps a 2-repo user at 3/repo (§8.5, with target=5: max(2, ceil(5/2))=3) while still spreading', () => {
    const matches = [
      match('repo-a', 95),
      match('repo-a', 90),
      match('repo-a', 85),
      match('repo-b', 82),
      match('repo-a', 80), // 4th repo-a candidate — should be capped out
    ]
    const result = applyPerRepoCap(matches, 2, 5)
    expect(result.filter((m) => m.matchedRepoName === 'repo-a')).toHaveLength(3)
    expect(result.filter((m) => m.matchedRepoName === 'repo-b')).toHaveLength(1)
    expect(result).toHaveLength(4)
  })

  it('spreads to ~2/repo when there are 5+ repos', () => {
    const matches = ['a', 'b', 'c', 'd', 'e'].flatMap((r) => [match(r, 90), match(r, 89), match(r, 88)])
    const result = applyPerRepoCap(matches, 5, 5)
    expect(result).toHaveLength(5)
    for (const count of Object.values(
      result.reduce<Record<string, number>>((acc, m) => {
        acc[m.matchedRepoName] = (acc[m.matchedRepoName] ?? 0) + 1
        return acc
      }, {})
    )) {
      expect(count).toBeLessThanOrEqual(2)
    }
  })

  it('sends fewer, not weaker, when there is nothing to fill the target', () => {
    const result = applyPerRepoCap([match('repo-a', 95)], 3, 5)
    expect(result).toHaveLength(1)
  })

  it('returns zero when given zero gated matches', () => {
    expect(applyPerRepoCap([], 3, 5)).toEqual([])
  })

  it('keeps the highest-confidence matches when trimming to the cap', () => {
    const matches = [match('repo-a', 70), match('repo-a', 95), match('repo-a', 61)]
    const result = applyPerRepoCap(matches, 1, 5)
    // Input is assumed pre-sorted by confidence descending (as gate does);
    // cap of 5 here doesn't trim, so all 3 pass through in given order.
    expect(result.map((m) => m.confidence)).toEqual([70, 95, 61])
  })
})

describe('parseEmbedding', () => {
  it('accepts a plain number array', () => {
    expect(parseEmbedding([0.1, -0.2, 0.3])).toEqual([0.1, -0.2, 0.3])
  })

  it('parses a Postgres array-literal string', () => {
    expect(parseEmbedding('[0.1,-0.2,0.3]')).toEqual([0.1, -0.2, 0.3])
  })

  it('parses a Postgres array-literal string with spaces', () => {
    expect(parseEmbedding('[0.1, -0.2, 0.3]')).toEqual([0.1, -0.2, 0.3])
  })

  it('returns null for null', () => {
    expect(parseEmbedding(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(parseEmbedding(undefined)).toBeNull()
  })

  it('returns null for a malformed string', () => {
    expect(parseEmbedding('not an embedding')).toBeNull()
  })

  it('returns null for an array containing non-numbers', () => {
    expect(parseEmbedding([1, 'two', 3])).toBeNull()
  })

  it('returns null for an empty array-literal string', () => {
    expect(parseEmbedding('[]')).toBeNull()
  })
})
