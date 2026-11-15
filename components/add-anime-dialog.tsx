'use client'

import { Loader2, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { animeFetch } from '@/lib/anime-api'
import { useI18n } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import { useDebounced } from '@/lib/use-debounced'
import { displayTitle, type Anime } from '@/lib/types'

type SearchResponse = {
  items: Anime[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AddAnimeDialog() {
  const { t } = useI18n()
  const { addOpen, closeAddDialog, addEntry, entryFor } = useMiru()

  const [query, setQuery] = useState('')
  const queryDebounced = useDebounced(query, 450)
  const [items, setItems] = useState<Anime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!addOpen) {
      setQuery('')
      setItems([])
      return
    }
  }, [addOpen])

  useEffect(() => {
    if (!addOpen) return
    const needle = queryDebounced.trim()
    if (!needle) {
      setItems([])
      return
    }
    setLoading(true)
    setError(false)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    animeFetch(`/api/anime/search?q=${encodeURIComponent(needle)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json() as Promise<SearchResponse>
      })
      .then((data) => setItems(data.items))
      .catch((cause: unknown) => {
        if ((cause as Error).name === 'AbortError') return
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [addOpen, queryDebounced])

  useEffect(() => () => abortRef.current?.abort(), [])

  function handleAdd(anime: Anime) {
    addEntry(anime)
    toast.success(t('add.toastAdded'))
  }

  return (
    <Dialog open={addOpen} onOpenChange={(open) => !open && closeAddDialog()}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="font-display text-2xl font-normal tracking-[0.08em]">
            {t('add.title')}
          </DialogTitle>
          <DialogDescription>{t('add.hint')}</DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('add.search')}
              aria-label={t('add.search')}
              className="rounded-full py-2.5 pr-4 pl-10"
            />
          </div>
        </div>

        <div className="mt-4 max-h-96 min-h-40 overflow-y-auto px-3 pb-4">
          {loading && (
            <p className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t('common.loading')}
            </p>
          )}

          {error && !loading && (
            <div className="flex flex-wrap items-center gap-3 px-2 py-6">
              <p className="text-sm text-muted-foreground">{t('common.error')}</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setQuery('')}>
                {t('common.retry')}
              </Button>
            </div>
          )}

          {!loading && !error && items.length === 0 && queryDebounced.trim() !== '' && (
            <p className="px-2 py-6 text-sm text-muted-foreground">
              {t('add.noResults')}
            </p>
          )}

          {!loading && items.length === 0 && queryDebounced.trim() === '' && (
            <p className="px-2 py-6 text-sm text-muted-foreground">{t('explore.search')}</p>
          )}

          <ul className="flex flex-col gap-1">
            {items.map((anime) => {
              const inLibrary = Boolean(entryFor(anime.id))
              return (
                <li
                  key={anime.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-2"
                >
                  <button
                    type="button"
                    onClick={() => !inLibrary && handleAdd(anime)}
                    disabled={inLibrary}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left disabled:cursor-default"
                    aria-label={t('a11y.openDetail', { title: displayTitle(anime) })}
                  >
                    {anime.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={anime.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-11 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="grain flex size-11 shrink-0 items-center justify-center rounded-sm bg-surface">
                        <span className="font-display text-[10px] tracking-widest text-muted-foreground">
                          MIRU
                        </span>
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {displayTitle(anime)}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {[anime.year, anime.type, anime.episodesTotal ? `${anime.episodesTotal} ep` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </button>
                  <Button
                    size="sm"
                    className="shrink-0 rounded-full"
                    variant={inLibrary ? 'outline' : 'default'}
                    onClick={() => !inLibrary && handleAdd(anime)}
                    disabled={inLibrary}
                  >
                    {inLibrary ? t('add.alreadyInLibrary') : t('add.add')}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
