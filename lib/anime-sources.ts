/**
 * Aggregazione delle sorgenti anime pubbliche (spec §6).
 *
 * Chain: Jikan (primary) -> AniList (fallback 1) -> Kitsu (fallback 2) -> stale cache.
 * Isomorfo: sul web gira nel route handler, nell'app desktop dentro la webview
 * (`lib/anime-api.ts`), così il client non parla mai direttamente con le API.
 */

import type {
  AiringStatus,
  Anime,
  AnimeType,
  EpisodeInfo,
  Season,
  SourceName,
} from './types'
import { netFetch } from './net'

export type SearchQuery = {
  q?: string
  type?: string
  airing?: string
  genres?: string[]
  minScore?: number
  yearFrom?: number
  yearTo?: number
  episodesMin?: number
  episodesMax?: number
  studio?: string
  sort?: 'score' | 'popularity' | 'newest' | 'title'
  page?: number
}

export type SearchResult = {
  items: Anime[]
  hasMore: boolean
  source: SourceName
  stale: boolean
  degraded: boolean
}

/* ------------------------------------------------------------------ cache */

type CacheRecord<T> = { value: T; expiresAt: number }

const TTL_SEARCH = 1000 * 60 * 30 // 30 min
const TTL_DETAIL = 1000 * 60 * 60 * 12 // 12 h
const STALE_KEEP = 1000 * 60 * 60 * 24 * 7 // serve stale up to 7 days

const cache = new Map<string, CacheRecord<unknown>>()

function cacheGet<T>(key: string): { value: T; fresh: boolean } | null {
  const hit = cache.get(key) as CacheRecord<T> | undefined
  if (!hit) return null
  if (hit.expiresAt + STALE_KEEP < Date.now()) {
    cache.delete(key)
    return null
  }
  return { value: hit.value, fresh: hit.expiresAt > Date.now() }
}

function cacheSet<T>(key: string, value: T, ttl: number) {
  if (cache.size > 800) {
    // cheap eviction: drop the oldest quarter
    const keys = [...cache.keys()].slice(0, 200)
    for (const k of keys) cache.delete(k)
  }
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

/* ------------------------------------------------- polite fetch + limiter */

const inflight = new Map<string, Promise<unknown>>()

function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const promise = run().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

const lastCallAt = new Map<string, number>()
const MIN_GAP: Record<string, number> = { jikan: 400, anilist: 250, kitsu: 250 }

async function politeFetch(
  source: keyof typeof MIN_GAP,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const gap = MIN_GAP[source] ?? 300
  const since = Date.now() - (lastCallAt.get(source) ?? 0)
  if (since < gap) await sleep(gap - since)
  lastCallAt.set(source, Date.now())

  let attempt = 0
  // one retry with backoff on 429/5xx, then give up so the fallback chain moves on
  while (attempt < 2) {
    const res = await netFetch(input, {
      ...init,
      headers: { accept: 'application/json', ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(7000),
      cache: 'no-store',
    })
    if (res.status !== 429 && res.status < 500) return res
    attempt += 1
    if (attempt < 2) await sleep(500 * attempt)
    else return res
  }
  throw new Error('unreachable')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ------------------------------------------------------------ normalizers */

function normalizeType(value?: string | null): AnimeType | null {
  if (!value) return null
  const v = value.toLowerCase()
  if (v === 'tv' || v === 'tv_short') return 'TV'
  if (v === 'movie') return 'Movie'
  if (v === 'ova') return 'OVA'
  if (v === 'ona') return 'ONA'
  if (v === 'special') return 'Special'
  if (v === 'music') return 'Music'
  return null
}

function normalizeAiring(value?: string | null): AiringStatus | null {
  if (!value) return null
  const v = value.toLowerCase()
  if (v.includes('currently') || v === 'releasing' || v === 'airing')
    return 'airing'
  if (v.includes('finished') || v === 'complete') return 'complete'
  if (v.includes('not yet') || v === 'not_yet_released' || v === 'upcoming')
    return 'upcoming'
  return null
}

function normalizeSeason(value?: string | null): Season | null {
  if (!value) return null
  const v = value.toLowerCase()
  return v === 'winter' || v === 'spring' || v === 'summer' || v === 'fall'
    ? (v as Season)
    : null
}

function idFor(source: SourceName, sourceId: number | string) {
  return `${source}:${sourceId}`
}

type JikanAnime = {
  mal_id: number
  title: string
  title_english?: string | null
  title_japanese?: string | null
  synopsis?: string | null
  images?: { jpg?: { large_image_url?: string; image_url?: string } }
  trailer?: { images?: { maximum_image_url?: string | null } }
  type?: string | null
  episodes?: number | null
  duration?: string | null
  score?: number | null
  year?: number | null
  season?: string | null
  status?: string | null
  aired?: { from?: string | null }
  genres?: { name: string }[]
  themes?: { name: string }[]
  studios?: { name: string }[]
}

function fromJikan(raw: JikanAnime): Anime {
  const durationMatch = raw.duration?.match(/(\d+)\s*min/)
  return {
    id: idFor('jikan', raw.mal_id),
    malId: raw.mal_id,
    anilistId: null,
    kitsuId: null,
    title: raw.title,
    titleEnglish: raw.title_english ?? null,
    titleJapanese: raw.title_japanese ?? null,
    synopsis: raw.synopsis ?? null,
    imageUrl:
      raw.images?.jpg?.large_image_url ?? raw.images?.jpg?.image_url ?? null,
    bannerUrl: raw.trailer?.images?.maximum_image_url ?? null,
    type: normalizeType(raw.type),
    episodesTotal: raw.episodes ?? null,
    durationMinutes: durationMatch ? Number(durationMatch[1]) : null,
    score: raw.score ?? null,
    year: raw.year ?? (raw.aired?.from ? new Date(raw.aired.from).getUTCFullYear() : null),
    season: normalizeSeason(raw.season),
    airingStatus: normalizeAiring(raw.status),
    nextEpisodeAt: null,
    genres: [
      ...(raw.genres ?? []).map((g) => g.name),
      ...(raw.themes ?? []).map((g) => g.name),
    ],
    studios: (raw.studios ?? []).map((s) => s.name),
    source: 'jikan',
  }
}

type AniListMedia = {
  id: number
  idMal: number | null
  title: { romaji: string | null; english: string | null; native: string | null }
  description: string | null
  coverImage: { extraLarge: string | null; large: string | null } | null
  bannerImage: string | null
  format: string | null
  episodes: number | null
  duration: number | null
  averageScore: number | null
  seasonYear: number | null
  season: string | null
  status: string | null
  nextAiringEpisode: { airingAt: number } | null
  genres: string[]
  studios: { nodes: { name: string }[] } | null
}

function fromAniList(raw: AniListMedia): Anime {
  return {
    id: raw.idMal ? idFor('jikan', raw.idMal) : idFor('anilist', raw.id),
    malId: raw.idMal ?? null,
    anilistId: raw.id,
    kitsuId: null,
    title: raw.title.romaji ?? raw.title.english ?? raw.title.native ?? '—',
    titleEnglish: raw.title.english ?? null,
    titleJapanese: raw.title.native ?? null,
    synopsis: raw.description
      ? raw.description.replace(/<[^>]*>/g, '').trim()
      : null,
    imageUrl: raw.coverImage?.extraLarge ?? raw.coverImage?.large ?? null,
    bannerUrl: raw.bannerImage ?? null,
    type: normalizeType(raw.format),
    episodesTotal: raw.episodes ?? null,
    durationMinutes: raw.duration ?? null,
    score: raw.averageScore != null ? raw.averageScore / 10 : null,
    year: raw.seasonYear ?? null,
    season: normalizeSeason(raw.season),
    airingStatus: normalizeAiring(raw.status),
    nextEpisodeAt: raw.nextAiringEpisode
      ? new Date(raw.nextAiringEpisode.airingAt * 1000).toISOString()
      : null,
    genres: raw.genres ?? [],
    studios: raw.studios?.nodes?.map((n) => n.name) ?? [],
    source: 'anilist',
  }
}

type KitsuAnime = {
  id: string
  attributes: {
    canonicalTitle: string
    titles?: { en?: string; en_jp?: string; ja_jp?: string }
    synopsis?: string | null
    posterImage?: { large?: string; medium?: string } | null
    coverImage?: { large?: string } | null
    subtype?: string | null
    episodeCount?: number | null
    episodeLength?: number | null
    averageRating?: string | null
    startDate?: string | null
    status?: string | null
  }
}

function fromKitsu(raw: KitsuAnime): Anime {
  const a = raw.attributes
  return {
    id: idFor('kitsu', raw.id),
    malId: null,
    anilistId: null,
    kitsuId: Number(raw.id),
    title: a.titles?.en_jp ?? a.canonicalTitle,
    titleEnglish: a.titles?.en ?? null,
    titleJapanese: a.titles?.ja_jp ?? null,
    synopsis: a.synopsis ?? null,
    imageUrl: a.posterImage?.large ?? a.posterImage?.medium ?? null,
    bannerUrl: a.coverImage?.large ?? null,
    type: normalizeType(a.subtype),
    episodesTotal: a.episodeCount ?? null,
    durationMinutes: a.episodeLength ?? null,
    score: a.averageRating ? Number(a.averageRating) / 10 : null,
    year: a.startDate ? new Date(a.startDate).getUTCFullYear() : null,
    season: null,
    airingStatus: normalizeAiring(a.status),
    nextEpisodeAt: null,
    genres: [],
    studios: [],
    source: 'kitsu',
  }
}

/* --------------------------------------------------------------- genre ids */

let genreMap: Map<string, number> | null = null

async function jikanGenreIds(names: string[]): Promise<string | undefined> {
  if (names.length === 0) return undefined
  if (!genreMap) {
    try {
      const res = await politeFetch('jikan', 'https://api.jikan.moe/v4/genres/anime')
      if (res.ok) {
        const json = (await res.json()) as { data: { mal_id: number; name: string }[] }
        genreMap = new Map(json.data.map((g) => [g.name.toLowerCase(), g.mal_id]))
      }
    } catch {
      genreMap = null
    }
  }
  if (!genreMap) return undefined
  const ids = names
    .map((n) => genreMap?.get(n.toLowerCase()))
    .filter((id): id is number => typeof id === 'number')
  return ids.length ? ids.join(',') : undefined
}

/* ------------------------------------------------------- post-filter/sort */

export function applyLocalFilters(items: Anime[], query: SearchQuery): Anime[] {
  return items.filter((item) => {
    if (query.episodesMin && (item.episodesTotal ?? 0) < query.episodesMin)
      return false
    if (
      query.episodesMax &&
      item.episodesTotal != null &&
      item.episodesTotal > query.episodesMax
    )
      return false
    if (query.yearFrom && (item.year ?? 0) < query.yearFrom) return false
    if (query.yearTo && item.year != null && item.year > query.yearTo) return false
    if (query.minScore && (item.score ?? 0) < query.minScore) return false
    if (query.studio) {
      const needle = query.studio.toLowerCase()
      if (!item.studios.some((s) => s.toLowerCase().includes(needle))) return false
    }
    if (query.genres?.length) {
      const wanted = query.genres.map((g) => g.toLowerCase())
      const owned = item.genres.map((g) => g.toLowerCase())
      if (!wanted.every((g) => owned.includes(g))) return false
    }
    return true
  })
}

/* ---------------------------------------------------------------- sources */

async function searchJikan(query: SearchQuery): Promise<Anime[]> {
  const params = new URLSearchParams({
    limit: '24',
    page: String(query.page ?? 1),
    sfw: 'true',
  })
  if (query.q) params.set('q', query.q)
  if (query.type) params.set('type', query.type.toLowerCase())
  if (query.airing) params.set('status', jikanStatus(query.airing))
  if (query.minScore) params.set('min_score', String(query.minScore))
  if (query.yearFrom) params.set('start_date', `${query.yearFrom}-01-01`)
  if (query.yearTo) params.set('end_date', `${query.yearTo}-12-31`)
  const genres = await jikanGenreIds(query.genres ?? [])
  if (genres) params.set('genres', genres)
  if (query.sort === 'score') {
    params.set('order_by', 'score')
    params.set('sort', 'desc')
  } else if (query.sort === 'popularity') {
    params.set('order_by', 'members')
    params.set('sort', 'desc')
  } else if (query.sort === 'newest') {
    params.set('order_by', 'start_date')
    params.set('sort', 'desc')
  } else if (query.sort === 'title') {
    params.set('order_by', 'title')
    params.set('sort', 'asc')
  }

  const res = await politeFetch('jikan', `https://api.jikan.moe/v4/anime?${params}`)
  if (!res.ok) throw new Error(`jikan ${res.status}`)
  const json = (await res.json()) as { data: JikanAnime[] }
  return json.data.map(fromJikan)
}

function jikanStatus(airing: string) {
  if (airing === 'airing') return 'airing'
  if (airing === 'upcoming') return 'upcoming'
  return 'complete'
}

const ANILIST_FIELDS = `
      id idMal
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large }
      bannerImage format episodes duration averageScore seasonYear season status
      nextAiringEpisode { airingAt }
      genres
      studios(isMain: true) { nodes { name } }
`

const ANILIST_QUERY = `
query Search($page: Int, $search: String, $format: MediaFormat, $status: MediaStatus,
  $genres: [String], $scoreGreater: Int, $yearFrom: FuzzyDateInt, $yearTo: FuzzyDateInt,
  $sort: [MediaSort]) {
  Page(page: $page, perPage: 24) {
    pageInfo { hasNextPage }
    media(type: ANIME, isAdult: false, search: $search, format: $format, status: $status,
      genre_in: $genres, averageScore_greater: $scoreGreater,
      startDate_greater: $yearFrom, startDate_lesser: $yearTo, sort: $sort) {
${ANILIST_FIELDS}
    }
  }
}`

const ANILIST_CATALOG_QUERY = `
query Catalog($page: Int, $perPage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(type: ANIME, isAdult: false, sort: $sort) {
${ANILIST_FIELDS}
    }
  }
}`

/** Una pagina del catalogo: usata dal precaricamento desktop (`lib/catalog.ts`). */
export async function fetchAniListPage(
  sort: 'POPULARITY_DESC' | 'SCORE_DESC' | 'TRENDING_DESC',
  page: number,
  perPage = 50,
): Promise<{ items: Anime[]; hasMore: boolean }> {
  const res = await politeFetch('anilist', 'https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: ANILIST_CATALOG_QUERY,
      variables: { page, perPage, sort: [sort] },
    }),
  })
  if (!res.ok) throw new Error(`anilist ${res.status}`)
  const json = (await res.json()) as {
    data?: { Page?: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }
  }
  const result = json.data?.Page
  if (!result) throw new Error('anilist empty')
  return {
    items: result.media.map(fromAniList),
    hasMore: result.pageInfo.hasNextPage,
  }
}

async function searchAniList(
  query: SearchQuery,
): Promise<{ items: Anime[]; hasMore: boolean }> {
  const sort =
    query.sort === 'score'
      ? ['SCORE_DESC']
      : query.sort === 'newest'
        ? ['START_DATE_DESC']
        : query.sort === 'title'
          ? ['TITLE_ROMAJI']
          : query.q
            ? ['SEARCH_MATCH']
            : ['POPULARITY_DESC']

  const res = await politeFetch('anilist', 'https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: {
        page: query.page ?? 1,
        search: query.q || undefined,
        format: anilistFormat(query.type),
        status: anilistStatus(query.airing),
        genres: query.genres?.length ? query.genres : undefined,
        scoreGreater: query.minScore ? Math.round(query.minScore * 10) : undefined,
        yearFrom: query.yearFrom ? query.yearFrom * 10000 : undefined,
        yearTo: query.yearTo ? query.yearTo * 10000 + 1231 : undefined,
        sort,
      },
    }),
  })
  if (!res.ok) throw new Error(`anilist ${res.status}`)
  const json = (await res.json()) as {
    data?: { Page?: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }
  }
  const page = json.data?.Page
  if (!page) throw new Error('anilist empty')
  return {
    items: page.media.map(fromAniList),
    hasMore: page.pageInfo.hasNextPage,
  }
}

function anilistFormat(type?: string) {
  if (!type) return undefined
  const map: Record<string, string> = {
    tv: 'TV',
    movie: 'MOVIE',
    ova: 'OVA',
    ona: 'ONA',
    special: 'SPECIAL',
  }
  return map[type.toLowerCase()]
}

function anilistStatus(airing?: string) {
  if (!airing) return undefined
  const map: Record<string, string> = {
    airing: 'RELEASING',
    complete: 'FINISHED',
    upcoming: 'NOT_YET_RELEASED',
  }
  return map[airing]
}

async function searchKitsu(query: SearchQuery): Promise<Anime[]> {
  const params = new URLSearchParams({
    'page[limit]': '20',
    'page[offset]': String(((query.page ?? 1) - 1) * 20),
  })
  if (query.q) params.set('filter[text]', query.q)
  if (query.type) params.set('filter[subtype]', query.type.toLowerCase())
  const res = await politeFetch('kitsu', `https://kitsu.io/api/edge/anime?${params}`)
  if (!res.ok) throw new Error(`kitsu ${res.status}`)
  const json = (await res.json()) as { data: KitsuAnime[] }
  return json.data.map(fromKitsu)
}

/* ------------------------------------------------------------ public API */

export async function searchAnime(query: SearchQuery): Promise<SearchResult> {
  const key = `search:${JSON.stringify(query)}`
  const cached = cacheGet<SearchResult>(key)
  if (cached?.fresh) return { ...cached.value, source: cached.value.source }

  const attempts: (() => Promise<SearchResult>)[] = [
    async () => {
      const items = await searchJikan(query)
      return {
        items: applyLocalFilters(items, query),
        hasMore: items.length >= 24,
        source: 'jikan' as SourceName,
        stale: false,
        degraded: false,
      }
    },
    async () => {
      const { items, hasMore } = await searchAniList(query)
      return {
        items: applyLocalFilters(items, query),
        hasMore,
        source: 'anilist' as SourceName,
        stale: false,
        degraded: true,
      }
    },
    async () => {
      const items = await searchKitsu(query)
      return {
        items: applyLocalFilters(items, query),
        hasMore: items.length >= 20,
        source: 'kitsu' as SourceName,
        stale: false,
        degraded: true,
      }
    },
  ]

  return dedupe(key, async () => {
    for (const attempt of attempts) {
      try {
        const result = await attempt()
        if (result.items.length > 0 || !cached) {
          cacheSet(key, result, TTL_SEARCH)
          return result
        }
      } catch (error) {
        console.log('[v0] source failed', (error as Error).message)
      }
    }
    if (cached) return { ...cached.value, stale: true, source: 'cache', degraded: true }
    return { items: [], hasMore: false, source: 'cache', stale: true, degraded: true }
  })
}

export type DetailResult = {
  anime: Anime | null
  episodes: EpisodeInfo[]
  source: SourceName
  stale: boolean
}

export async function getAnimeDetail(id: string): Promise<DetailResult> {
  const key = `detail:${id}`
  const cached = cacheGet<DetailResult>(key)
  if (cached?.fresh) return cached.value

  const [source, rawId] = id.split(':')

  // local episode list, generated when the source does not expose one
  function episodesFrom(anime: Anime): EpisodeInfo[] {
    if (!anime.episodesTotal || anime.episodesTotal <= 0) return []
    return Array.from({ length: anime.episodesTotal }, (_, i) => ({
      number: i + 1,
      title: null,
      airDate: null,
    }))
  }

  return dedupe(key, async () => {
    try {
      if (source === 'jikan') {
        try {
          const res = await politeFetch(
            'jikan',
            `https://api.jikan.moe/v4/anime/${rawId}/full`,
          )
          if (!res.ok) throw new Error(`jikan ${res.status}`)
          const json = (await res.json()) as { data: JikanAnime }
          const anime = fromJikan(json.data)
          const episodes = await jikanEpisodes(rawId, anime.episodesTotal)
          const result: DetailResult = { anime, episodes, source: 'jikan', stale: false }
          cacheSet(key, result, TTL_DETAIL)
          return result
        } catch (error) {
          // Jikan giù o lento: `rawId` è un MAL id, quindi AniList lo risolve
          console.log('[v0] detail jikan fallback', (error as Error).message)
        }
      }
      if (source === 'kitsu') {
        const items = await searchKitsu({ q: undefined, page: 1 })
        const found = items.find((i) => i.id === id)
        if (found) {
          const result: DetailResult = {
            anime: found,
            episodes: episodesFrom(found),
            source: 'kitsu',
            stale: false,
          }
          cacheSet(key, result, TTL_DETAIL)
          return result
        }
      }
      // anilist ids (and anything unresolved) go through the AniList search by id
      const res = await politeFetch('anilist', 'https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `query($id: Int, $malId: Int) {
            Media(id: $id, idMal: $malId, type: ANIME) {
              id idMal title { romaji english native } description(asHtml: false)
              coverImage { extraLarge large } bannerImage format episodes duration
              averageScore seasonYear season status nextAiringEpisode { airingAt }
              genres studios(isMain: true) { nodes { name } }
            }
          }`,
          variables:
            source === 'anilist'
              ? { id: Number(rawId) }
              : { malId: Number(rawId) },
        }),
      })
      if (!res.ok) throw new Error(`anilist ${res.status}`)
      const json = (await res.json()) as { data?: { Media?: AniListMedia } }
      if (!json.data?.Media) throw new Error('anilist empty')
      const anime = fromAniList(json.data.Media)
      let episodes = episodesFrom(anime)
      if (anime.malId) {
        // AniList often hides totals for ongoing series: ask Jikan for the list
        const viaJikan = await jikanEpisodes(String(anime.malId), anime.episodesTotal)
        if (viaJikan.length > 0) episodes = viaJikan
      }
      const result: DetailResult = {
        anime,
        episodes,
        source: 'anilist',
        stale: false,
      }
      cacheSet(key, result, TTL_DETAIL)
      return result
    } catch (error) {
      console.log('[v0] detail failed', (error as Error).message)
      if (cached) return { ...cached.value, stale: true, source: 'cache' as SourceName }
      return { anime: null, episodes: [], source: 'cache', stale: true }
    }
  })
}

async function jikanEpisodes(
  malId: string,
  total: number | null,
): Promise<EpisodeInfo[]> {
  try {
    const res = await politeFetch(
      'jikan',
      `https://api.jikan.moe/v4/anime/${malId}/episodes`,
    )
    if (!res.ok) throw new Error(`jikan episodes ${res.status}`)
    const json = (await res.json()) as {
      data: { mal_id: number; title?: string | null; aired?: string | null }[]
    }
    const episodes = json.data.map((e) => ({
      number: e.mal_id,
      title: e.title ?? null,
      airDate: e.aired ?? null,
    }))
    if (episodes.length > 0) return episodes
  } catch (error) {
    console.log('[v0] episodes fallback', (error as Error).message)
  }
  if (!total) return []
  return Array.from({ length: total }, (_, i) => ({
    number: i + 1,
    title: null,
    airDate: null,
  }))
}
