import { NextResponse } from 'next/server'
import { formatReposScoredLabel, getReposAnalyzedCount } from '@/lib/repo-stats'

export async function GET() {
  const count = await getReposAnalyzedCount()
  const label = formatReposScoredLabel(count)

  return NextResponse.json(
    { count, label },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
