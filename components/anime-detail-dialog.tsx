'use client'

import { Check, ChevronLeft, ChevronRight, Heart, Plus, Repeat, Star, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { PosterFrame, STATUS_KEY } from '@/components/anime-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { activityLabel } from '@/lib/activity'
import { animeFetch } from '@/lib/anime-api'
import { formatDate, useI18n } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import {
  LIBRARY_STATUSES,
  type ActivityRecord,
  type Anime,
  type EpisodeInfo,
  type LibraryEntry,
  type LibraryStatus,
  type SourceName,
} from '@/lib/types'
import { displayTitle } from '@/lib/types'
import { cn } from '@/lib/utils'

type DetailPayload = {
  anime: Anime
  episodes: EpisodeInfo[]
  source: SourceName
  stale: boolean
}

const fetcher = (url: string) =>
  animeFetch(url).then((res) => res.json() as Promise<DetailPayload>)

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

export function AnimeDetailDialog() {
  const { t, locale } = useI18n()
  const {
    detailId,
    detailSeed,
    closeDetail,
    entryFor,
    addEntry,
    removeEntries,
    setStatus,
    toggleFavorite,
    toggleEpisode,
    setEpisodes,
    setScore,
    setNotes,
    setTags,
    updateEntry,
    registerRewatch,
    allTags,
    activityFor,
  } = useMiru()

  const entry = detailId ? entryFor(detailId) : undefined
  const {
    data: detail,
    error: detailError,
    mutate,
  } = useSWR<DetailPayload>(
    detailId ? `/api/anime/${encodeURIComponent(detailId)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const anime = detail?.anime ?? entry?.anime ?? detailSeed
  // server list when available, otherwise a local numbered list from the total
  const serverEpisodes = detail?.episodes ?? []
  const episodes = useMemo(() => {
    if (serverEpisodes.length > 0) return serverEpisodes
    const total = anime?.episodesTotal
    if (!total || total <= 0) return []
    return Array.from({ length: total }, (_, i) => ({
      number: i + 1,
      title: null,
      airDate: null,
    }))
  }, [anime?.episodesTotal, serverEpisodes])
  const source = detail?.source ?? anime?.source ?? 'cache'
  const stale = detail?.stale ?? false
  const watched = useMemo(
    () => new Set(entry?.watchedEpisodes ?? []),
    [entry?.watchedEpisodes],
  )
  const history = detailId ? activityFor(detailId) : []

  const PAGE_SIZE = 20
  const [episodePage, setEpisodePage] = useState(0)
  useEffect(() => setEpisodePage(0), [detailId])
  const totalPages = Math.max(1, Math.ceil(episodes.length / PAGE_SIZE))
  const page = Math.min(episodePage, totalPages - 1)
  const pageEpisodes = episodes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleOpenChange(open: boolean) {
    if (!open) closeDetail()
  }

  return (
    <Dialog open={detailId !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[min(96vw,1900px)]">
        {anime ? (
          <>
            {anime.bannerUrl && (
              <div className="relative h-24 shrink-0 overflow-hidden md:h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anime.bannerUrl}
                  alt=""
                  className="mask-poster size-full object-cover"
                />
              </div>
            )}

            <div className="min-h-0 overflow-y-auto">
              <div className="grid gap-8 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10 lg:p-8">
                {/* episodes — right column */}
                <section
                  className="order-2 min-w-0 lg:flex lg:min-h-0 lg:flex-col"
                  aria-label={t('detail.episodes')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-normal tracking-[0.04em]">
                      {t('detail.episodes')}
                    </h3>
                    {episodes.length > 0 && entry && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full"
                          onClick={() =>
                            setEpisodes(
                              entry.id,
                              episodes.map((e) => e.number),
                            )
                          }
                        >
                          <Check className="size-3" aria-hidden="true" />
                          {t('detail.episodesMarkAll')}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full"
                          onClick={() => setEpisodes(entry.id, [])}
                        >
                          <X className="size-3" aria-hidden="true" />
                          {t('detail.episodesUnmarkAll')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!detail && episodes.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {detailError ? (
                        <span className="flex flex-wrap items-center gap-2">
                          {t('detail.episodesUnavailable')}
                          <Button
                            size="xs"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => void mutate()}
                          >
                            {t('common.retry')}
                          </Button>
                        </span>
                      ) : (
                        t('detail.loadingEpisodes')
                      )}
                    </p>
                  ) : episodes.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t('detail.episodesUnknown')}
                    </p>
                  ) : (
                    <>
                      <ul
                        className={cn(
                          'mt-3 grid content-start gap-1',
                          episodes.length > PAGE_SIZE
                            ? 'grid-cols-2'
                            : 'grid-cols-1',
                          'md:max-h-[560px] md:overflow-y-auto',
                        )}
                      >
                        {pageEpisodes.map((episode) => {
                        const isWatched = watched.has(episode.number)
                        return (
                          <li key={episode.number}>
                            <label
                              className={cn(
                                'flex cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-colors',
                                isWatched
                                  ? 'border-primary/40 bg-primary/8 text-foreground'
                                  : 'border-border text-muted-foreground hover:border-foreground/30',
                              )}
                            >
                              <Checkbox
                                checked={isWatched}
                                onCheckedChange={() =>
                                  entry && toggleEpisode(entry.id, episode.number)
                                }
                                aria-label={
                                  isWatched
                                    ? t('a11y.unmarkEpisode', {
                                        number: episode.number,
                                      })
                                    : t('a11y.markEpisode', {
                                        number: episode.number,
                                      })
                                }
                              />
                              <span className="shrink-0 font-mono text-xs tabular-nums">
                                {String(episode.number).padStart(2, '0')}
                              </span>
                              {episode.title && (
                                <span className="truncate">{episode.title}</span>
                              )}
                              {episode.airDate && (
                                <span className="ml-auto shrink-0 font-mono text-[10px]">
                                  {formatDate(locale, episode.airDate)}
                                </span>
                              )}
                            </label>
                          </li>
                        )
                      })}
                      </ul>
                      {totalPages > 1 && (
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
                          <Button
                            variant="outline"
                            size="xs"
                            className="rounded-full"
                            disabled={page === 0}
                            onClick={() => setEpisodePage(page - 1)}
                            aria-label={t('detail.pagePrev')}
                          >
                            <ChevronLeft className="size-3" aria-hidden="true" />
                            {t('detail.pagePrev')}
                          </Button>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {page + 1} / {totalPages}
                          </p>
                          <Button
                            variant="outline"
                            size="xs"
                            className="rounded-full"
                            disabled={page >= totalPages - 1}
                            onClick={() => setEpisodePage(page + 1)}
                            aria-label={t('detail.pageNext')}
                          >
                            {t('detail.pageNext')}
                            <ChevronRight className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </section>

                {/* poster + info — left column */}
                <div className="order-1 min-w-0">
                  <div className="grid gap-8 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                    <div className="mx-auto w-52 md:w-full">
                      <PosterFrame anime={anime} className="rounded-lg" />
                    </div>

                    <div className="min-w-0">
                      <DialogHeader>
                        <DialogTitle className="font-display text-3xl font-normal tracking-[0.03em] leading-none">
                          {displayTitle(anime)}
                        </DialogTitle>
                        {(anime.title || anime.titleJapanese) && (
                          <DialogDescription className="mt-1.5 text-xs">
                            {[anime.title, anime.titleJapanese]
                              .filter(Boolean)
                              .join(' · ')}
                          </DialogDescription>
                        )}
                      </DialogHeader>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {anime.score != null && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                            <Star
                              className="size-3 fill-primary"
                              aria-hidden="true"
                            />
                            {anime.score.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              SOURCE_DOT[source],
                            )}
                            aria-hidden="true"
                          />
                          {SOURCE_LABEL[source]}
                          {stale && ` · ${t('explore.sourceCache')}`}
                        </span>
                        {anime.airingStatus && (
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs',
                              anime.airingStatus === 'airing'
                                ? 'bg-[#36d1c4]/15 text-[#36d1c4]'
                                : 'border border-border text-muted-foreground',
                            )}
                          >
                            {t(`airing.${anime.airingStatus}`)}
                          </span>
                        )}
                        {anime.type && (
                          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                            {anime.type}
                          </span>
                        )}
                        {anime.year && (
                          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                            {anime.year}
                          </span>
                        )}
                        {anime.season && (
                          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                            {anime.season}
                          </span>
                        )}
                      </div>

                      {anime.synopsis && (
                        <p className="mt-4 max-h-48 overflow-y-auto pr-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                          {anime.synopsis}
                        </p>
                      )}

                      <section className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        {anime.studios.length > 0 && (
                          <p>
                            <span className="text-foreground">
                              {t('detail.studios')}:{' '}
                            </span>
                            {anime.studios.join(', ')}
                          </p>
                        )}
                        {anime.episodesTotal != null && (
                          <p>
                            <span className="text-foreground">
                              {t('detail.episodesTotal')}:{' '}
                            </span>
                            {anime.episodesTotal}
                          </p>
                        )}
                        {anime.durationMinutes != null && (
                          <p>
                            <span className="text-foreground">
                              {t('detail.duration')}:{' '}
                            </span>
                            {anime.durationMinutes} min
                          </p>
                        )}
                        {anime.genres.length > 0 && (
                          <p>
                            <span className="text-foreground">
                              {t('explore.genres')}:{' '}
                            </span>
                            {anime.genres.join(', ')}
                          </p>
                        )}
                      </section>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {!entry ? (
                          <Button
                            onClick={() => addEntry(anime)}
                            className="rounded-full"
                          >
                            <Plus className="size-4" aria-hidden="true" />
                            {t('detail.addToLibrary')}
                          </Button>
                        ) : (
                          <>
                            <div
                              role="group"
                              aria-label={t('detail.status')}
                              className="flex w-full flex-wrap gap-1 rounded-full border border-border bg-surface p-1 lg:w-auto"
                            >
                              {LIBRARY_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  aria-pressed={entry.status === status}
                                  onClick={() => setStatus(entry.id, status)}
                                  className={cn(
                                    'flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors lg:flex-none',
                                    entry.status === status
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:text-foreground',
                                  )}
                                >
                                  {t(STATUS_KEY[status])}
                                </button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => toggleFavorite(entry.id)}
                              aria-pressed={entry.isFavorite}
                              aria-label={
                                entry.isFavorite
                                  ? t('detail.favoriteRemove')
                                  : t('detail.favoriteAdd')
                              }
                            >
                              <Heart
                                className={cn(
                                  'size-3.5',
                                  entry.isFavorite &&
                                    'fill-[#ff3f6e] text-[#ff3f6e]',
                                )}
                                aria-hidden="true"
                              />
                              {t('detail.favorite')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-destructive hover:bg-destructive/10"
                              onClick={() => removeEntries([entry.id])}
                            >
                              {t('detail.remove')}
                            </Button>
                          </>
                        )}
                      </div>

                      {entry && (
                        <div className="mt-5 border-t border-border pt-5">
                          <EditorPanel
                            key={entry.id}
                            entry={entry}
                            onScoreCommitted={(score) => setScore(entry.id, score)}
                            onNotesCommit={(notes) => setNotes(entry.id, notes)}
                            onTagsChange={(tags) => setTags(entry.id, tags)}
                            onDatesChange={(dates) =>
                              updateEntry(entry.id, {
                                startedAt: dates.startedAt,
                                finishedAt: dates.finishedAt,
                              })
                            }
                            onRewatch={() => registerRewatch(entry.id)}
                            tagSuggestions={allTags}
                            history={history}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">{t('common.loading')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditorPanel({
  entry,
  onScoreCommitted,
  onNotesCommit,
  onTagsChange,
  onDatesChange,
  onRewatch,
  tagSuggestions,
  history,
}: {
  entry: LibraryEntry
  onScoreCommitted: (score: number) => void
  onNotesCommit: (notes: string) => void
  onTagsChange: (tags: string[]) => void
  onDatesChange: (dates: {
    startedAt: string | null
    finishedAt: string | null
  }) => void
  onRewatch: () => void
  tagSuggestions: string[]
  history: ActivityRecord[]
}) {
  const { t, locale } = useI18n()
  const [notes, setNotes] = useState(entry.notes)
  const [tagDraft, setTagDraft] = useState('')
  const [confirmRewatch, setConfirmRewatch] = useState(false)

  useEffect(() => setNotes(entry.notes), [entry.notes])

  const suggestions = tagSuggestions.filter(
    (s) =>
      !entry.customTags.includes(s) &&
      s.toLowerCase().includes(tagDraft.trim().toLowerCase()),
  )

  function commitTag() {
    const value = tagDraft.trim()
    if (!value) return
    if (!entry.customTags.includes(value))
      onTagsChange([...entry.customTags, value])
    setTagDraft('')
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end gap-5">
        <div className="min-w-56 flex-1">
          <Label htmlFor="user-score" className="text-xs text-muted-foreground">
            {t('detail.score')}:{' '}
            <span className="font-mono text-foreground">
              {entry.userScore != null
                ? entry.userScore.toFixed(1)
                : t('detail.scoreNone')}
            </span>
          </Label>
          <Slider
            id="user-score"
            className="mt-3"
            min={0}
            max={10}
            step={0.5}
            value={entry.userScore ?? 0}
            onValueCommitted={(value) =>
              typeof value === 'number' && onScoreCommitted(value)
            }
            aria-label={t('detail.score')}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Label
            htmlFor="started-at"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            {t('detail.startedAt')}
            <span className="relative">
              <Input
                id="started-at"
                type="date"
                value={entry.startedAt ?? ''}
                onChange={(event) =>
                  onDatesChange({
                    startedAt: event.target.value || null,
                    finishedAt: entry.finishedAt,
                  })
                }
              />
              {entry.startedAt && (
                <button
                  type="button"
                  onClick={() =>
                    onDatesChange({
                      startedAt: null,
                      finishedAt: entry.finishedAt,
                    })
                  }
                  aria-label={t('detail.clearDate')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          </Label>
          <Label
            htmlFor="finished-at"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            {t('detail.finishedAt')}
            <span className="relative">
              <Input
                id="finished-at"
                type="date"
                value={entry.finishedAt ?? ''}
                onChange={(event) =>
                  onDatesChange({
                    startedAt: entry.startedAt,
                    finishedAt: event.target.value || null,
                  })
                }
              />
              {entry.finishedAt && (
                <button
                  type="button"
                  onClick={() =>
                    onDatesChange({
                      startedAt: entry.startedAt,
                      finishedAt: null,
                    })
                  }
                  aria-label={t('detail.clearDate')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-xs text-muted-foreground">
          {t('detail.notes')}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes !== entry.notes && onNotesCommit(notes)}
          placeholder={t('detail.notesPlaceholder')}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="tags" className="text-xs text-muted-foreground">
          {t('detail.tags')}
        </Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {entry.customTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px]"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  onTagsChange(entry.customTags.filter((item) => item !== tag))
                }
                aria-label={`${t('common.remove')} ${tag}`}
                className="cursor-pointer rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <Input
            id="tags"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitTag()
              }
              if (
                event.key === 'Backspace' &&
                tagDraft === '' &&
                entry.customTags.length > 0
              ) {
                onTagsChange(entry.customTags.slice(0, -1))
              }
            }}
            placeholder={t('detail.tagsPlaceholder')}
            className="h-6 w-44 rounded-full"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onTagsChange([...entry.customTags, suggestion])}
                className="cursor-pointer rounded-full border border-accent/40 bg-accent/8 px-2.5 py-0.5 font-mono text-[11px] text-accent hover:bg-accent/15"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {confirmRewatch ? (
          <>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                onRewatch()
                setConfirmRewatch(false)
              }}
            >
              <Repeat className="size-3.5" aria-hidden="true" />
              {t('common.confirm')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setConfirmRewatch(false)}
            >
              {t('common.cancel')}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setConfirmRewatch(true)}
          >
            <Repeat className="size-3.5" aria-hidden="true" />
            {t('detail.rewatch')}
          </Button>
        )}
        <p className="font-mono text-[11px] text-muted-foreground">
          {t('detail.rewatchCount', { count: entry.rewatchCount })}
        </p>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="mb-1.5 font-display text-sm font-semibold tracking-tight">
            {t('detail.history')}
          </h3>
          <ol className="flex flex-col border-t border-border">
            {history.slice(0, 10).map((record) => (
              <li
                key={record.id}
                className="flex items-baseline justify-between gap-4 border-b border-border py-1.5 text-xs"
              >
                <span className="text-muted-foreground">
                  {activityLabel(locale, record.action)}
                  {record.metadata?.episode ? ` #${record.metadata.episode}` : ''}
                </span>
                <time
                  dateTime={record.createdAt}
                  className="shrink-0 font-mono text-[10px] text-muted-foreground"
                >
                  {formatDate(locale, record.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}