/**
 * MIRU — domain model.
 * Mirrors the Postgres schema of the technical spec (anime_catalog, library_entries,
 * watched_episodes, activity_log) so the local adapter can be swapped for a real
 * backend without touching the UI layer.
 */

export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music'
export type AiringStatus = 'airing' | 'complete' | 'upcoming'
export type Season = 'winter' | 'spring' | 'summer' | 'fall'
export type SourceName = 'jikan' | 'anilist' | 'kitsu' | 'cache'

/** Normalized catalog record — the shape every external source is mapped into. */
export type Anime = {
  /** Stable id: `${source}:${sourceId}` (mal id preferred). */
  id: string
  malId: number | null
  anilistId: number | null
  kitsuId: number | null
  title: string
  titleEnglish: string | null
  titleJapanese: string | null
  synopsis: string | null
  imageUrl: string | null
  bannerUrl: string | null
  type: AnimeType | null
  episodesTotal: number | null
  durationMinutes: number | null
  score: number | null
  year: number | null
  season: Season | null
  airingStatus: AiringStatus | null
  nextEpisodeAt: string | null
  genres: string[]
  studios: string[]
  source: SourceName
}

export type EpisodeInfo = {
  number: number
  title: string | null
  airDate: string | null
}

export type LibraryStatus = 'plan' | 'watching' | 'onhold' | 'dropped' | 'done'

export const LIBRARY_STATUSES: LibraryStatus[] = [
  'plan',
  'watching',
  'onhold',
  'dropped',
  'done',
]

export type LibraryEntry = {
  id: string
  animeId: string
  /** Snapshot of catalog data: the app stays usable when every source is down. */
  anime: Anime
  status: LibraryStatus
  isFavorite: boolean
  userScore: number | null
  watchedEpisodes: number[]
  rewatchCount: number
  notes: string
  customTags: string[]
  startedAt: string | null
  finishedAt: string | null
  addedAt: string
  updatedAt: string
  clientVersion: number
  deletedAt: string | null
}

export type ActivityAction =
  | 'added'
  | 'status_changed'
  | 'episode_watched'
  | 'episode_unwatched'
  | 'rated'
  | 'removed'
  | 'favorited'
  | 'unfavorited'
  | 'rewatched'
  | 'notes_updated'
  | 'tags_updated'

export type ActivityRecord = {
  id: string
  entryId: string | null
  animeTitle: string
  action: ActivityAction
  metadata?: Record<string, string | number | null>
  createdAt: string
}

export type Preferences = {
  locale: 'it' | 'en'
  libraryView: 'grid' | 'list'
  librarySort: LibrarySort
  displayName: string
}

export type LibrarySort =
  | 'title_asc'
  | 'title_desc'
  | 'score_desc'
  | 'score_asc'
  | 'added_desc'
  | 'updated_desc'
  | 'year_desc'
  | 'progress_desc'

export const LIBRARY_SORTS: LibrarySort[] = [
  'updated_desc',
  'added_desc',
  'title_asc',
  'title_desc',
  'score_desc',
  'score_asc',
  'year_desc',
  'progress_desc',
]

/** Export envelope — versioned, per spec §12. */
export type MiruExport = {
  schemaVersion: 1
  exportedAt: string
  preferences: Preferences
  entries: LibraryEntry[]
  activity: ActivityRecord[]
}

export function progressOf(entry: LibraryEntry): number {
  const total = entry.anime.episodesTotal
  const watched = entry.watchedEpisodes.length
  if (!total || total <= 0) return watched > 0 ? 0.5 : 0
  return Math.min(1, watched / total)
}

/** Title to show in the UI: English when available, romaji otherwise. */
export function displayTitle(anime: Anime): string {
  return anime.titleEnglish?.trim() ? anime.titleEnglish : anime.title
}
