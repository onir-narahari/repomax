import { describe, expect, it } from 'vitest'
import { chunk } from '../batch'

describe('chunk', () => {
  it('splits items into consecutive chunks of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns a single chunk when size is larger than the input', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]])
  })

  it('returns one chunk per item when size is 1', () => {
    expect(chunk(['a', 'b', 'c'], 1)).toEqual([['a'], ['b'], ['c']])
  })

  it('returns an empty array for empty input', () => {
    expect(chunk([], 5)).toEqual([])
  })

  it('preserves order within and across chunks', () => {
    const items = Array.from({ length: 23 }, (_, i) => i)
    const result = chunk(items, 5)
    expect(result).toHaveLength(5)
    expect(result.flat()).toEqual(items)
    expect(result[result.length - 1]).toEqual([20, 21, 22])
  })

  it('treats a non-positive size as "no chunking limit" (single chunk)', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([[1, 2, 3]])
    expect(chunk([1, 2, 3], -5)).toEqual([[1, 2, 3]])
    expect(chunk([], 0)).toEqual([])
  })
})
