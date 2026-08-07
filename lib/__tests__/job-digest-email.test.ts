import { describe, expect, it } from 'vitest'
import { buildSubject, escapeHtml, renderDigestHtml, renderDigestText, type DigestJob } from '../job-digest-email'

function job(overrides: Partial<DigestJob> = {}): DigestJob {
  return {
    title: 'Backend Engineer, Intern',
    company: 'Stripe',
    location: 'San Francisco, CA',
    reason: 'builds on the same Postgres + pgvector stack',
    url: 'https://example.com/jobs/1',
    repoName: 'semantic-search',
    confidence: 82,
    ...overrides,
  }
}

const base = { unsubscribeUrl: 'https://tryrepomax.com/api/email/unsubscribe?token=abc', appUrl: 'https://tryrepomax.com' }

describe('buildSubject', () => {
  it('names the companies so the inbox preview is specific', () => {
    const jobs = [job({ company: 'Stripe' }), job({ company: 'Ramp' }), job({ company: 'Vercel' })]
    expect(buildSubject(jobs)).toBe('3 matches today: Stripe, Ramp, Vercel')
  })

  it('uses the singular noun for one match', () => {
    expect(buildSubject([job({ company: 'Stripe' })])).toBe('1 match today: Stripe')
  })

  it('dedupes repeated companies', () => {
    const jobs = [job({ company: 'Stripe' }), job({ company: 'Stripe' })]
    expect(buildSubject(jobs)).toBe('2 matches today: Stripe')
  })

  it('truncates to two companies plus a count past three', () => {
    const jobs = [
      job({ company: 'Stripe' }),
      job({ company: 'Ramp' }),
      job({ company: 'Vercel' }),
      job({ company: 'Linear' }),
    ]
    expect(buildSubject(jobs)).toBe('4 matches today: Stripe, Ramp + 2 more')
  })
})

describe('escapeHtml', () => {
  it('neutralizes markup in feed- and LLM-sourced text', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })
})

describe('renderDigestHtml', () => {
  it('includes the role, company, matched repo, reason, and apply URL', () => {
    const html = renderDigestHtml({ jobs: [job()], ...base })
    expect(html).toContain('Backend Engineer, Intern')
    expect(html).toContain('Stripe · San Francisco, CA')
    expect(html).toContain('Matched to semantic-search')
    expect(html).toContain('builds on the same Postgres + pgvector stack')
    expect(html).toContain('https://example.com/jobs/1')
  })

  it('shows the confidence score when the rerank produced one', () => {
    expect(renderDigestHtml({ jobs: [job({ confidence: 82 })], ...base })).toContain('82% match')
  })

  it('shows no score at all for fallback matches rather than inventing one', () => {
    expect(renderDigestHtml({ jobs: [job({ confidence: null })], ...base })).not.toContain('% match')
  })

  it('omits the location separator when the posting has no location', () => {
    const html = renderDigestHtml({ jobs: [job({ location: null })], ...base })
    expect(html).toContain('Stripe')
    expect(html).not.toContain('Stripe ·')
  })

  it('escapes injected markup from job titles and reasons', () => {
    const html = renderDigestHtml({ jobs: [job({ title: '<img src=x onerror=alert(1)>' })], ...base })
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x')
  })

  it('always carries the unsubscribe link', () => {
    expect(renderDigestHtml({ jobs: [job()], ...base })).toContain(base.unsubscribeUrl)
  })
})

describe('renderDigestText', () => {
  it('numbers the jobs and carries the same substance as the HTML', () => {
    const text = renderDigestText({ jobs: [job(), job({ title: 'ML Intern', company: 'Ramp' })], ...base })
    expect(text).toContain('1. Backend Engineer, Intern (82% match)')
    expect(text).toContain('2. ML Intern (82% match)')
    expect(text).toContain('Matched to your semantic-search repo')
    expect(text).toContain(base.unsubscribeUrl)
  })

  it('leaves the score out for fallback matches', () => {
    const text = renderDigestText({ jobs: [job({ confidence: null })], ...base })
    expect(text).toContain('1. Backend Engineer, Intern')
    expect(text).not.toContain('% match')
  })
})
