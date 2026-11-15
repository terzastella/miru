import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ACTIVITY_LIMIT,
  localISODate,
  mergeLibraryState,
  type PersistedShape,
} from '../lib/library-merge'
import type { ActivityRecord, Anime, LibraryEntry, MiruExport } from '../lib/types'

function anime(id: string, title = 'Anime'): Anime {
  return {
    id,
    malId: null,
    anilistId: null,
    kitsuId: null,
    title,
    titleEnglish: null,
    titleJapanese: null,
    synopsis: null,
    imageUrl: null,
    bannerUrl: null,
    type: 'TV',
    episodesTotal: 12,
    durationMinutes: 24,
    score: 8,
    year: 2020,
    season: null,
    airingStatus: null,
    nextEpisodeAt: null,
    genres: [],
    studios: [],
    source: 'anilist',
  }
}

function entry(
  animeId: string,
  patch: Partial<LibraryEntry> = {},
): LibraryEntry {
  return {
    id: `entry-${animeId}`,
    animeId,
    anime: anime(animeId),
    status: 'plan',
    isFavorite: false,
    userScore: null,
    watchedEpisodes: [],
    rewatchCount: 0,
    notes: '',
    customTags: [],
    startedAt: null,
    finishedAt: null,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    clientVersion: 1,
    deletedAt: null,
    ...patch,
  }
}

function activity(id: string, createdAt: string): ActivityRecord {
  return {
    id,
    entryId: null,
    animeTitle: 'Anime',
    action: 'added',
    createdAt,
  }
}

function baseState(entries: LibraryEntry[] = []): PersistedShape {
  return {
    entries,
    activity: [],
    preferences: {
      locale: 'it',
      libraryView: 'grid',
      librarySort: 'updated_desc',
      displayName: '',
    },
    dismissedRecommendations: ['a', 'b'],
  }
}

test('importa una voce nuova e le assegna un id se manca', () => {
  const incoming = { ...entry('anilist:1'), id: '' }
  const payload = {
    schemaVersion: 1,
    exportedAt: '2026-01-02T00:00:00.000Z',
    preferences: {},
    entries: [incoming],
    activity: [],
  } as unknown as MiruExport

  const { state, imported } = mergeLibraryState(baseState(), payload)

  assert.equal(imported, 1)
  assert.equal(state.entries.length, 1)
  assert.ok(state.entries[0].id.length > 0)
})

test('unendo una voce esistente: episodi e tag in unione, rewatch al massimo, vince updatedAt', () => {
  const prev = baseState([
    entry('anilist:1', {
      status: 'watching',
      watchedEpisodes: [1, 3],
      customTags: ['shonen'],
      rewatchCount: 1,
      updatedAt: '2026-02-01T00:00:00.000Z',
      notes: 'locale',
    }),
  ])

  const payload = {
    schemaVersion: 1,
    exportedAt: '2026-03-01T00:00:00.000Z',
    preferences: {},
    entries: [
      entry('anilist:1', {
        status: 'done',
        watchedEpisodes: [2, 3],
        customTags: ['shonen', 'classico'],
        rewatchCount: 3,
        updatedAt: '2026-01-15T00:00:00.000Z',
        notes: 'dal backup',
      }),
    ],
    activity: [],
  } as unknown as MiruExport

  const { state } = mergeLibraryState(prev, payload)
  const merged = state.entries[0]

  assert.deepEqual(merged.watchedEpisodes, [1, 2, 3])
  assert.deepEqual(merged.customTags.sort(), ['classico', 'shonen'])
  assert.equal(merged.rewatchCount, 3)
  assert.equal(merged.status, 'watching')
  assert.equal(merged.notes, 'locale')
  assert.equal(merged.id, 'entry-anilist:1')
})

test('importa anche lo storico attività, senza duplicati e dal più recente', () => {
  const prev = baseState()
  prev.activity = [activity('a1', '2026-01-05T00:00:00.000Z')]

  const payload = {
    schemaVersion: 1,
    exportedAt: '2026-03-01T00:00:00.000Z',
    preferences: {},
    entries: [],
    activity: [
      activity('a1', '2026-01-05T00:00:00.000Z'),
      activity('a2', '2026-01-07T00:00:00.000Z'),
      activity('a3', '2026-01-06T00:00:00.000Z'),
    ],
  } as unknown as MiruExport

  const { state } = mergeLibraryState(prev, payload)

  assert.deepEqual(
    state.activity.map((record) => record.id),
    ['a2', 'a3', 'a1'],
  )
})

test("lo storico importato non supera il limite dell'attività", () => {
  const payload = {
    schemaVersion: 1,
    exportedAt: '2026-03-01T00:00:00.000Z',
    preferences: {},
    entries: [],
    activity: Array.from({ length: ACTIVITY_LIMIT + 50 }, (_, i) =>
      activity(`a${i}`, new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()),
    ),
  } as unknown as MiruExport

  const { state } = mergeLibraryState(baseState(), payload)

  assert.equal(state.activity.length, ACTIVITY_LIMIT)
})

test("l'import non tocca le preferenze locali non presenti nel backup", () => {
  const prev = baseState()
  const payload = {
    schemaVersion: 1,
    exportedAt: '2026-03-01T00:00:00.000Z',
    preferences: { locale: 'en' },
    entries: [],
    activity: [],
  } as unknown as MiruExport

  const { state } = mergeLibraryState(prev, payload)

  assert.equal(state.preferences.locale, 'en')
  assert.equal(state.preferences.libraryView, 'grid')
  assert.deepEqual(state.dismissedRecommendations, ['a', 'b'])
})

test('localISODate usa il calendario locale, non UTC', () => {
  const moment = new Date('2026-01-01T00:30:00Z')
  const local = moment.toLocaleDateString('sv-SE') // YYYY-MM-DD nel fuso locale
  assert.equal(localISODate(moment), local)
})
