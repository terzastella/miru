/**
 * Logica pura di stato: validazione, merge degli import e date locali.
 * Vive fuori da `store.tsx` per poter essere testata senza React.
 */
import type {
  ActivityAction,
  ActivityRecord,
  Anime,
  LibraryEntry,
  LibraryStatus,
  MiruExport,
  Preferences,
} from './types'

export const ACTIVITY_LIMIT = 300

export type PersistedShape = {
  entries: LibraryEntry[]
  activity: ActivityRecord[]
  preferences: Preferences
  dismissedRecommendations: string[]
}

export const DEFAULT_PREFERENCES: Preferences = {
  locale: 'it',
  libraryView: 'grid',
  librarySort: 'updated_desc',
  displayName: '',
}

/* ------------------------------------------------------------ validazione */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback: string | null = null) {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number | null = null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)))].sort(
    (a, b) => a - b,
  )
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((s): s is string => typeof s === 'string')
}

const LIBRARY_STATUSES: LibraryStatus[] = [
  'plan',
  'watching',
  'onhold',
  'dropped',
  'done',
]

const ACTIVITY_ACTIONS: ActivityAction[] = [
  'added',
  'status_changed',
  'episode_watched',
  'episode_unwatched',
  'rated',
  'removed',
  'favorited',
  'unfavorited',
  'rewatched',
  'notes_updated',
  'tags_updated',
]

/** Ricostruisce un `Anime` valido: i campi mancanti o sbagliati diventano default. */
function sanitizeAnime(value: unknown): Anime | null {
  if (!isRecord(value)) return null
  const id = asString(value.id)
  const title = asString(value.title)
  if (!id || !title) return null

  return {
    id,
    malId: asNumber(value.malId),
    anilistId: asNumber(value.anilistId),
    kitsuId: asNumber(value.kitsuId),
    title,
    titleEnglish: asString(value.titleEnglish),
    titleJapanese: asString(value.titleJapanese),
    synopsis: asString(value.synopsis),
    imageUrl: asString(value.imageUrl),
    bannerUrl: asString(value.bannerUrl),
    type: (asString(value.type) as Anime['type']) ?? null,
    episodesTotal: asNumber(value.episodesTotal),
    durationMinutes: asNumber(value.durationMinutes),
    score: asNumber(value.score),
    year: asNumber(value.year),
    season: (asString(value.season) as Anime['season']) ?? null,
    airingStatus: (asString(value.airingStatus) as Anime['airingStatus']) ?? null,
    nextEpisodeAt: asString(value.nextEpisodeAt),
    genres: asStringArray(value.genres),
    studios: asStringArray(value.studios),
    source: (asString(value.source) as Anime['source']) ?? 'cache',
  }
}

/** Una voce di libreria valida, o `null` se inutilizzabile. */
export function sanitizeEntry(value: unknown): LibraryEntry | null {
  if (!isRecord(value)) return null
  const animeId = asString(value.animeId)
  const anime = sanitizeAnime(value.anime)
  if (!animeId || !anime) return null

  const status = asString(value.status) as LibraryStatus | null
  const now = new Date().toISOString()

  return {
    id: asString(value.id) || uid(),
    animeId,
    anime,
    status: status && LIBRARY_STATUSES.includes(status) ? status : 'plan',
    isFavorite: value.isFavorite === true,
    userScore: asNumber(value.userScore),
    watchedEpisodes: asNumberArray(value.watchedEpisodes),
    rewatchCount: Math.max(0, asNumber(value.rewatchCount, 0) ?? 0),
    notes: asString(value.notes, '') ?? '',
    customTags: asStringArray(value.customTags),
    startedAt: asString(value.startedAt),
    finishedAt: asString(value.finishedAt),
    addedAt: asString(value.addedAt) ?? now,
    updatedAt: asString(value.updatedAt) ?? now,
    clientVersion: asNumber(value.clientVersion, 1) ?? 1,
    deletedAt: asString(value.deletedAt),
  }
}

/** Un record di attività valido, o `null`. */
export function sanitizeActivity(value: unknown): ActivityRecord | null {
  if (!isRecord(value)) return null
  const id = asString(value.id)
  const animeTitle = asString(value.animeTitle)
  const createdAt = asString(value.createdAt)
  if (!id || !animeTitle || !createdAt) return null

  const action = asString(value.action) as ActivityAction | null

  return {
    id,
    entryId: asString(value.entryId),
    animeTitle,
    action: action && ACTIVITY_ACTIONS.includes(action) ? action : 'added',
    metadata: isRecord(value.metadata)
      ? (value.metadata as Record<string, string | number | null>)
      : undefined,
    createdAt,
  }
}

export function sanitizePreferences(value: unknown): Preferences {
  if (!isRecord(value)) return DEFAULT_PREFERENCES
  const locale = asString(value.locale) === 'en' ? 'en' : 'it'
  const libraryView = asString(value.libraryView) === 'list' ? 'list' : 'grid'
  const librarySort = asString(value.librarySort) ?? DEFAULT_PREFERENCES.librarySort
  return {
    locale,
    libraryView,
    librarySort: librarySort as Preferences['librarySort'],
    displayName: asString(value.displayName, '') ?? '',
  }
}

/**
 * Interpreta il contenuto di `localStorage`.
 * Restituisce `null` quando la struttura è inutilizzabile: il chiamante deve
 * mettere il blob in quarantena invece di sovrascriverlo con uno stato vuoto.
 */
export function parsePersistedState(raw: string): PersistedShape | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null
  if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.activity)) return null

  return {
    entries: parsed.entries
      .map(sanitizeEntry)
      .filter((entry): entry is LibraryEntry => entry !== null),
    activity: parsed.activity
      .map(sanitizeActivity)
      .filter((record): record is ActivityRecord => record !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, ACTIVITY_LIMIT),
    preferences: sanitizePreferences(parsed.preferences),
    dismissedRecommendations: asStringArray(parsed.dismissedRecommendations),
  }
}

/** Normalizza un backup importato prima del merge. */
export function sanitizeExport(payload: unknown): MiruExport | null {
  if (!isRecord(payload)) return null
  if (payload.entries !== undefined && !Array.isArray(payload.entries)) return null

  return {
    schemaVersion: 1,
    exportedAt: asString(payload.exportedAt) ?? new Date().toISOString(),
    preferences: sanitizePreferences(payload.preferences),
    entries: Array.isArray(payload.entries)
      ? payload.entries
          .map(sanitizeEntry)
          .filter((entry): entry is LibraryEntry => entry !== null)
      : [],
    activity: Array.isArray(payload.activity)
      ? payload.activity
          .map(sanitizeActivity)
          .filter((record): record is ActivityRecord => record !== null)
      : [],
  }
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

/** Data del calendario locale in formato `YYYY-MM-DD` (non UTC). */
export function localISODate(date: Date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

/**
 * Unisce un backup importato allo stato corrente.
 *
 * - voci: per `animeId`, vince il record con `updatedAt` più recente; episodi visti
 *   e tag sono unioni, il contatore rewatch è il massimo;
 * - attività: unione per `id`, più recente prima, massimo `ACTIVITY_LIMIT` record;
 * - preferenze: quelle del backup sovrascrivono il default ma non il locale scelto.
 */
export function mergeLibraryState(
  prev: PersistedShape,
  payload: MiruExport,
): { state: PersistedShape; imported: number } {
  const safe = sanitizeExport(payload)
  if (!safe) return { state: prev, imported: 0 }

  let imported = 0
  const byAnime = new Map(prev.entries.map((entry) => [entry.animeId, entry]))
  // Un backup può usare id di voce diversi dai nostri: mappiamo per non perdere
  // l'aggancio tra storico (`entryId`) e voce di libreria.
  const idMap = new Map<string, string>()

  for (const incoming of safe.entries) {
    if (!incoming?.animeId || !incoming.anime) continue
    const existing = byAnime.get(incoming.animeId)
    imported += 1

    if (!existing) {
      const localId = incoming.id || uid()
      if (incoming.id) idMap.set(incoming.id, localId)
      byAnime.set(incoming.animeId, { ...incoming, id: localId })
      continue
    }

    if (incoming.id && incoming.id !== existing.id) {
      idMap.set(incoming.id, existing.id)
    }

    const newest =
      new Date(incoming.updatedAt ?? 0) > new Date(existing.updatedAt)
        ? incoming
        : existing

    byAnime.set(incoming.animeId, {
      ...existing,
      ...newest,
      id: existing.id,
      watchedEpisodes: [
        ...new Set([...existing.watchedEpisodes, ...(incoming.watchedEpisodes ?? [])]),
      ].sort((a, b) => a - b),
      customTags: [
        ...new Set([...existing.customTags, ...(incoming.customTags ?? [])]),
      ],
      rewatchCount: Math.max(existing.rewatchCount, incoming.rewatchCount ?? 0),
    })
  }

  const activityById = new Map(prev.activity.map((record) => [record.id, record]))
  for (const record of safe.activity) {
    if (activityById.has(record.id)) continue
    const mappedEntryId = record.entryId
      ? (idMap.get(record.entryId) ?? record.entryId)
      : record.entryId
    activityById.set(record.id, { ...record, entryId: mappedEntryId })
  }

  const activity = [...activityById.values()]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, ACTIVITY_LIMIT)

  return {
    state: {
      ...prev,
      entries: [...byAnime.values()],
      activity,
      preferences: { ...prev.preferences, ...safe.preferences },
    },
    imported,
  }
}
