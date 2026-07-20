import { describe, expect, it } from 'vitest'
import { deriveTechTags } from '../job-postings'

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
