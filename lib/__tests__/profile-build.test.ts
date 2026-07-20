import { describe, expect, it } from 'vitest'
import { diffProfileRepos, resolveConfirmedRepos, repoFullName } from '../profile-build'
import type { GitHubUserRepo } from '@/types'

function makeRepo(overrides: Partial<GitHubUserRepo> & { name: string }): GitHubUserRepo {
  return {
    name: overrides.name,
    htmlUrl: overrides.htmlUrl ?? `https://github.com/testuser/${overrides.name}`,
    language: overrides.language ?? 'TypeScript',
    stars: overrides.stars ?? 0,
    updatedAt: overrides.updatedAt ?? '2024-05-01T00:00:00Z',
    size: overrides.size ?? 500,
  }
}

describe('diffProfileRepos', () => {
  it('puts a confirmed repo with no existing row in toBuild', () => {
    const result = diffProfileRepos(['a/repo1'], [])
    expect(result).toEqual({ toBuild: ['a/repo1'], toDelete: [], toKeep: [] })
  })

  it('puts an existing row no longer confirmed in toDelete', () => {
    const result = diffProfileRepos([], ['a/repo1'])
    expect(result).toEqual({ toBuild: [], toDelete: ['a/repo1'], toKeep: [] })
  })

  it('puts a repo confirmed and already existing in toKeep, not toBuild', () => {
    const result = diffProfileRepos(['a/repo1'], ['a/repo1'])
    expect(result).toEqual({ toBuild: [], toDelete: [], toKeep: ['a/repo1'] })
  })

  it('correctly splits a mixed edit: one new, one dropped, one unchanged', () => {
    const confirmed = ['a/keep', 'a/new']
    const existing = ['a/keep', 'a/dropped']
    const result = diffProfileRepos(confirmed, existing)
    expect(result.toBuild).toEqual(['a/new'])
    expect(result.toDelete).toEqual(['a/dropped'])
    expect(result.toKeep).toEqual(['a/keep'])
  })

  it('dropping to zero confirmed repos deletes everything and builds/keeps nothing', () => {
    const result = diffProfileRepos([], ['a/repo1', 'a/repo2'])
    expect(result).toEqual({ toBuild: [], toDelete: ['a/repo1', 'a/repo2'], toKeep: [] })
  })

  it('is a no-op (nothing to build/delete) when confirmed exactly matches existing', () => {
    const result = diffProfileRepos(['a/repo1', 'a/repo2'], ['a/repo1', 'a/repo2'])
    expect(result.toBuild).toEqual([])
    expect(result.toDelete).toEqual([])
    expect(result.toKeep).toEqual(['a/repo1', 'a/repo2'])
  })

  it('handles both empty (no committed repos, nothing confirmed)', () => {
    expect(diffProfileRepos([], [])).toEqual({ toBuild: [], toDelete: [], toKeep: [] })
  })
})

describe('resolveConfirmedRepos', () => {
  const freshRepos = [makeRepo({ name: 'repo-a' }), makeRepo({ name: 'repo-b' })]

  it('resolves confirmed names that exist in the fresh fetch', () => {
    const { confirmed, skipped } = resolveConfirmedRepos(['repo-a', 'repo-b'], freshRepos)
    expect(confirmed.map((r) => r.name).sort()).toEqual(['repo-a', 'repo-b'])
    expect(skipped).toEqual([])
  })

  it('skips a missing/renamed repo gracefully instead of erroring', () => {
    const { confirmed, skipped } = resolveConfirmedRepos(['repo-a', 'repo-deleted'], freshRepos)
    expect(confirmed.map((r) => r.name)).toEqual(['repo-a'])
    expect(skipped).toEqual(['repo-deleted'])
  })

  it('returns empty confirmed set for an empty request (dropping to 0 repos)', () => {
    const { confirmed, skipped } = resolveConfirmedRepos([], freshRepos)
    expect(confirmed).toEqual([])
    expect(skipped).toEqual([])
  })

  it('dedupes a duplicate name in the request to a single confirmed repo', () => {
    const { confirmed, skipped } = resolveConfirmedRepos(['repo-a', 'repo-a'], freshRepos)
    expect(confirmed).toHaveLength(1)
    expect(confirmed[0].name).toBe('repo-a')
    expect(skipped).toEqual([])
  })

  it('all-missing input skips everything and confirms nothing', () => {
    const { confirmed, skipped } = resolveConfirmedRepos(['ghost-1', 'ghost-2'], freshRepos)
    expect(confirmed).toEqual([])
    expect(skipped.sort()).toEqual(['ghost-1', 'ghost-2'])
  })
})

describe('repoFullName', () => {
  it('derives owner/repo from a normal GitHub htmlUrl', () => {
    const repo = makeRepo({ name: 'my-project', htmlUrl: 'https://github.com/onir-narahari/my-project' })
    expect(repoFullName(repo)).toBe('onir-narahari/my-project')
  })

  it('returns null for an unparseable htmlUrl instead of throwing', () => {
    const repo = makeRepo({ name: 'weird', htmlUrl: 'not-a-github-url' })
    expect(repoFullName(repo)).toBeNull()
  })
})
