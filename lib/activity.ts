/**
 * Shared activity labels — single source for the human-readable text of each
 * ActivityAction. Extracted from `components/views/home-view.tsx` so that both the
 * home feed and the anime detail history render identical labels.
 *
 * Note: these strings are intentionally outside the i18n dictionary for now
 * (backlog G5/B18) — the type-safe lookup is the fix delivered here.
 */

import type { Locale } from './i18n'
import type { ActivityAction } from './types'

const ACTIVITY_TEXT: Record<Locale, Record<ActivityAction, string>> = {
  it: {
    added: 'aggiunto alla libreria',
    status_changed: 'stato aggiornato',
    episode_watched: 'episodio segnato',
    episode_unwatched: 'episodio rimosso',
    rated: 'votato',
    removed: 'rimosso',
    favorited: 'tra i preferiti',
    unfavorited: 'via dai preferiti',
    rewatched: 'rewatch iniziato',
    notes_updated: 'note aggiornate',
    tags_updated: 'tag aggiornati',
  },
  en: {
    added: 'added to library',
    status_changed: 'status updated',
    episode_watched: 'episode marked',
    episode_unwatched: 'episode cleared',
    rated: 'rated',
    removed: 'removed',
    favorited: 'favorited',
    unfavorited: 'unfavorited',
    rewatched: 'rewatch started',
    notes_updated: 'notes updated',
    tags_updated: 'tags updated',
  },
}

export function activityLabel(locale: Locale, action: ActivityAction) {
  return ACTIVITY_TEXT[locale][action]
}