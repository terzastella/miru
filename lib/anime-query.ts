import type { SearchQuery } from './anime-sources'

const ALLOWED_SORTS = new Set(['score', 'popularity', 'newest', 'title'])

/** Gli id arrivano dal client come `sorgente:id` (es. `jikan:5114`). */
export const DETAIL_ID_PATTERN = /^(jikan|anilist|kitsu):[a-zA-Z0-9-]{1,20}$/

export function isValidDetailId(id: string) {
  return DETAIL_ID_PATTERN.test(id)
}

function num(value: string | null, min: number, max: number) {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.min(max, Math.max(min, parsed))
}

/**
 * Traduce i query param in `SearchQuery`. Usato sia dalla route handler web
 * sia dal client desktop, così la validazione resta una sola.
 */
export function parseSearchQuery(params: URLSearchParams): SearchQuery {
  const sortParam = params.get('sort')

  return {
    q: params.get('q')?.slice(0, 120) || undefined,
    type: params.get('type') || undefined,
    airing: params.get('airing') || undefined,
    genres:
      params
        .get('genres')
        ?.split(',')
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 8) ?? undefined,
    minScore: num(params.get('minScore'), 0, 10),
    yearFrom: num(params.get('yearFrom'), 1917, 2100),
    yearTo: num(params.get('yearTo'), 1917, 2100),
    episodesMin: num(params.get('episodesMin'), 0, 5000),
    episodesMax: num(params.get('episodesMax'), 1, 5000),
    studio: params.get('studio')?.slice(0, 60) || undefined,
    sort:
      sortParam && ALLOWED_SORTS.has(sortParam)
        ? (sortParam as SearchQuery['sort'])
        : undefined,
    page: num(params.get('page'), 1, 50) ?? 1,
  }
}
