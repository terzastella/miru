'use client'

import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import useSWR from 'swr'

import { AnimeCard, STATUS_KEY } from '@/components/anime-card'
import { animeFetch } from '@/lib/anime-api'
import { useI18n } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import type { Anime } from '@/lib/types'
import type { LibraryStatus } from '@/lib/types'

const fetcher = (url: string) => animeFetch(url).then((res) => res.json())

const STATUS_ROWS: LibraryStatus[] = ['watching', 'plan', 'onhold', 'done', 'dropped']

export function HomeView() {
  const { t } = useI18n()
  const { ready, entries, stats, dismissed, dismissRecommendation, openAddDialog } =
    useMiru()

  const grouped = useMemo(() => {
    const buckets = new Map<LibraryStatus, typeof entries>()
    for (const status of STATUS_ROWS) buckets.set(status, [])
    for (const entry of entries) {
      buckets.get(entry.status)?.push(entry)
    }
    for (const list of buckets.values()) {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return buckets
  }, [entries])

  const topGenre = stats.topGenres[0]?.genre

  const { data: recommendations } = useSWR<{ items: Anime[] }>(
    topGenre
      ? `/api/anime/search?genres=${encodeURIComponent(topGenre)}&sort=score&minScore=7`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const recommended = useMemo(() => {
    const owned = new Set(entries.map((e) => e.animeId))
    return (recommendations?.items ?? [])
      .filter((item) => !owned.has(item.id) && !dismissed.includes(item.id))
      .slice(0, 10)
  }, [dismissed, entries, recommendations])

  if (!ready) {
    return (
      <div className="px-4 py-10 md:px-8">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  if (entries.length === 0) {
return (
    <div className="motion-rise mx-auto max-w-2xl px-4 py-16 text-center md:px-8">
        <div className="rounded-xl border border-dashed border-border bg-bg-soft p-10">
          <span
            className="mx-auto flex size-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5a2c] via-[#ff8a3c] to-[#ff5a2c] font-sans text-3xl font-bold text-[#1a0a02] [transform:rotate(6deg)]"
            aria-hidden="true"
          >
            見
          </span>
          <h1 className="mt-6 font-display text-3xl font-normal tracking-[0.04em] text-balance">
            {t('home.emptyTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
            {t('home.emptyBody')}
          </p>
          <button
            type="button"
            onClick={openAddDialog}
            className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            {t('home.addFirst')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            {t('account.guestHint')}
          </p>
        </div>
      </div>
    )
  }

  const statsStrip: { label: string; value: string }[] = [
    { label: t('stats.titles'), value: String(stats.titles) },
    { label: t('stats.episodes'), value: String(stats.episodes) },
    { label: t('stats.hours'), value: String(Math.round(stats.minutes / 60)) },
    {
      label: t('stats.meanScore'),
      value: stats.meanScore != null ? stats.meanScore.toFixed(1) : '—',
    },
    { label: t('stats.rewatches'), value: String(stats.rewatches) },
  ]

  return (
    <div className="motion-rise mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <section
        aria-label={t('stats.titles')}
        className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono text-[13px] text-muted-foreground"
      >
        {statsStrip.map((item, index) => (
          <span key={item.label} className={index > 0 ? 'before:mr-2.5 before:content-["·"]' : ''}>
            <b className="mr-1 text-lg font-semibold tabular-nums text-foreground">
              {item.value}
            </b>
            {item.label.toLowerCase()}
          </span>
        ))}
      </section>

      <section className="mt-10" aria-label={t('home.recommended')}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-normal tracking-[0.04em]">
            {t('home.recommended')}
          </h2>
          <Link
            href="/recommend"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t('home.seeAll')}
          </Link>
        </div>
        {topGenre && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t('home.recommendedWhy', { genre: topGenre })}
          </p>
        )}
        {recommended.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('home.recommendedEmpty')}
          </p>
        ) : (
          <ul className="cw-row mt-4">
            {recommended.map((anime) => (
              <li key={anime.id} className="relative w-36 shrink-0 snap-start sm:w-40">
                <AnimeCard anime={anime} />
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
        )}
      </section>

      {STATUS_ROWS.map((status) => {
        const list = grouped.get(status) ?? []
        if (list.length === 0) return null
        return (
          <section key={status} className="mt-10" aria-label={t(STATUS_KEY[status])}>
            <h2 className="font-display text-2xl font-normal tracking-[0.04em]">
              {t(STATUS_KEY[status])}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {list.length} · {t('library.title').toLowerCase()}
            </p>
            <ul className="cw-row mt-4">
              {list.map((entry) => (
                <li
                  key={entry.id}
                  className="relative w-36 shrink-0 snap-start sm:w-40"
                >
                  <AnimeCard anime={entry.anime} entry={entry} />
                  {status === 'watching' && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {entry.anime.episodesTotal
                        ? `${entry.watchedEpisodes.length}/${entry.anime.episodesTotal}`
                        : `${entry.watchedEpisodes.length} ep`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}