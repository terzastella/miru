import { isValidDetailId } from '@/lib/anime-query'
import { getAnimeDetail } from '@/lib/anime-sources'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  if (!isValidDetailId(decoded)) {
    return Response.json({ error: 'invalid_id' }, { status: 400 })
  }

  const result = await getAnimeDetail(decoded)

  if (!result.anime) {
    return Response.json(result, { status: 503 })
  }

  return Response.json(result, {
    headers: {
      'cache-control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  })
}
