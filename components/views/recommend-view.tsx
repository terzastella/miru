'use client'

import { Compass, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AnimeCard } from '@/components/anime-card'
import { Button } from '@/components/ui/button'
import { animeFetch } from '@/lib/anime-api'
import { useI18n } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import type { Anime } from '@/lib/types'

type SearchResponse = {
  items: Anime[]
  hasMore: boolean
  degraded: boolean
}

const fetcher = (url: string) => animeFetch(url).then((res) => res.json())

export function RecommendView() {
  const { t } = useI18n()
  const { entries, stats, dismissed, dismissRecommendation, entryFor } = useMiru()

  const genres = stats.topGenres.slice(0, 2).map((g) => g.genre)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [degraded, setDegraded] = useState(false)
  const [error, setError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const itemsRef = useRef<Anime[]>([])
  const [, forceRender] = useState(0)

  const url = useMemo(() => {
    const params = new URLSearchParams({ sort: 'score', minScore: '7' })
    if (genres.length > 0) params.set('genres', genres.join(','))
    return `/api/anime/search?${params.toString()}`
  }, [genres])

  const fetchPage = useCallback(
    (targetPage: number) => {
      void animeFetch(`${url}&page=${targetPage}`)
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status))
          return res.json() as Promise<SearchResponse>
        })
        .then((data) => {
          itemsRef.current =
            targetPage === 1 ? data.items : [...itemsRef.current, ...data.items]
          setHasMore(data.hasMore)
          setDegraded(data.degraded)
          forceRender((n) => n + 1)
        })
        .catch(() => setError(true))
        .finally(() => setLoadingMore(false))
    },
    [url],
  )

  useEffect(() => {
    if (genres.length === 0) return
    itemsRef.current = []
    setPage(1)
    setHasMore(false)
    setError(false)
    fetchPage(1)
  }, [fetchPage, genres.length])

  const items = itemsRef.current.filter((anime) => {
    const owned = entries.some((e) => e.animeId === anime.id)
    return !owned && !dismissed.includes(anime.id)
  })

  return (
    <div className="motion-rise mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <header>
        <h1 className="font-display text-3xl font-normal tracking-[0.04em] md:text-4xl">
          {t('nav.recommend')}
        </h1>
        {genres.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('recommend.subtitle', { genres: genres.join(', ') })}
          </p>
        )}
      </header>

      {genres.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {t('home.recommendedEmpty')}
        </p>
      )}

      {error && (
        <div className="mt-8 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{t('common.error')}</p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => fetchPage(1)}
          >
            <Compass className="size-3.5" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!error && items.length === 0 && genres.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {degraded ? t('explore.rateLimited') : t('recommend.noResults')}
          </p>
          {degraded && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => fetchPage(1)}
            >
              {t('common.retry')}
            </Button>
          )}
        </div>
      )}

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((anime) => (
          <li key={anime.id} className="relative">
            <AnimeCard anime={anime} entry={entryFor(anime.id)} />
            <button
              type="button"
              onClick={() => dismissRecommendation(anime.id)}
              className="mt-1.5 flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
              {t('home.dismiss')}
            </button>
          </li>
        ))}
      </ul>

      {loadingMore && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t('common.loading')}
        </p>
      )}

      {hasMore && items.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setLoadingMore(true)
              setPage((prev) => {
                fetchPage(prev + 1)
                return prev + 1
              })
            }}
          >
            {t('explore.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}