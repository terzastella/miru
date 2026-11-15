'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { I18nProvider, type Locale } from './i18n'
import {
  type ActivityAction,
  type ActivityRecord,
  type Anime,
  displayTitle,
  type LibraryEntry,
  type LibraryStatus,
  type LibrarySort,
  type MiruExport,
  type Preferences,
  progressOf,
} from './types'

/**
 * Guest (local) persistence adapter.
 *
 * Every mutation goes through this store, so replacing `localAdapter` with a
 * fetch-based adapter against `/api/library` is the only change needed to move
 * the same UI onto Postgres + accounts.
 */

const STORAGE_KEY = 'miru.state.v1'

type PersistedState = {
  entries: LibraryEntry[]
  activity: ActivityRecord[]
  preferences: Preferences
  dismissedRecommendations: string[]
}

const defaultPreferences: Preferences = {
  locale: 'it',
  libraryView: 'grid',
  librarySort: 'updated_desc',
  displayName: '',
}

/** Lingua di partenza: quella del sistema, con italiano solo se il sistema è italiano. */
function detectLocale(): Preferences['locale'] {
  if (typeof navigator === 'undefined') return 'it'
  const languages = [navigator.language, ...(navigator.languages ?? [])]
  return languages.some((lang) => lang?.toLowerCase().startsWith('it')) ? 'it' : 'en'
}

const emptyState: PersistedState = {
  entries: [],
  activity: [],
  preferences: defaultPreferences,
  dismissedRecommendations: [],
}

const localAdapter = {
  read(): PersistedState {
    if (typeof window === 'undefined') return emptyState
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      // primo avvio: nessuna preferenza salvata, scegliamo la lingua dal sistema
      if (!raw) {
        return {
          ...emptyState,
          preferences: { ...defaultPreferences, locale: detectLocale() },
        }
      }
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      return {
        entries: parsed.entries ?? [],
        activity: parsed.activity ?? [],
        preferences: { ...defaultPreferences, ...(parsed.preferences ?? {}) },
        dismissedRecommendations: parsed.dismissedRecommendations ?? [],
      }
    } catch {
      return emptyState
    }
  },
  write(state: PersistedState) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.log('[v0] persist failed', (error as Error).message)
    }
  },
}

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function statusForEpisodes(
  entry: LibraryEntry,
  watchedEpisodes: number[],
): Partial<LibraryEntry> {
  const total = entry.anime.episodesTotal
  const patch: Partial<LibraryEntry> = {}
  if (total && total > 0 && watchedEpisodes.length >= total) {
    patch.status = 'done'
    patch.finishedAt = entry.finishedAt ?? today()
  } else if (watchedEpisodes.length > 0 || entry.startedAt) {
    patch.status = 'watching'
    patch.startedAt = entry.startedAt ?? today()
  } else {
    patch.status = 'plan'
  }
  return patch
}

export type Stats = {
  titles: number
  episodes: number
  minutes: number
  meanScore: number | null
  rewatches: number
  byStatus: Record<LibraryStatus, number>
  topGenres: { genre: string; count: number }[]
}

type StoreValue = {
  ready: boolean
  entries: LibraryEntry[]
  activity: ActivityRecord[]
  preferences: Preferences
  dismissed: string[]
  stats: Stats
  allTags: string[]
  entryFor: (animeId: string) => LibraryEntry | undefined
  addEntry: (anime: Anime, status?: LibraryStatus) => void
  removeEntries: (entryIds: string[]) => void
  updateEntry: (entryId: string, patch: Partial<LibraryEntry>) => void
  setStatus: (entryId: string, status: LibraryStatus) => void
  setStatusBulk: (entryIds: string[], status: LibraryStatus) => void
  toggleFavorite: (entryId: string) => void
  toggleEpisode: (entryId: string, episode: number) => void
  setEpisodes: (entryId: string, episodes: number[]) => void
  setScore: (entryId: string, score: number | null) => void
  setNotes: (entryId: string, notes: string) => void
  setTags: (entryId: string, tags: string[]) => void
  registerRewatch: (entryId: string) => void
  dismissRecommendation: (animeId: string) => void
  setPreferences: (patch: Partial<Preferences>) => void
  activityFor: (entryId: string) => ActivityRecord[]
  exportState: () => MiruExport
  importState: (payload: MiruExport) => number
  resetAll: () => void
  detailId: string | null
  detailSeed: Anime | null
  openDetail: (anime: Anime) => void
  closeDetail: () => void
  addOpen: boolean
  openAddDialog: () => void
  closeAddDialog: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function MiruProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState)
  const [ready, setReady] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailSeed, setDetailSeed] = useState<Anime | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    // idratazione: leggiamo localStorage prima di qualsiasi scrittura
    setState(localAdapter.read())
    setReady(true)
  }, [])

  useEffect(() => {
    // senza il guard su `ready` questo effetto girerebbe nella stessa commit
    // dell'idratazione e salverebbe lo stato vuoto iniziale sopra la libreria
    if (!ready) return
    localAdapter.write(state)
  }, [state, ready])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = state.preferences.locale
  }, [state.preferences.locale])

  const log = useCallback(
    (
      draft: PersistedState,
      action: ActivityAction,
      entry: LibraryEntry,
      metadata?: ActivityRecord['metadata'],
    ): PersistedState => ({
      ...draft,
      activity: [
        {
          id: uid(),
          entryId: entry.id,
          animeTitle: displayTitle(entry.anime),
          action,
          metadata,
          createdAt: new Date().toISOString(),
        },
        ...draft.activity,
      ].slice(0, 300),
    }),
    [],
  )

  const mutate = useCallback(
    (
      entryId: string,
      patch: (entry: LibraryEntry) => Partial<LibraryEntry>,
      logging?: (
        entry: LibraryEntry,
      ) => { action: ActivityAction; metadata?: ActivityRecord['metadata'] } | null,
      options?: { touch?: boolean },
    ) => {
      setState((prev) => {
        const target = prev.entries.find((e) => e.id === entryId)
        if (!target) return prev
        const touch = options?.touch ?? true
        const next: LibraryEntry = {
          ...target,
          ...patch(target),
          updatedAt: touch ? new Date().toISOString() : target.updatedAt,
          clientVersion: target.clientVersion + 1,
        }
        let draft: PersistedState = {
          ...prev,
          entries: prev.entries.map((e) => (e.id === entryId ? next : e)),
        }
        const event = logging?.(next)
        if (event) draft = log(draft, event.action, next, event.metadata)
        return draft
      })
    },
    [log],
  )

  const addEntry = useCallback(
    (anime: Anime, status: LibraryStatus = 'plan') => {
      setState((prev) => {
        if (prev.entries.some((e) => e.animeId === anime.id)) return prev
        const now = new Date().toISOString()
        const entry: LibraryEntry = {
          id: uid(),
          animeId: anime.id,
          anime,
          status,
          isFavorite: false,
          userScore: null,
          watchedEpisodes: [],
          rewatchCount: 0,
          notes: '',
          customTags: [],
          startedAt: status === 'watching' ? today() : null,
          finishedAt: status === 'done' ? today() : null,
          addedAt: now,
          updatedAt: now,
          clientVersion: 1,
          deletedAt: null,
        }
        return log({ ...prev, entries: [entry, ...prev.entries] }, 'added', entry, {
          status,
        })
      })
    },
    [log],
  )

  const removeEntries = useCallback((entryIds: string[]) => {
    setState((prev) => {
      const removed = prev.entries.filter((e) => entryIds.includes(e.id))
      return {
        ...prev,
        entries: prev.entries.filter((e) => !entryIds.includes(e.id)),
        activity: [
          ...removed.map((entry) => ({
            id: uid(),
            entryId: null,
            animeTitle: displayTitle(entry.anime),
            action: 'removed' as ActivityAction,
            createdAt: new Date().toISOString(),
          })),
          ...prev.activity,
        ].slice(0, 300),
      }
    })
  }, [])

  const setStatus = useCallback(
    (entryId: string, status: LibraryStatus) => {
      mutate(
        entryId,
        (entry) => {
          const patch: Partial<LibraryEntry> = { status }
          if (status === 'watching' && !entry.startedAt) patch.startedAt = today()
          if (status === 'done') {
            patch.finishedAt = entry.finishedAt ?? today()
          }
          return patch
        },
        () => ({ action: 'status_changed', metadata: { status } }),
      )
    },
    [mutate],
  )

  const setStatusBulk = useCallback(
    (entryIds: string[], status: LibraryStatus) => {
      for (const id of entryIds) setStatus(id, status)
    },
    [setStatus],
  )

  const value = useMemo<StoreValue>(() => {
    const stats = computeStats(state.entries)
    const allTags = [
      ...new Set(state.entries.flatMap((e) => e.customTags)),
    ].sort((a, b) => a.localeCompare(b))

    return {
      ready,
      entries: state.entries,
      activity: state.activity,
      preferences: state.preferences,
      dismissed: state.dismissedRecommendations,
      stats,
      allTags,
      entryFor: (animeId) => state.entries.find((e) => e.animeId === animeId),
      addEntry,
      removeEntries,
      updateEntry: (entryId, patch) => mutate(entryId, () => patch),
      setStatus,
      setStatusBulk,
      toggleFavorite: (entryId) =>
        mutate(
          entryId,
          (entry) => ({ isFavorite: !entry.isFavorite }),
          (entry) => ({ action: entry.isFavorite ? 'favorited' : 'unfavorited' }),
          { touch: false },
        ),
      toggleEpisode: (entryId, episode) =>
        mutate(
          entryId,
          (entry) => {
            const has = entry.watchedEpisodes.includes(episode)
            const watchedEpisodes = has
              ? entry.watchedEpisodes.filter((n) => n !== episode)
              : [...entry.watchedEpisodes, episode].sort((a, b) => a - b)
            return {
              watchedEpisodes,
              ...statusForEpisodes(entry, watchedEpisodes),
            }
          },
          (entry) => ({
            action: entry.watchedEpisodes.includes(episode)
              ? 'episode_watched'
              : 'episode_unwatched',
            metadata: { episode },
          }),
        ),
      setEpisodes: (entryId, episodes) =>
        mutate(entryId, (entry) => {
          const watchedEpisodes = [...episodes].sort((a, b) => a - b)
          return {
            watchedEpisodes,
            ...statusForEpisodes(entry, watchedEpisodes),
          }
        }),
      setScore: (entryId, score) =>
        mutate(
          entryId,
          () => ({ userScore: score }),
          () => ({ action: 'rated', metadata: { score } }),
        ),
      setNotes: (entryId, notes) => mutate(entryId, () => ({ notes })),
      setTags: (entryId, customTags) => mutate(entryId, () => ({ customTags })),
      registerRewatch: (entryId) =>
        mutate(
          entryId,
          (entry) => ({
            rewatchCount: entry.rewatchCount + 1,
            watchedEpisodes: [],
            status: 'watching',
            startedAt: today(),
            finishedAt: null,
          }),
          (entry) => ({
            action: 'rewatched',
            metadata: { count: entry.rewatchCount },
          }),
        ),
      dismissRecommendation: (animeId) =>
        setState((prev) => ({
          ...prev,
          dismissedRecommendations: [
            ...new Set([...prev.dismissedRecommendations, animeId]),
          ],
        })),
      setPreferences: (patch) =>
        setState((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, ...patch },
        })),
      activityFor: (entryId) => state.activity.filter((a) => a.entryId === entryId),
      exportState: () => ({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        preferences: state.preferences,
        entries: state.entries,
        activity: state.activity,
      }),
      importState: (payload) => {
        let imported = 0
        setState((prev) => {
          const byAnime = new Map(prev.entries.map((e) => [e.animeId, e]))
          for (const incoming of payload.entries ?? []) {
            if (!incoming?.animeId || !incoming.anime) continue
            const existing = byAnime.get(incoming.animeId)
            imported += 1
            if (!existing) {
              byAnime.set(incoming.animeId, { ...incoming, id: incoming.id || uid() })
              continue
            }
            // merge: newest updatedAt wins per record, watched episodes are unioned
            const newest =
              new Date(incoming.updatedAt ?? 0) > new Date(existing.updatedAt)
                ? incoming
                : existing
            byAnime.set(incoming.animeId, {
              ...existing,
              ...newest,
              id: existing.id,
              watchedEpisodes: [
                ...new Set([
                  ...existing.watchedEpisodes,
                  ...(incoming.watchedEpisodes ?? []),
                ]),
              ].sort((a, b) => a - b),
              customTags: [
                ...new Set([...existing.customTags, ...(incoming.customTags ?? [])]),
              ],
              rewatchCount: Math.max(existing.rewatchCount, incoming.rewatchCount ?? 0),
            })
          }
          return {
            ...prev,
            entries: [...byAnime.values()],
            preferences: { ...prev.preferences, ...(payload.preferences ?? {}) },
          }
        })
        return imported
      },
      resetAll: () => setState(emptyState),
      detailId,
      detailSeed,
      openDetail: (anime) => {
        setDetailSeed(anime)
        setDetailId(anime.id)
      },
      closeDetail: () => setDetailId(null),
      addOpen,
      openAddDialog: () => setAddOpen(true),
      closeAddDialog: () => setAddOpen(false),
    }
  }, [
    addEntry,
    addOpen,
    detailId,
    detailSeed,
    mutate,
    ready,
    removeEntries,
    setStatus,
    setStatusBulk,
    state,
  ])

  return (
    <StoreContext.Provider value={value}>
      <I18nProvider locale={state.preferences.locale as Locale}>
        {children}
      </I18nProvider>
    </StoreContext.Provider>
  )
}

export function useMiru() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useMiru must be used inside MiruProvider')
  return context
}

function computeStats(entries: LibraryEntry[]): Stats {
  const byStatus: Record<LibraryStatus, number> = {
    plan: 0,
    watching: 0,
    onhold: 0,
    dropped: 0,
    done: 0,
  }
  let episodes = 0
  let minutes = 0
  let rewatches = 0
  let scoreSum = 0
  let scoreCount = 0
  const genreCounter = new Map<string, number>()

  for (const entry of entries) {
    byStatus[entry.status] += 1
    const watched = entry.watchedEpisodes.length
    const total = entry.anime.episodesTotal ?? 0
    const rewatchEpisodes = entry.rewatchCount * total
    episodes += watched + rewatchEpisodes
    minutes += (watched + rewatchEpisodes) * (entry.anime.durationMinutes ?? 24)
    rewatches += entry.rewatchCount
    if (entry.userScore != null) {
      scoreSum += entry.userScore
      scoreCount += 1
    }
    for (const genre of entry.anime.genres) {
      genreCounter.set(genre, (genreCounter.get(genre) ?? 0) + 1)
    }
  }

  return {
    titles: entries.length,
    episodes,
    minutes,
    meanScore: scoreCount ? Number((scoreSum / scoreCount).toFixed(1)) : null,
    rewatches,
    byStatus,
    topGenres: [...genreCounter.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  }
}

export function sortEntries(entries: LibraryEntry[], sort: LibrarySort) {
  const copy = [...entries]
  switch (sort) {
    case 'title_asc':
      return copy.sort((a, b) => a.anime.title.localeCompare(b.anime.title))
    case 'title_desc':
      return copy.sort((a, b) => b.anime.title.localeCompare(a.anime.title))
    case 'score_desc':
      return copy.sort((a, b) => (b.userScore ?? -1) - (a.userScore ?? -1))
    case 'score_asc':
      return copy.sort((a, b) => (a.userScore ?? 11) - (b.userScore ?? 11))
    case 'added_desc':
      return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    case 'year_desc':
      return copy.sort((a, b) => (b.anime.year ?? 0) - (a.anime.year ?? 0))
    case 'progress_desc':
      return copy.sort((a, b) => progressOf(b) - progressOf(a))
    case 'updated_desc':
    default:
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
}
