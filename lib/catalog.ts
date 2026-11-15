/**
 * Catalogo locale precaricato (solo app desktop).
 *
 * AniList non permette di scaricare "tutti" gli anime in una volta, quindi il
 * precaricamento prende i titoli che servono davvero: i più popolari e i più
 * votati (~1000-1200 record, 40 richieste, ~10s). Restano in IndexedDB e
 * alimentano ricerca, Esplora, Consigliati e Home senza toccare la rete.
 */
import {
  applyLocalFilters,
  fetchAniListPage,
  type SearchQuery,
  type SearchResult,
} from './anime-sources'
import { displayTitle, type Anime } from './types'

const DB_NAME = 'miru-catalog'
const STORE = 'state'
const KEY = 'catalog'
const TTL = 1000 * 60 * 60 * 24 * 7 // 7 giorni
const PAGE_SIZE = 24

export type Catalog = {
  items: Anime[]
  builtAt: number
}

type Plan = { sort: 'POPULARITY_DESC' | 'SCORE_DESC'; pages: number }

const PLAN: Plan[] = [
  { sort: 'POPULARITY_DESC', pages: 20 },
  { sort: 'SCORE_DESC', pages: 20 },
]

export const CATALOG_PAGES = PLAN.reduce((sum, p) => sum + p.pages, 0)

/* ----------------------------------------------------------- indexeddb */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(key)
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

/* ------------------------------------------------------------- memoria */

let memo: Catalog | null = null
let loading: Promise<Catalog | null> | null = null

export function isCatalogStale(catalog: Catalog): boolean {
  return Date.now() - catalog.builtAt > TTL
}

/** Catalogo in memoria; lo legge da IndexedDB la prima volta. */
export function getCatalog(): Promise<Catalog | null> {
  if (memo) return Promise.resolve(memo)
  if (!loading) {
    loading = idbGet<Catalog>(KEY)
      .then((value) => {
        if (value?.items?.length) memo = value
        return memo
      })
      .catch(() => null)
  }
  return loading
}

/* ----------------------------------------------------------------- build */

async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length)
  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor
      cursor += 1
      out[index] = await tasks[index]()
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
  )
  return out
}

/**
 * Scarica il catalogo. `onProgress` riceve pagine completate e anime raccolti,
 * così la splash screen può mostrare l'avanzamento reale.
 */
export async function buildCatalog(
  onProgress?: (pages: number, total: number, count: number) => void,
): Promise<Catalog> {
  let pagesDone = 0
  let count = 0
  const collected: Anime[][] = []

  for (const plan of PLAN) {
    const tasks = Array.from({ length: plan.pages }, (_, i) => async () => {
      const page = i + 1
      try {
        const result = await fetchAniListPage(plan.sort, page)
        pagesDone += 1
        count += result.items.length
        onProgress?.(pagesDone, CATALOG_PAGES, count)
        return result.items
      } catch {
        pagesDone += 1
        onProgress?.(pagesDone, CATALOG_PAGES, count)
        return [] as Anime[]
      }
    })
    const pages = await pool(tasks, 3)
    collected.push(...pages)
  }

  const seen = new Set<string>()
  const items: Anime[] = []
  for (const anime of collected.flat()) {
    if (seen.has(anime.id)) continue
    seen.add(anime.id)
    items.push(anime)
  }

  if (items.length === 0) throw new Error('catalogo vuoto')

  const catalog: Catalog = { items, builtAt: Date.now() }
  memo = catalog
  await idbPut(KEY, catalog).catch(() => undefined)
  return catalog
}

/* --------------------------------------------------------------- query */

/** Normalizzazione per la ricerca locale: minuscole, senza accenti né punteggiatura. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function haystack(anime: Anime) {
  return normalizeText(
    `${anime.title} ${anime.titleEnglish ?? ''} ${anime.titleJapanese ?? ''}`,
  )
}

/** Stessa forma di `searchAnime`, ma sui dati locali. */
export function queryCatalog(catalog: Catalog, query: SearchQuery): SearchResult {
  const needle = query.q ? normalizeText(query.q) : ''
  const base = needle
    ? catalog.items.filter((anime) => haystack(anime).includes(needle))
    : catalog.items.slice()

  const filtered = applyLocalFilters(base, query)

  if (query.sort === 'score') {
    filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  } else if (query.sort === 'newest') {
    filtered.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  } else if (query.sort === 'title') {
    filtered.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  }

  const page = query.page ?? 1
  const start = (page - 1) * PAGE_SIZE

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    hasMore: filtered.length > start + PAGE_SIZE,
    source: 'anilist',
    stale: false,
    degraded: false,
  }
}

export function catalogAnime(catalog: Catalog, id: string): Anime | null {
  return catalog.items.find((anime) => anime.id === id) ?? null
}
