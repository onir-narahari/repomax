import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Returns null when Upstash env vars are not set (local dev)
function createLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
  })
}

const limiter = createLimiter()

export async function checkRateLimit(identifier: string): Promise<{ limited: boolean }> {
  if (!limiter) return { limited: false }
  const result = await limiter.limit(identifier)
  return { limited: !result.success }
}
