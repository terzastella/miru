import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeText, queryCatalog, type Catalog } from '../lib/catalog'
import type { Anime } from '../lib/types'

function anime(patch: Partial<Anime> & { id: string }): Anime {
  return {
    malId: null,
    anilistId: null,
    kitsuId: null,
    title: patch.id,
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
    ...patch,
  }
}

const catalog: Catalog = {
  builtAt: Date.now(),
  items: [
    anime({ id: 'jikan:1', title: 'Fullmetal Alchemist: Brotherhood', score: 92, year: 2009 }),
    anime({ id: 'jikan:2', title: 'Cowboy Bebop', score: 86, year: 1998 }),
    anime({ id: 'jikan:3', title: 'Bocchi the Rock!', score: 88, year: 2022 }),
  ],
}

test('normalizeText ignora accenti, punteggiatura e spazi doppi', () => {
  assert.equal(normalizeText('  Fullmetal  Alchemist: Brotherhood!  '), 'fullmetal alchemist brotherhood')
  assert.equal(normalizeText('Pòkemòn'), 'pokemon')
})

test('la ricerca locale trova il titolo anche senza i due punti', () => {
  const result = queryCatalog(catalog, { q: 'fullmetal alchemist brotherhood', page: 1 })
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].id, 'jikan:1')
  assert.equal(result.hasMore, false)
})

test('ordina per voto decrescente quando richiesto', () => {
  const result = queryCatalog(catalog, { sort: 'score', page: 1 })
  assert.deepEqual(
    result.items.map((item) => item.id),
    ['jikan:1', 'jikan:3', 'jikan:2'],
  )
})

test('paginazione: 24 per pagina, hasMore coerente', () => {
  const many: Catalog = {
    builtAt: Date.now(),
    items: Array.from({ length: 30 }, (_, i) => anime({ id: `jikan:${i + 100}` })),
  }

  const first = queryCatalog(many, { page: 1 })
  const second = queryCatalog(many, { page: 2 })

  assert.equal(first.items.length, 24)
  assert.equal(first.hasMore, true)
  assert.equal(second.items.length, 6)
  assert.equal(second.hasMore, false)
})

test('una query senza corrispondenze restituisce zero risultati', () => {
  const result = queryCatalog(catalog, { q: 'zzzzz', page: 1 })
  assert.equal(result.items.length, 0)
  assert.equal(result.hasMore, false)
})
