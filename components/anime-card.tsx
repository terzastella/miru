'use client'

import { Heart, Plus, Star, Trash2 } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import {
  displayTitle,
  progressOf,
  type Anime,
  type LibraryEntry,
} from '@/lib/types'
import { cn } from '@/lib/utils'

export const STATUS_KEY: Record<LibraryEntry['status'], TranslationKey> = {
  plan: 'status.plan',
  watching: 'status.watching',
  onhold: 'status.onhold',
  dropped: 'status.dropped',
  done: 'status.done',
}

const STATUS_TAG: Record<LibraryEntry['status'], string> = {
  plan: 'bg-[#36d1c4]/15 text-[#36d1c4]',
  watching: 'bg-[#ff5a2c]/18 text-[#ff5a2c]',
  onhold: 'bg-[#ffc107]/15 text-[#ffc107]',
  dropped: 'bg-[#dc3545]/15 text-[#dc3545]',
  done: 'bg-white/10 text-[#f3f0ea]',
}

const STAMP_KEY: Partial<Record<LibraryEntry['status'], TranslationKey>> = {
  done: 'stamp.done',
  onhold: 'stamp.onhold',
  dropped: 'stamp.dropped',
}

export function PosterFrame({
  anime,
  className,
}: {
  anime: Anime
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-2/3 w-full overflow-hidden rounded-md bg-secondary',
        className,
      )}
    >
      {anime.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={anime.imageUrl || '/placeholder.svg'}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grain flex size-full items-center justify-center">
          <span className="font-display text-xs tracking-widest text-muted-foreground">
            MIRU
          </span>
        </div>
      )}
    </div>
  )
}

export function AnimeCard({
  anime,
  entry,
  selectable = false,
  selected = false,
  onSelectedChange,
}: {
  anime: Anime
  entry?: LibraryEntry
  selectable?: boolean
  selected?: boolean
  onSelectedChange?: (value: boolean) => void
}) {
  const { t } = useI18n()
  const { openDetail, addEntry, removeEntries, toggleFavorite } = useMiru()
  const progress = entry ? progressOf(entry) : 0
  const watched = entry?.watchedEpisodes.length ?? 0
  const total = anime.episodesTotal

  return (
    <article className="group relative transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30">
      <div className="relative overflow-hidden rounded-md">
        <button
          type="button"
          onClick={() => openDetail(entry?.anime ?? anime)}
          aria-label={t('a11y.openDetail', { title: displayTitle(anime) })}
          className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
        >
          <PosterFrame anime={anime} />

          {entry && !selectable && STAMP_KEY[entry.status] && (
            <span className="stamp">
              {t(STAMP_KEY[entry.status] as TranslationKey)}
            </span>
          )}

          {entry?.isFavorite && !selectable && (
            <span className="fav-ribbon">
              <Heart
                className="size-3.5 fill-white text-white"
                aria-hidden="true"
              />
              <span className="sr-only">{t('detail.favorite')}</span>
            </span>
          )}

          {entry?.userScore != null && (
            <span className="absolute bottom-3 left-2 flex items-center gap-1 rounded-md bg-surface/90 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground backdrop-blur">
              <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
              {entry.userScore.toFixed(1)}
            </span>
          )}

          {entry && progress > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 h-[10px] bg-black/60"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total ?? watched}
              aria-valuenow={watched}
              aria-label={
                total
                  ? t('detail.progress', { watched, total })
                  : t('detail.progressUnknown', { watched })
              }
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </button>

        {entry && !selectable && (
          <div className="absolute right-2 bottom-4 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => toggleFavorite(entry.id)}
              aria-pressed={entry.isFavorite}
              aria-label={
                entry.isFavorite
                  ? t('detail.favoriteRemove')
                  : t('detail.favoriteAdd')
              }
              className={cn(
                'flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background',
                entry.isFavorite ? 'text-[#ff3f6e]' : 'text-foreground',
              )}
            >
              <Heart
                className={cn(
                  'size-4',
                  entry.isFavorite && 'fill-[#ff3f6e]',
                )}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => removeEntries([entry.id])}
              aria-label={t('detail.remove')}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {!entry && !selectable && (
          <button
            type="button"
            onClick={() => addEntry(anime)}
            className="absolute right-2 bottom-4 flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Plus className="size-4 text-primary" aria-hidden="true" />
            <span className="sr-only">{t('detail.addToLibrary')}</span>
          </button>
        )}

        {entry && !selectable && !STAMP_KEY[entry.status] && (
          <span
            className={cn(
              'absolute top-2 left-2 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur',
              STATUS_TAG[entry.status],
            )}
          >
            {t(STATUS_KEY[entry.status])}
          </span>
        )}

        {selectable && (
          <div className="absolute top-2 right-2 rounded-full bg-background/85 p-1 backdrop-blur">
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => onSelectedChange?.(Boolean(value))}
              aria-label={t('library.select', { title: anime.title })}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => openDetail(entry?.anime ?? anime)}
        aria-label={t('a11y.openDetail', { title: displayTitle(anime) })}
        className="mt-2 block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
      >
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-pretty text-foreground">
          {displayTitle(anime)}
        </h3>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {[anime.year, anime.type, total ? `${total} ep` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </button>
    </article>
  )
}
