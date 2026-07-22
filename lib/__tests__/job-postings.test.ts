import { describe, expect, it } from 'vitest'
import { deriveTechTags, fullPostingText, isGradOnlyPosting, postingContentChanged, postingKey } from '../job-postings'
import type { JobPosting } from '@/types'

describe('deriveTechTags', () => {
  it('detects known keywords case-insensitively', () => {
    expect(deriveTechTags('Software Engineer Intern — Python, Django')).toEqual(
      expect.arrayContaining(['python'])
    )
  })

  it('returns no tags for text with no known keywords', () => {
    expect(deriveTechTags('Business Development Associate')).toEqual([])
  })

  it('can match multiple tags from one string', () => {
    const tags = deriveTechTags('React and Node.js full-stack role using AWS')
    expect(tags).toEqual(expect.arrayContaining(['react', 'javascript', 'aws']))
  })
})

describe('isGradOnlyPosting', () => {
  it('excludes an explicit PhD requirement', () => {
    expect(isGradOnlyPosting('Research Scientist Intern, PhD')).toBe(true)
  })

  it('excludes an MS/PhD combo requirement', () => {
    expect(isGradOnlyPosting('Software Engineer Intern (MS/PhD)')).toBe(true)
  })

  it('excludes a hard Master\'s degree requirement', () => {
    expect(isGradOnlyPosting("Data Science Intern - Master's Degree Required")).toBe(true)
  })

  it('excludes a soft Master\'s-preferred posting too — still a practical waste of an undergrad\'s time', () => {
    expect(isGradOnlyPosting('Software Engineer Intern (Master\'s preferred)')).toBe(true)
    expect(isGradOnlyPosting('Data Science Intern - MS Preferred')).toBe(true)
  })

  it('does not exclude a plain undergrad internship', () => {
    expect(isGradOnlyPosting('Software Engineer Intern')).toBe(false)
  })

  it('does not exclude a posting genuinely open to either level', () => {
    expect(isGradOnlyPosting('Software Engineer Intern (Undergraduate/Graduate)')).toBe(false)
  })
})

describe('postingKey', () => {
  it('joins source and externalId with a colon', () => {
    expect(postingKey({ source: 'simplify:internship', externalId: 'abc123' })).toBe(
      'simplify:internship:abc123'
    )
  })

  it('produces distinct keys for the same externalId under different sources', () => {
    const a = postingKey({ source: 'simplify:internship', externalId: '1' })
    const b = postingKey({ source: 'other-source', externalId: '1' })
    expect(a).not.toBe(b)
  })
})

describe('fullPostingText', () => {
  it('joins title, category, company, and locations into one string', () => {
    const text = fullPostingText({
      id: '1',
      category: 'Software Engineering',
      company_name: 'Acme',
      title: 'SWE Intern',
      active: true,
      url: 'https://example.com',
      locations: ['Austin, TX', 'Remote'],
    })
    expect(text).toBe('SWE Intern Software Engineering Acme Austin, TX Remote')
  })

  it('omits locations entirely when none are given', () => {
    const text = fullPostingText({
      id: '1',
      category: 'Quant',
      company_name: 'Acme',
      title: 'Quant Intern',
      active: true,
      url: 'https://example.com',
    })
    expect(text).toBe('Quant Intern Quant Acme')
  })
})

describe('postingContentChanged', () => {
  const posting: JobPosting = {
    id: '',
    source: 'simplify:internship',
    externalId: 'abc123',
    title: 'SWE Intern',
    company: 'Acme',
    location: 'Austin, TX',
    absoluteUrl: 'https://example.com',
    techTags: ['python', 'aws'],
    postedAt: null,
    isActive: true,
  }

  it('is false when every comparable field matches the stored snapshot', () => {
    expect(
      postingContentChanged(posting, {
        title: 'SWE Intern',
        company: 'Acme',
        location: 'Austin, TX',
        techTags: ['python', 'aws'],
      })
    ).toBe(false)
  })

  it('ignores tech tag ordering', () => {
    expect(
      postingContentChanged(posting, {
        title: 'SWE Intern',
        company: 'Acme',
        location: 'Austin, TX',
        techTags: ['aws', 'python'],
      })
    ).toBe(false)
  })

  it('is true when the title changed upstream', () => {
    expect(
      postingContentChanged(posting, {
        title: 'Senior SWE Intern',
        company: 'Acme',
        location: 'Austin, TX',
        techTags: ['python', 'aws'],
      })
    ).toBe(true)
  })

  it('is true when tech tags changed even with the same length', () => {
    expect(
      postingContentChanged(posting, {
        title: 'SWE Intern',
        company: 'Acme',
        location: 'Austin, TX',
        techTags: ['python', 'go'],
      })
    ).toBe(true)
  })

  it('is true when location changed to/from null', () => {
    expect(
      postingContentChanged(posting, {
        title: 'SWE Intern',
        company: 'Acme',
        location: null,
        techTags: ['python', 'aws'],
      })
    ).toBe(true)
  })
})
