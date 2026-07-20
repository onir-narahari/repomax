// Small, dependency-free batching helper for bounded-concurrency loops (see
// docs/prd-job-matching.md §16 — "process users in batches with bounded
// concurrency" for the 8am match cron). Kept as a pure function so it's
// unit-testable independent of the DB/network loop that uses it (same
// pattern as lib/job-matching.ts's selectCandidateRepos / lib/matching-engine.ts's
// pure funnel functions).

// Splits `items` into consecutive chunks of at most `size` items each. The
// last chunk may be smaller. Order is preserved. A `size` of 0 or negative
// is treated as "no chunking limit" (single chunk) rather than throwing or
// infinite-looping.
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return items.length === 0 ? [] : [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
