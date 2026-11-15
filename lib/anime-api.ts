import { parseSearchQuery, isValidDetailId } from './anime-query'
import { catalogAnime, getCatalog, queryCatalog } from './catalog'
import { isDesktop } from './net'

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

/**
 * Sostituto di `fetch` per le rotte `/api/anime/*`.
 *
 * - nel browser (sviluppo web) va sul server Next, come sempre;
 * - nell'app desktop non esiste un server: la stessa logica di
 *   `lib/anime-sources.ts` gira dentro la webview e restituisce una
 *   `Response` equivalente, così i chiamanti non cambiano.
 *
 * Prima della rete si consulta il catalogo precaricato (`lib/catalog.ts`):
 * ricerca, consigliati e dettaglio dei titoli più noti sono immediati.
 */
export async function animeFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (!isDesktop()) return fetch(input, init)

  const url = new URL(input, 'http://miru.local')
  const params = url.searchParams
  const catalog = await getCatalog()

  try {
    if (url.pathname === '/api/anime/search') {
      const query = parseSearchQuery(params)

      if (catalog) {
        const local = queryCatalog(catalog, query)
        // con una ricerca testuale senza risultati locali vale la pena uscire in rete
        if (local.items.length > 0 || !query.q) return json(local)
      }

      const { searchAnime } = await import('./anime-sources')
      return json(await searchAnime(query))
    }

    const match = url.pathname.match(/^\/api\/anime\/([^/]+)$/)
    if (match) {
      const id = decodeURIComponent(match[1])
      if (!isValidDetailId(id)) return json({ error: 'invalid_id' }, 400)

      const local = catalog ? catalogAnime(catalog, id) : null
      if (local) {
        // gli episodi arrivano dal totale: nessuna richiesta per aprire la scheda
        return json({ anime: local, episodes: [], source: local.source, stale: false })
      }

      const { getAnimeDetail } = await import('./anime-sources')
      const result = await getAnimeDetail(id)
      return json(result, result.anime ? 200 : 503)
    }
  } catch (error) {
    console.log('[miru] api desktop fallita', (error as Error).message)
    return json({ error: 'upstream_failed' }, 503)
  }

  return fetch(input, init)
}
