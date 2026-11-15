id: found-004
scope: server / discovery
status: pending
depends-on: [found-001]
---

## Objective

Indurimento del modulo discovery secondo spec §6 (senza cambiare la forma delle risposte verso il client):

1. Spostare `lib/anime-sources.ts` in `server/discovery/`:
   - `server/discovery/sources/{jikan,anilist,kitsu}.ts` — client HTTP per fonte
   - `server/discovery/mappers/` — `fromJikan`, `fromAniList`, `fromKitsu` estratti e **testati unitariamente** con fixture di risposta reale salvate in `server/discovery/__fixtures__/*.json`
   - `server/discovery/cache/` — `CacheAdapter` polimorfico (ADR-04): `RedisAdapter` (ioredis) + `MemoryAdapter` fallback
   - `server/discovery/circuit-breaker.ts` — opossum o implementazione propria minima: fonte che fallisce >N volte in X secondi viene saltata a favore del fallback per Y secondi
2. TTL per §6.2: search 1h, dettaglio airing 6h, dettaglio complete 7gg, stale servibile fino a 7gg (oggi: 30min/12h/7gg — gap G4).
3. Normalizzazione generi cross-fonte (§6.4): tabella di equivalenza (es. MAL "Slice of Life" ↔ AniList "Slice of Life", tassonomie Jikan-themed vs AniList) applicata in un unico mapper helper testato.
4. `meta: { source, cached, stale, fetchedAt }` garantito su ogni risposta, incluso il caso "tutte le fonti giù → che serve la cache locale/anime_catalog con `stale: true`" (oggi cache in-memory; con `found-002` si può servire da `anime_catalog`).
5. Fix del **gap G3**: dettaglio Kitsu via `https://kitsu.io/api/edge/anime/{id}` diretto (oggi ricerca generica con `find` — quasi mai match).
6. I route handler `app/api/anime/*` restano come thin wrapper; il client non deve cambiare nulla.

## Context

- `docs/plan/analysis/architecture-decisions.md` (ADR-04)
- Spec tecnica §6 (integrazione fonti, TTL, circuit breaker, mapper), §8 (envelope)
- `lib/anime-sources.ts` (codice di partenza), `lib/types.ts` (forme dati)
- Task `found-002` (tabella `anime_catalog` come cache persistente)

## Path

- `server/discovery/**`, `lib/anime-sources.ts` (rimozione o re-export deprecato finché `ui-000` non è mergiata), `app/api/anime/*/route.ts`, `docs/INDEX.md`, `package.json`

## Verification

- Unit test mapper: 1 fixture reale per fonte (Jikan search, AniList search, Kitsu search, Kitsu detail) → output `Anime` corretto, campi mancanti → `null` esplicito.
- Test fallback: mockando 429 su Jikan per 3 richieste consecutive il circuit breaker scatta e la catena serve AniList; con AniList giù a sua volta serve Kitsu; con tutte giù serve `anime_catalog`/cache con `meta.stale=true`.
- Test TTL: dettaglio airing scade dopo 6h; search dopo 1h (orologi fake).
- Test Redis: con `REDIS_URL` assente l'adapter degrada in-memory senza errori.
- `pnpm typecheck` pass.