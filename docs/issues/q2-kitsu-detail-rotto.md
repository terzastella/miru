# Issue Q2 (P2) — Dettaglio Kitsu in realtà impossibile (gap G3)

Stato: 待处理 · Creato: 18/08/2026 · Area: server/discovery

## Sintomo

`getAnimeDetail` per id `kitsu:{id}` esegue una **ricerca generica** (`searchKitsu({ q: undefined, page: 1 })`) e fa `.find((i) => i.id === id)` sui risultati (`lib/anime-sources.ts:578-591`). La ricerca senza query restituisce anime popolari che quasi mai includono l'id richiesto → il dettaglio Kitsu degrada sempre su AniList. Inoltre `ID_PATTERN` in `app/api/anime/[id]/route.ts` accetta id Kitsu non-numerici (`[a-zA-Z0-9-]{1,20}`) che `Number(rawId)` in AniList fallback romperebbe.

## Fix previsto

Chiamata diretta `GET https://kitsu.io/api/edge/anime/{id}` nel mapper Kitsu (task `found-004`, punto 5).

Stato: 已修复 → archiviare quando `found-004` è merged.