import { parseSearchQuery } from '@/lib/anime-query'
import { searchAnime } from '@/lib/anime-sources'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const result = await searchAnime(parseSearchQuery(url.searchParams))

  return Response.json(result, {
    headers: {
      'cache-control': 'public, max-age=60, stale-while-revalidate=1800',
    },
  })
}
