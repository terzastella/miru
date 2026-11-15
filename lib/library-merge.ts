/**
 * Logica pura di stato: merge degli import e date locali.
 * Vive fuori da `store.tsx` per poter essere testata senza React.
 */
import type {
  ActivityRecord,
  LibraryEntry,
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
  let imported = 0
  const byAnime = new Map(prev.entries.map((entry) => [entry.animeId, entry]))

  for (const incoming of payload.entries ?? []) {
    if (!incoming?.animeId || !incoming.anime) continue
    const existing = byAnime.get(incoming.animeId)
    imported += 1

    if (!existing) {
      byAnime.set(incoming.animeId, { ...incoming, id: incoming.id || uid() })
      continue
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
  for (const record of payload.activity ?? []) {
    if (!record?.id || !record.animeTitle) continue
    if (!activityById.has(record.id)) activityById.set(record.id, record)
  }

  const activity = [...activityById.values()]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, ACTIVITY_LIMIT)

  return {
    state: {
      ...prev,
      entries: [...byAnime.values()],
      activity,
      preferences: { ...prev.preferences, ...(payload.preferences ?? {}) },
    },
    imported,
  }
}
