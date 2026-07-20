import { describe, expect, it } from 'vitest'
import { selectCandidateRepos, MAX_CANDIDATE_REPOS } from '../job-matching'
import type { GitHubUserRepo } from '@/types'

const NOW = Date.parse('2024-06-01T00:00:00Z')

function makeRepo(overrides: Partial<GitHubUserRepo> & { name: string }): GitHubUserRepo {
  return {
    name: overrides.name,
    htmlUrl: `https://github.com/testuser/${overrides.name}`,
    language: overrides.language ?? 'TypeScript',
    stars: overrides.stars ?? 0,
    updatedAt: overrides.updatedAt ?? '2024-05-01T00:00:00Z',
    size: overrides.size ?? 500,
    description: overrides.description ?? null,
    topics: overrides.topics ?? [],
  }
}

describe('selectCandidateRepos', () => {
  it('returns every repo, unscored, when usable repos are at or below the target', () => {
    const repos = [makeRepo({ name: 'a' }), makeRepo({ name: 'b' }), makeRepo({ name: 'c' })]
    expect(selectCandidateRepos(repos, [], NOW)).toEqual(repos)
  })

  it('returns all repos when count exactly equals the target', () => {
    const repos = Array.from({ length: MAX_CANDIDATE_REPOS }, (_, i) => makeRepo({ name: `repo-${i}` }))
    expect(selectCandidateRepos(repos, [], NOW)).toEqual(repos)
  })

  it('never returns an empty set when usable repos exist, even if input is empty', () => {
    expect(selectCandidateRepos([], [], NOW)).toEqual([])
  })

  it('uses pinned repos first, in pin order, when there are more usable repos than the target', () => {
    const repos = [
      ...Array.from({ length: MAX_CANDIDATE_REPOS + 3 }, (_, i) => makeRepo({ name: `repo-${i}`, size: 100 })),
      makeRepo({ name: 'pinned-a', size: 10 }),
      makeRepo({ name: 'pinned-b', size: 10 }),
    ]

    const result = selectCandidateRepos(repos, ['pinned-b', 'pinned-a'], NOW)

    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
    expect(result[0].name).toBe('pinned-b')
    expect(result[1].name).toBe('pinned-a')
  })

  it('caps pinned repos at the target and ignores composite scoring once pins fill every slot', () => {
    const pinnedNames = Array.from({ length: MAX_CANDIDATE_REPOS + 2 }, (_, i) => `pinned-${i}`)
    const repos = [
      ...pinnedNames.map((name) => makeRepo({ name, size: 10 })),
      makeRepo({ name: 'unpinned-strong', description: 'great repo', topics: ['a', 'b', 'c'], size: 100000 }),
    ]

    const result = selectCandidateRepos(repos, pinnedNames, NOW)

    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
    expect(result.map((r) => r.name)).toEqual(pinnedNames.slice(0, MAX_CANDIDATE_REPOS))
  })

  it('ignores a pinned name that is not in the usable repo list', () => {
    const repos = Array.from({ length: MAX_CANDIDATE_REPOS + 2 }, (_, i) => makeRepo({ name: `repo-${i}` }))
    const result = selectCandidateRepos(repos, ['does-not-exist'], NOW)
    expect(result.map((r) => r.name)).not.toContain('does-not-exist')
    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
  })

  it('fills remaining slots by composite score: description, topics, and size beat a bare repo', () => {
    const strong = makeRepo({
      name: 'strong',
      description: 'A real project with a real description',
      topics: ['web', 'nextjs', 'postgres'],
      size: 50000,
    })
    const bare = makeRepo({ name: 'bare', size: 20 })
    const repos = [
      strong,
      bare,
      ...Array.from({ length: MAX_CANDIDATE_REPOS }, (_, i) => makeRepo({ name: `filler-${i}`, size: 30, language: 'Go' })),
    ]

    const result = selectCandidateRepos(repos, [], NOW)
    const names = result.map((r) => r.name)
    expect(names).toContain('strong')
    expect(names).not.toContain('bare')
  })

  it('strongly penalizes coursework/tutorial-style names', () => {
    const repos = [
      makeRepo({ name: 'cs101-hw3', size: 5000, description: 'homework', topics: ['school'] }),
      makeRepo({ name: 'react-tutorial-clone', size: 5000 }),
      makeRepo({ name: 'dotfiles' }),
      makeRepo({ name: '.dotfiles-repo' }),
      makeRepo({ name: 'learn-rust' }),
      ...Array.from({ length: MAX_CANDIDATE_REPOS }, (_, i) =>
        makeRepo({ name: `real-project-${i}`, description: 'a real project', topics: ['x'], size: 8000 })
      ),
    ]

    const result = selectCandidateRepos(repos, [], NOW)
    const names = result.map((r) => r.name)
    expect(names).not.toContain('cs101-hw3')
    expect(names).not.toContain('react-tutorial-clone')
    expect(names).not.toContain('learn-rust')
    expect(names).not.toContain('dotfiles')
    expect(names).not.toContain('.dotfiles-repo')
    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
  })

  it('still returns the top ~5 when every candidate is penalized, never an empty set', () => {
    const repos = Array.from({ length: MAX_CANDIDATE_REPOS + 3 }, (_, i) => makeRepo({ name: `cs101-hw${i}` }))
    const result = selectCandidateRepos(repos, [], NOW)
    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
    expect(result.length).toBeGreaterThan(0)
  })

  it('breaks close scores toward tech/language diversity instead of picking the same stack repeatedly', () => {
    // Six near-identical TypeScript repos plus one slightly-lower-scoring
    // Python repo — a diversity-blind picker would fill every slot with
    // TypeScript repos since they all score marginally higher.
    const tsRepos = Array.from({ length: 6 }, (_, i) =>
      makeRepo({ name: `ts-${i}`, language: 'TypeScript', description: 'a web app', topics: ['web'], size: 1000 })
    )
    const pyRepo = makeRepo({ name: 'py-1', language: 'Python', description: 'an ml project', topics: ['ml'], size: 900 })

    const result = selectCandidateRepos([...tsRepos, pyRepo], [], NOW)

    expect(result).toHaveLength(MAX_CANDIDATE_REPOS)
    expect(result.map((r) => r.name)).toContain('py-1')
  })

  it('uses recency as a tiebreaker between otherwise-similar repos', () => {
    const older = makeRepo({ name: 'older', updatedAt: '2020-01-01T00:00:00Z' })
    const newer = makeRepo({ name: 'newer', updatedAt: '2024-05-30T00:00:00Z' })
    const filler = Array.from({ length: MAX_CANDIDATE_REPOS }, (_, i) => makeRepo({ name: `filler-${i}`, language: 'Go' }))

    const result = selectCandidateRepos([older, newer, ...filler], [], NOW)
    const names = result.map((r) => r.name)
    // Both can't fit (target slots are full of fillers + one of these), so
    // the more recently updated of the pair should win the remaining slot.
    expect(names).toContain('newer')
  })
})
