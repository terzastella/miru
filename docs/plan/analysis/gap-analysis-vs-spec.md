# Gap Analysis — Prototipo attuale vs Specifica Tecnica MIRU

Data: 18/08/2026 · Committente: developer · Scopo: individuare ogni scarto tra codice esistente e spec §1-§23, con evidenza file:line e azione concreta per ciascun gap. Base per lo split dei task in `../tasks/`.

## 0. Sintesi esecutiva

Il prototipo è architettonicamente più avanti di quanto la spec dichiari ("prototipo con localStorage"): fa già da proxy server-side verso Jikan/AniList/Kitsu con fallback a catena, ha i18n it/en completa, export/import JSON versionato, statistiche, filtri combinatori e ordinamenti. Tre problemi strutturali lo separano dalla "production-grade":

1. **La build non compila** — 3 moduli importati non esistono (`components/views/explore-view.tsx`, `components/views/settings-view.tsx`, `components/anime-detail-dialog.tsx`) + errore TS in `components/views/home-view.tsx:293`. Lo stato `.next/` è residuo di una build precedente.
2. **Nessuna persistenza server** — tutto vive in `localStorage` (`lib/store.tsx`), senza auth, senza multi-dispositivo, senza offline.
3. **Nessuna feature Fase 2-8** — sync, PWA, calendario, notifiche, import/export MAL, osservabilità, sicurezza: tutto assente.

Stima di portata: Fase 0+1 ≈ 6-8 giorni lavorativi (su 1 dev full-stack), Fasi 2-8 ≈ 10-14 settimane come da spec §22.

## 1. Checklist §23 "definition of done" — stato puntuale

| # | Requisito spec | Stato | Evidenza |
|---|---|---|---|
| 1 | Dati sopravvivono a cancellazione cache browser | ✗ | Solo `localStorage` (`store.tsx:57-82`) |
| 2 | Funziona offline con sync automatico | ✗ | Nessun SW, IndexedDB, coda mutazioni |
| 3 | Login multi-dispositivo + conflitti gestiti | ✗ | Nessun auth backend |
| 4 | Usabile quando tutte le fonti esterne sono giù | ▲ | Cache in-memory + flag `stale` (`anime-sources.ts:544`) — ma cache **non persiste tra restart** del server; va in Redis/anime_catalog |
| 5 | Voto, note, tag, rewatch | ✓ | `store.tsx:345-367` |
| 6 | Calendario uscite settimanali | ✗ | Assente |
| 7 | Notifiche in-app + Web Push | ✗ | Assente |
| 8 | Export JSON + MAL XML; import MAL XML | ▲ | Export/import JSON MIRU presente (`store.tsx:381-428`); MAL XML mancante |
| 9 | Ordinamento e filtri combinabili | ✓ | `library-view.tsx:65-96` (stati multi-select, tag, minScore, ricerca) |
| 10 | Navigabile da tastiera, focus trap, contrasto AA | ▲ | Base UI (Radix/base-ui) gestisce focus trap e ARIA; **nessun `:focus-visible` custom e nessun `prefers-reduced-motion` in `globals.css`** (grep=0 match); contrasto `--text-dim` non verificato |
| 11 | 2 lingue, zero stringhe hardcoded | ▲ | i18n it/en completa (`i18n.tsx`); **violazioni**: `activityText` duplicato dentro `home-view.tsx:29-56` invece che nel dizionario |
| 12 | Virtualizzazione griglia >1000 voci | ✗ | Grid CSS pura (`anime-card.tsx`), nessuna virtualizzazione |
| 13 | Rate limiting, CSP, validazione, escaping | ▲ | Validazione input su search/detail (`app/api/anime/*/route.ts`); **niente rate limiting globale, niente CSP, niente `esc()`** (la spec §17 afferma che `esc()` esiste nel prototipo: falso — React escape di default e non c'è `dangerouslySetInnerHTML`, quindi il requisito resta "da costruire" per note markdown future) |
| 14 | Test automatici critici in CI | ✗ | Nessun test, nessuna CI |
| 15 | Error tracking + logging + alerting | ✗ | Solo `console.log('[v0] …')` (`anime-sources.ts:541,623`) |
| 16 | PWA installabile, Lighthouse >90 | ✗ | Nessun `manifest.json`, nessun SW |
| 17 | Eliminazione account GDPR | ✗ | Assente |
| 18 | README setup + API docs + spec aggiornata | ▲ | Spec presente ma non salvata nel repo (`docs/INDEX.md` la riferisce come `../SPEC-TECNICA.md`: va materializzata nel repo) |

## 2. Feature-by-feature (§7) rispetto al codice

| Feature | Stato | Evidenza / nota |
|---|---|---|
| 7.1 Home — statistiche, continua a guardare, consigliati, attività | ✓ | `home-view.tsx`; i consigliati escludono già libreria e dismissed (`home-view.tsx:94-99`). Mancano: streak giorni (nuova metrica), "in uscita questa settimana" (dipende da calendario) |
| 7.2 Libreria — filtri, sort, viste, bulk | ✓ | `library-view.tsx`, `sortEntries` (`store.tsx:511-532`), bulk status+delete. Gap: sort per "data ultimo aggiornamento" c'è (`updated_desc` ✓), manca sort per data inizio/fine visione (non in spec obbligatorio — ok); ordinamento per progresso % ✓ |
| 7.3 Dettaglio anime | ✗ | **Modulo assente**: `components/anime-detail-dialog.tsx` importato da `app-shell.tsx:7,118` ma non creato. Funzioni store pronte (`entryFor`, `toggleEpisode`, `setScore`, `setNotes`, `setTags`, `registerRewatch`, `activityFor`), manca tutta la UI. Preferito (ribbon) richiesto su card: verificabile a ripristino |
| 7.4 Consigliati | ✓ | Baseline generi presente + "Perché ti piace {genre}" (`home.recommendedWhy` in `i18n.tsx:46`). Manca: badge "Simile a {Titolo}", permanenza `dismissed_recommendations` server-side |
| 7.5 Esplora | ✗ | **Modulo assente**: `components/views/explore-view.tsx` non creato. Route API pronte (`/api/anime/search` con tutti i filtri della spec: tipo, stato, generi, minScore, anno 1917-2100, episodi, studio, sort, page) |
| 7.6 Calendario | ✗ | Assente |
| 7.7 Profilo/impostazioni | ✗ | **Modulo assente**: `components/views/settings-view.tsx` non creato. Esiste `useSWR`+preferences; mancano UI impostazioni, gestione sessione, notifiche, privacy |
| 7.8 Condivisione profilo pubblico | ✗ | Assente |

## 3. Architettura (§3-§6) — stato e scarti

| Area spec | Stato | Evidenza | Azione |
|---|---|---|---|
| §3 Client→backend proxy (mai fonti dirette dal browser) | ✓ | Tutte chiamate passano da route handler Next (`app/api/anime/search`) | — |
| §3 Cache Redis | ✗ | `Map` in-memory (`anime-sources.ts:49`) non condivisa tra processi/istanze, persa a ogni restart | Adapter Redis con fallback in-memory (`found-004`) |
| §6 Catena Jikan→AniList→Kitsu→cache | ✓ | `searchAnime` (`anime-sources.ts:494-547`) | — |
| §6 Circuit breaker | ✗ | Retry 1x su 429/5xx (`anime-sources.ts:96-109`), nessun breaker a soglia | `found-004` |
| §6 TTL differenziati (airing 6h / complete 7gg / search 1h) | ▲ | TTL piatti: search 30min, detail 12h, stale 7gg (`anime-sources.ts:45-47`) | allineare a spec |
| §6.4 Mapper normalizzati testati con fixture | ▲ | Mapper presenti (`fromJikan/fromAniList/fromKitsu`) ma **senza test né fixture**; normalizzazione generi tra fonti assente | `found-004` |
| §6.3 Job periodici (sync airing, cleanup cache) | ✗ | Assente | Fase 4 (`backlog.md`) |
| §5 Modalità ospite + upgrade path | ▲ | Guest banner/account: chiavi i18n presenti (`account.guest*`), nessuna UI account | Fase 1 `ui-001` + Fase 8 account UI |
| §4 Modello dati | ▲ | Tipi TS spec-compatibili (`lib/types.ts`) ma nessuno schema DB | `found-002` |
| §8 Envelope `{data, meta, error}` | ▲ | Route discovery ritornano risultato nudo; `meta.{source,stale}` solo dentro `SearchResult` | standardizzare in middleware/helper (`lib-001`) |
| §9 Sync + conflict resolution | ✗ | Assente; `clientVersion`/`deletedAt` già nel modello TS (`types.ts:71-72`) | Fase 2 |
| §10 Offline-first/PWA | ✗ | Assente | Fase 2 |
| §11 Notifiche | ✗ | Assente | Fase 4 |
| §12 MAL XML import/export | ✗ | Solo JSON MIRU | Fase 5 |
| §13 Ricerca/filtri | ✓ | Debounce `use-debounced.ts`, filtri combinabili | — |
| §14 A11y | ▲ | Radix/base-ui forne ARIA; mancano focus-visible globali, reduced-motion, audit | Fase 6 |
| §15 i18n | ▲ | Dizionari it/en; violazione `activityText` in `home-view.tsx` | Fase 6 |
| §16 Performance | ✗ | No code-splitting esplicito (Next lo fa per route), no virtualizzazione | Fase 6 |
| §17 Sicurezza | ▲ | Validazione input route discovery ok; niente rate limiting, CSP, headers | Fase 7 |
| §18 Testing | ✗ | Zero test | `tests-001` + fasi successive |
| §19 Osservabilità | ✗ | `console.log('[v0]…')` | Fase 7 |
| §20 CI/CD | ✗ | Nessuna CI | `found-001` |
| §21 Struttura repo | ▲ | Monolitico Next.js (scelta deliberata: vedi ADR-01) | — |
| §22 Roadmap | — | Pianificata in task Fase 0/1 + backlog 2-8 | — |

## 4. Bug e lacune concrete rilevati (da risolvere, non "backlog")

| # | Gravità | Descrizione | Evidenza |
|---|---|---|---|
| G1 | P1 | Build rotta: 3 moduli importati assenti | `tsc --noEmit` → TS2307 ×3 |
| G2 | P1 | TS7053 in home-view: indice string su `Record<ActivityAction,string>` | `home-view.tsx:293` |
| G3 | P2 | Dettaglio Kitsu impossibile: `getAnimeDetail` fa ricerca generica e `find` per id, quasi mai match → cade sempre su AniList | `anime-sources.ts:578-591` |
| G4 | P2 | Cache in-memory: TTL piatti non conformi a §6.2, nessuna persistenza | `anime-sources.ts:45-47` |
| G5 | P2 | `activityText` (azioni) duplicato fuori dal dizionario i18n | `home-view.tsx:29-56` |
| G6 | P3 | `next.config.mjs`/package.json con doppio lockfile (`package-lock.json` + `pnpm-lock.yaml`): standardizzare manager | root repo |
| G7 | P3 | Spec §17 afferma che `esc()` esiste nel prototipo: non esiste (grep=0). La riga spec va corretta o il requisito resta valido come "da implementare" | — |

Gli issue G1-G3 vanno risolti come prerequisito qualsiasi altra attività UI (`ui-000`).

## 5. Mappa dei file esistenti → ownership futuro

| File attuale | Ruolo attuale | Destino |
|---|---|---|
| `app/api/anime/*/route.ts` | Proxy discovery | Diventa modulo `server/discovery` + route con envelope §8 (`found-004`, `lib-001`) |
| `lib/anime-sources.ts` | Aggregatore fonti + cache in-memory | → `server/discovery/*` (mappers/ `cache/` `sources/`), mantiene export per route |
| `lib/store.tsx` | Store client (localStorage) | → `lib/persistence-adapter.ts` (LocalAdapter + ApiAdapter) + store ibrido (`ui-001`) |
| `lib/types.ts` | Tipi dominio | Diventa `packages/shared-types` **solo se** si apre il monorepo (ADR-01); intanto resta unico punto di verità |
| `lib/i18n.tsx` | Dizionari it/en | Esteso (leak: `activityText`) |
| `components/views/home-view.tsx` | Home | Invariato + streak/calendar home |
| `components/views/library-view.tsx` | Libreria | Invariato |
| `components/views/explore-view.tsx`, `settings-view.tsx`, `components/anime-detail-dialog.tsx` | **Assenti** | Da creare (`ui-000`) |

## 6. Priorità consigliate (ordine di esecuzione)

1. **Fix build** (`ui-000`) — prerequisito assoluto.
2. **Fase 0** (`found-001→004`) — fondazioni non visibili ma sbloccanti.
3. **Fase 1** (`lib-001`, `ui-001`) — parità funzionale su Postgres.
4. **`tests-001`** — blinda ciò che esiste prima di costruire sopra.
5. Backlog Fase 2-8 in ordine spec.

Dettagli operativi in `../tasks/*.md` e `../backlog.md`.