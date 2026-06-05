import { Redis } from '@upstash/redis'

const COUNTER_KEY = 'repomax:repos_analyzed'

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return Redis.fromEnv()
}

function baselineCount(): number {
  const raw = process.env.REPOS_ANALYZED_BASE
  if (!raw) return 0
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export async function incrementReposAnalyzed(): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.incr(COUNTER_KEY)
}

export async function getReposAnalyzedCount(): Promise<number> {
  const base = baselineCount()
  const redis = getRedis()
  if (!redis) return base

  const value = await redis.get<number>(COUNTER_KEY)
  const increment = typeof value === 'number' ? value : 0
  return base + increment
}

/** Snappy, honest label for social proof. Buckets at 100+ like "100+ repos scored". */
export function formatReposScoredLabel(count: number): string | null {
  if (count <= 0) return null
  if (count === 1) return '1 repo scored'
  if (count >= 100) {
    const bucket = Math.floor(count / 100) * 100
    return `${bucket.toLocaleString()}+ repos scored`
  }
  return `${count.toLocaleString()} repos scored`
}
