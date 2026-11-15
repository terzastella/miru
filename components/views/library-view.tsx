'use client'

import { Bookmark, LayoutGrid, List, Search, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AnimeCard, PosterFrame, STATUS_KEY } from '@/components/anime-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { sortEntries, useMiru } from '@/lib/store'
import {
  displayTitle,
  LIBRARY_SORTS,
  LIBRARY_STATUSES,
  progressOf,
  type LibraryEntry,
  type LibrarySort,
  type LibraryStatus,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type StatusFilter = LibraryStatus | 'all' | 'favorites'

const SORT_KEY: Record<LibrarySort, TranslationKey> = {
  updated_desc: 'sort.updated_desc',
  added_desc: 'sort.added_desc',
  title_asc: 'sort.title_asc',
  title_desc: 'sort.title_desc',
  score_desc: 'sort.score_desc',
  score_asc: 'sort.score_asc',
  year_desc: 'sort.year_desc',
  progress_desc: 'sort.progress_desc',
}

export function LibraryView() {
  const { t } = useI18n()
  const {
    ready,
    entries,
    preferences,
    setPreferences,
    allTags,
    openDetail,
    setStatusBulk,
    removeEntries,
    toggleFavorite,
  } = useMiru()

  const [statuses, setStatuses] = useState<StatusFilter[]>(['all'])
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [selection, setSelection] = useState<string[]>([])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const activeStatuses = statuses.filter(
      (s) => s !== 'all' && s !== 'favorites',
    ) as LibraryStatus[]
    const onlyFavorites = statuses.includes('favorites')

    const result = entries.filter((entry) => {
      if (onlyFavorites && !entry.isFavorite) return false
      if (activeStatuses.length > 0 && !activeStatuses.includes(entry.status))
        return false
      if (tagFilter.length > 0 && !tagFilter.every((tag) => entry.customTags.includes(tag)))
        return false
      if (minScore > 0 && (entry.userScore ?? -1) < minScore) return false
      if (needle) {
        const haystack = [
          entry.anime.title,
          entry.anime.titleEnglish,
          entry.anime.titleJapanese,
          entry.notes,
          ...entry.customTags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    return sortEntries(result, preferences.librarySort)
  }, [entries, minScore, preferences.librarySort, query, statuses, tagFilter])

  function toggleStatus(value: StatusFilter) {
    setStatuses((prev) => {
      if (value === 'all') return ['all']
      const withoutAll = prev.filter((s) => s !== 'all')
      const next = withoutAll.includes(value)
        ? withoutAll.filter((s) => s !== value)
        : [...withoutAll, value]
      return next.length === 0 ? ['all'] : next
    })
  }

  const isList = preferences.libraryView === 'list'

  if (!ready) {
    return (
      <div className="px-4 py-10 md:px-10">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="motion-rise px-4 py-8 md:px-10 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t('library.title')}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {t('library.count', { count: filtered.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border p-0.5">
            <button
              type="button"
              onClick={() => setPreferences({ libraryView: 'grid' })}
              aria-pressed={!isList}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs',
                !isList
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              {t('library.view.grid')}
            </button>
            <button
              type="button"
              onClick={() => setPreferences({ libraryView: 'list' })}
              aria-pressed={isList}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs',
                isList
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="size-3.5" aria-hidden="true" />
              {t('library.view.list')}
            </button>
          </div>

          <select
            value={preferences.librarySort}
            onChange={(event) =>
              setPreferences({ librarySort: event.target.value as LibrarySort })
            }
            className="select-pill"
            aria-label={t('library.sortBy')}
          >
            {LIBRARY_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {t(SORT_KEY[sort])}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('library.search')}
            aria-label={t('library.search')}
            className="rounded-full py-2.5 pr-4 pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'favorites', ...LIBRARY_STATUSES] as StatusFilter[]).map(
            (status) => {
              const active = statuses.includes(status)
              const label =
                status === 'all'
                  ? t('status.all')
                  : status === 'favorites'
                    ? t('status.favorites')
                    : t(STATUS_KEY[status])
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  aria-pressed={active}
                  className={cn(
                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-transparent bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              )
            },
          )}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          {allTags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t('library.tags')}
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = tagFilter.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setTagFilter((prev) =>
                          prev.includes(tag)
                            ? prev.filter((item) => item !== tag)
                            : [...prev, tag],
                        )
                      }
                      className={cn(
                        'cursor-pointer rounded-sm border px-2 py-1 font-mono text-[11px]',
                        active
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="w-52">
            <Label htmlFor="min-score" className="text-xs text-muted-foreground">
              {t('library.minScore')}:{' '}
              <span className="font-mono text-foreground">
                {minScore === 0 ? '—' : minScore.toFixed(1)}
              </span>
            </Label>
            <Slider
              id="min-score"
              value={minScore}
              onValueChange={(value) => setMinScore(Number(value))}
              min={0}
              max={10}
              step={0.5}
              className="mt-3"
            />
          </div>
        </div>
      </div>

      {selection.length > 0 && (
        <div className="sticky top-14 z-30 mt-6 flex flex-wrap items-center gap-3 rounded-full border border-primary/40 bg-card px-4 py-3 md:top-16">
          <p className="text-sm font-medium">
            {t('library.selected', { count: selection.length })}
          </p>
          <Select
            value=""
            onValueChange={(value) => {
              setStatusBulk(selection, value as LibraryStatus)
              setSelection([])
            }}
          >
            <SelectTrigger className="w-44" aria-label={t('library.bulkStatus')}>
              <SelectValue placeholder={t('library.bulkStatus')} />
            </SelectTrigger>
            <SelectContent>
              {LIBRARY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(STATUS_KEY[status])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              removeEntries(selection)
              setSelection([])
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {t('library.bulkDelete')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelection([])}>
            {t('library.clearSelection')}
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{t('library.empty')}</p>
      ) : isList ? (
        <ul className="mt-8 flex flex-col">
          {filtered.map((entry) => (
            <LibraryRow
              key={entry.id}
              entry={entry}
              selected={selection.includes(entry.id)}
              onToggleSelect={() =>
                setSelection((prev) =>
                  prev.includes(entry.id)
                    ? prev.filter((id) => id !== entry.id)
                    : [...prev, entry.id],
                )
              }
              onOpen={() => openDetail(entry.anime)}
              onToggleFavorite={() => toggleFavorite(entry.id)}
            />
          ))}
        </ul>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <AnimeCard
                anime={entry.anime}
                entry={entry}
                selectable
                selected={selection.includes(entry.id)}
                onSelectedChange={(value) =>
                  setSelection((prev) =>
                    value
                      ? [...prev, entry.id]
                      : prev.filter((id) => id !== entry.id),
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LibraryRow({
  entry,
  selected,
  onToggleSelect,
  onOpen,
  onToggleFavorite,
}: {
  entry: LibraryEntry
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  onToggleFavorite: () => void
}) {
  const { t } = useI18n()
  const total = entry.anime.episodesTotal
  const watched = entry.watchedEpisodes.length

  return (
    <li className="flex items-center gap-3 border-b border-border py-2.5">
      <Checkbox
        checked={selected}
        onCheckedChange={onToggleSelect}
        aria-label={t('library.select', { title: entry.anime.title })}
      />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        aria-label={t('a11y.openDetail', { title: displayTitle(entry.anime) })}
      >
        <PosterFrame anime={entry.anime} className="w-9 shrink-0 rounded-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayTitle(entry.anime)}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {[
              t(STATUS_KEY[entry.status]),
              total
                ? `${watched}/${total}`
                : t('detail.progressUnknown', { watched }),
              entry.anime.year,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="hidden w-28 sm:block">
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.round(progressOf(entry) * 100)}%` }}
            />
          </div>
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums">
          {entry.userScore != null ? entry.userScore.toFixed(1) : '—'}
        </span>
      </button>
      {entry.customTags.length > 0 && (
        <Badge variant="outline" className="hidden font-mono text-[10px] lg:flex">
          {entry.customTags[0]}
          {entry.customTags.length > 1 ? ` +${entry.customTags.length - 1}` : ''}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleFavorite}
        aria-pressed={entry.isFavorite}
        aria-label={
          entry.isFavorite ? t('detail.favoriteRemove') : t('detail.favoriteAdd')
        }
      >
        {entry.isFavorite ? (
          <Bookmark className="size-4 fill-accent text-accent" aria-hidden="true" />
        ) : (
          <Star className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </Button>
    </li>
  )
}
