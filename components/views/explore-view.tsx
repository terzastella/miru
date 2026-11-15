'use client'

import { Compass, RotateCcw, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AnimeCard } from '@/components/anime-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { animeFetch } from '@/lib/anime-api'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { useDebounced } from '@/lib/use-debounced'
import { useMiru } from '@/lib/store'
import type { Anime, SourceName } from '@/lib/types'
import { cn } from '@/lib/utils'

type SearchResponse = {
  items: Anime[]
  hasMore: boolean
  source: SourceName
  stale: boolean
  degraded: boolean
}

type SortKey = 'popularity' | 'score' | 'newest' | 'title'

const SOURCE_LABEL: Record<SourceName, string> = {
  jikan: 'Jikan',
  anilist: 'AniList',
  kitsu: 'Kitsu',
  cache: 'cache',
}

const SOURCE_DOT: Record<SourceName, string> = {
  jikan: 'bg-[#ff5a2c]',
  anilist: 'bg-[#38bdf8]',
  kitsu: 'bg-[#f472b6]',
  cache: 'bg-[#9b96a6]',
}

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
  'Mecha',
  'Music',
  'Psychological',
]

const TYPE_LABEL: Record<string, TranslationKey> = {
  TV: 'type.tv',
  Movie: 'type.movie',
  OVA: 'type.ova',
  ONA: 'type.ona',
  Special: 'type.special',
}

const SORT_LABEL: Record<SortKey, TranslationKey> = {
  popularity: 'sort.popularity',
  score: 'sort.score',
  newest: 'sort.newest',
  title: 'sort.title',
}

const DEFAULTS = {
  q: '',
  type: '',
  airing: '',
  genres: [] as string[],
  minScore: 0,
  yearFrom: null as number | null,
  yearTo: null as number | null,
  episodesMin: null as number | null,
  episodesMax: null as number | null,
  studio: '',
  sort: 'popularity' as SortKey,
}

type Filters = typeof DEFAULTS

export function ExploreView() {
  const { t } = useI18n()
  const { entryFor } = useMiru()

  const [filters, setFilters] = useState<Filters>(DEFAULTS)
  const filtersDebounced = useDebounced(filters, 450)

  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Anime[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [source, setSource] = useState<SourceName | null>(null)
  const [stale, setStale] = useState(false)
  const [degraded, setDegraded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const patch = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }, [])

  function patchAndReset(partial: Partial<Filters>) {
    patch(partial)
    setPage(1)
    setItems([])
    setHasMore(false)
    setError(null)
  }

  async function fetchPage(targetPage: number, append: boolean) {
    if (targetPage > 1) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const params = new URLSearchParams({ page: String(targetPage) })
      if (filtersDebounced.q.trim()) params.set('q', filtersDebounced.q.trim())
      if (filtersDebounced.type) params.set('type', filtersDebounced.type)
      if (filtersDebounced.airing) params.set('airing', filtersDebounced.airing)
      if (filtersDebounced.genres.length > 0)
        params.set('genres', filtersDebounced.genres.join(','))
      if (filtersDebounced.minScore > 0)
        params.set('minScore', String(filtersDebounced.minScore))
      if (filtersDebounced.yearFrom)
        params.set('yearFrom', String(filtersDebounced.yearFrom))
      if (filtersDebounced.yearTo) params.set('yearTo', String(filtersDebounced.yearTo))
      if (filtersDebounced.episodesMin)
        params.set('episodesMin', String(filtersDebounced.episodesMin))
      if (filtersDebounced.episodesMax)
        params.set('episodesMax', String(filtersDebounced.episodesMax))
      if (filtersDebounced.studio.trim())
        params.set('studio', filtersDebounced.studio.trim())
      if (filtersDebounced.sort) params.set('sort', filtersDebounced.sort)

      const res = await animeFetch(`/api/anime/search?${params}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`search ${res.status}`)
      const data = (await res.json()) as SearchResponse

      setItems((prev) => (append ? [...prev, ...data.items] : data.items))
      setHasMore(data.hasMore)
      setSource(data.source)
      setStale(data.stale)
      setDegraded(data.degraded)
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setError(t('common.error'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setItems([])
    void fetchPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersDebounced])

  useEffect(() => {
    if (page === 1 || items.length === 0) return
    void fetchPage(page, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => () => abortRef.current?.abort(), [])

  const isDefault = useIsDefault(filters)

  return (
    <div className="motion-rise mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            {t('explore.title')}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t('explore.title')}
          </h1>
        </div>
        {source && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('explore.source')}:</span>
            <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
              <span className={cn('size-1.5 rounded-full', SOURCE_DOT[source])} aria-hidden="true" />
              {SOURCE_LABEL[source]}
            </span>
            {stale && (
              <span className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">
                {t('explore.sourceCache')}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="mt-6 relative max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={filters.q}
          onChange={(event) => patchAndReset({ q: event.target.value })}
          placeholder={t('explore.search')}
          aria-label={t('explore.search')}
          className="rounded-full py-2.5 pr-4 pl-10"
        />
      </div>

      <section
        aria-label={t('explore.filters')}
        className="mt-6 rounded-lg border border-border bg-card/60 p-4"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="explore-type" className="text-xs text-muted-foreground">
              {t('explore.type')}
            </Label>
            <select
              id="explore-type"
              value={filters.type}
              onChange={(event) => patchAndReset({ type: event.target.value })}
              className="select-pill mt-1.5 w-full"
            >
              <option value="">{t('explore.anyType')}</option>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="explore-airing" className="text-xs text-muted-foreground">
              {t('explore.airing')}
            </Label>
            <select
              id="explore-airing"
              value={filters.airing}
              onChange={(event) => patchAndReset({ airing: event.target.value })}
              className="select-pill mt-1.5 w-full"
            >
              <option value="">{t('explore.anyAiring')}</option>
              <option value="airing">{t('airing.airing')}</option>
              <option value="complete">{t('airing.complete')}</option>
              <option value="upcoming">{t('airing.upcoming')}</option>
            </select>
          </div>

          <div>
            <Label htmlFor="explore-sort" className="text-xs text-muted-foreground">
              {t('library.sortBy')}
            </Label>
            <select
              id="explore-sort"
              value={filters.sort}
              onChange={(event) =>
                patchAndReset({ sort: event.target.value as SortKey })
              }
              className="select-pill mt-1.5 w-full"
            >
              {Object.entries(SORT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="explore-min-score" className="text-xs text-muted-foreground">
              {t('explore.minScoreSource')}:{' '}
              <span className="font-mono text-foreground">
                {filters.minScore === 0 ? '—' : filters.minScore.toFixed(1)}
              </span>
            </Label>
            <Slider
              id="explore-min-score"
              className="mt-3"
              min={0}
              max={10}
              step={0.5}
              value={filters.minScore}
              onValueCommitted={(value) =>
                typeof value === 'number' && patchAndReset({ minScore: value })
              }
            />
          </div>

          <div>
            <Label htmlFor="explore-year-from" className="text-xs text-muted-foreground">
              {t('explore.yearFrom')}
            </Label>
            <Input
              id="explore-year-from"
              type="number"
              min={1917}
              max={2100}
              placeholder="2000"
              value={filters.yearFrom ?? ''}
              onChange={(event) =>
                patchAndReset({
                  yearFrom: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="explore-year-to" className="text-xs text-muted-foreground">
              {t('explore.yearTo')}
            </Label>
            <Input
              id="explore-year-to"
              type="number"
              min={1917}
              max={2100}
              placeholder="2026"
              value={filters.yearTo ?? ''}
              onChange={(event) =>
                patchAndReset({
                  yearTo: event.target.value ? Number(event.target.value) : null,
                })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="explore-episodes-min" className="text-xs text-muted-foreground">
              {t('explore.episodesMin')}
            </Label>
            <Input
              id="explore-episodes-min"
              type="number"
              min={0}
              max={5000}
              value={filters.episodesMin ?? ''}
              onChange={(event) =>
                patchAndReset({
                  episodesMin: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="explore-episodes-max" className="text-xs text-muted-foreground">
              {t('explore.episodesMax')}
            </Label>
            <Input
              id="explore-episodes-max"
              type="number"
              min={1}
              max={5000}
              value={filters.episodesMax ?? ''}
              onChange={(event) =>
                patchAndReset({
                  episodesMax: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="explore-studio" className="text-xs text-muted-foreground">
              {t('explore.studio')}
            </Label>
            <Input
              id="explore-studio"
              value={filters.studio}
              onChange={(event) => patchAndReset({ studio: event.target.value })}
              placeholder="MAPPA"
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t('explore.genres')}
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const active = filters.genres.includes(genre)
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    patchAndReset({
                      genres: active
                        ? filters.genres.filter((g) => g !== genre)
                        : [...filters.genres, genre],
                    })
                  }
                  className={cn(
                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-transparent bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </div>

        {!isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 rounded-full"
            onClick={() => patchAndReset({ ...DEFAULTS })}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('explore.reset')}
          </Button>
        )}
      </section>

      {isDefault && !loading && items.length > 0 && (
        <h2 className="mt-10 font-display text-lg font-semibold tracking-tight">
          {t('explore.trending')}
        </h2>
      )}

      {stale && !loading && (
        <p className="mt-6 text-sm text-muted-foreground">{t('explore.offline')}</p>
      )}

      {degraded && !loading && (
        <p className="mt-3 w-fit rounded-full border border-primary/40 bg-primary/8 px-4 py-2 text-xs font-medium text-primary">
          {t('explore.rateLimited')}
        </p>
      )}

      {error && (
        <div className="mt-10 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => void fetchPage(1, false)}>
            <Compass className="size-3.5" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!error && items.length === 0 && !loading && (
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {degraded ? t('explore.rateLimited') : t('explore.noResults')}
          </p>
          {degraded && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => void fetchPage(1, false)}
            >
              <Compass className="size-3.5" aria-hidden="true" />
              {t('common.retry')}
            </Button>
          )}
        </div>
      )}

      <ul
        className={cn(
          'mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6',
          isDefault && items.length > 0 && 'mt-4',
        )}
      >
        {items.map((anime) => (
          <li key={anime.id}>
            <AnimeCard anime={anime} entry={entryFor(anime.id)} />
          </li>
        ))}
      </ul>

      {loadingMore && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t('common.loading')}
        </p>
      )}

      {hasMore && !loading && !loadingMore && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" className="rounded-full" onClick={() => setPage((prev) => prev + 1)}>
            {t('explore.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}

function useIsDefault(filters: Filters) {
  return (
    filters.q.trim() === '' &&
    filters.type === '' &&
    filters.airing === '' &&
    filters.genres.length === 0 &&
    filters.minScore === 0 &&
    filters.yearFrom === null &&
    filters.yearTo === null &&
    filters.episodesMin === null &&
    filters.episodesMax === null &&
    filters.studio.trim() === ''
  )
}