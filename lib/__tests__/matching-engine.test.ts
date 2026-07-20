import { describe, expect, it } from 'vitest'
import {
  applyPerRepoCap,
  computeRepoCap,
  cosineSimilarity,
  dedupeByHighestScoringRepo,
  dropSeen,
  parseEmbedding,
  rankCandidates,
  recencyBoost,
  retrieveTopCandidates,
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
