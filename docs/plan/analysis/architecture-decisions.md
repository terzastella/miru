# Decisioni architetturali (ADR)

Stato: proposto dagli sviluppatori, da confermare prima dell'inizio di `found-001`. Ogni ADR cita la sezione di spec a cui deroga e il perché.

## ADR-01: Monolite Next.js vs monorepo (spec §2, §21)

**Decisione**: mantenere il singolo app Next.js esistenti. Niente monorepo `apps/web + apps/api` nel breve periodo.

- Il backend "API" è già espresso come route handler Next (`app/api/*`) — separarlo in un servizio Node distinto richiederebbe duplicare il proxy discovery, la gestione auth-session e il deploy, senza beneficio funzionale.
- La struttura server viene organizzata in `server/` (discovery, library, auth, jobs) così da poter estrarre `apps/api` in futuro senza riscritture.
- Tipi condivisi: già in `lib/types.ts`; se un giorno servirà un client non-Next, si estrae `packages/shared-types` da lì.
- **Trigger per riconsiderare**: load test con >50 concorrenti simultanei, necessità di worker scollegati dal web tier, o secondo client (mobile).

## ADR-02: ORM/migrazioni — Prisma + PostgreSQL (spec §2, §4)

**Decisione**: Prisma con `prisma migrate` versionato nel repo.

- Schema spec §4 mappabile 1:1 (UUID, `TIMESTAMPTZ`, array PG, JSONB per `source_data`/`metadata`).
- Migrazioni deterministiche in CI/staging/production (spec §20: "mai modifiche manuali al DB").
- Alternativa valutata: Drizzle — più leggero ma meno strumentato per audit/seed; Prisma ha generazione client+tipi TS condivisibili col frontend.

## ADR-03: Auth — better-auth (spec §5, §17)

**Decisione**: `better-auth` (email+password Argon2id, OAuth Google/Discord, verifica email, reset password con scadenza, 2FA TOTP, refresh token rotanti revocabili) esposto dietro route `/api/auth/*` con envelope §8. Rate limiting per IP su register/login/reset (5 tentativi/15min, spec §17).

- La richiesta di sessioni JWT access(15m)+refresh(30gg rotante, hashato in DB, revocabile) è il modello nativo di better-auth.
- alternative: Auth.js v5 — richiede lavoro custom per credential provider + refresh rotation; lucia dismesso. better-auth copre §5 senza codice custom.
- **Nota spec**: le tabelle `users`/`oauth_accounts` della spec §4 sono la proiezione delle tabelle better-auth: si mappano in `found-002`.

## ADR-04: Cache discovery — adapter Redis con fallback in-memory (spec §6.2)

**Decisione**: `lib/anime-sources.ts` viene spostato in `server/discovery/` con `CacheAdapter` polimorfico (`RedisAdapter` usando `ioredis` + `MemoryAdapter` di fallback se `REDIS_URL` assente o irraggiungibile). TTL per §6.2: search 1h, airing 6h, complete 7gg, stale serve fino a 7gg con flag.

- Se Redis è giù, il sistema degrada alla cache in-memory attuale (mai errori 5xx verso il client).
- `Meta source/cached/stale/fetchedAt` già presente (`SearchResult`) diventa parte dell'envelope globale §8 su ogni risposta discovery.

## ADR-05: Sync offline — approccio incrementale a due endpoint (spec §9)

**Decisione**: mantenere il modello dati già predisposto (`clientVersion`, `updatedAt`, soft-delete in `lib/types.ts:65-72`) e in Fase 2 implementare:

- `GET /api/library/sync?since=<ts>` (delta pull) e `POST /api/library/sync` (batch mutazioni con `clientVersion`).
- Risoluzione: LWW per campo indipendente (§9) — già parzialmente implementata in `importState` per la union di `watchedEpisodes` (`store.tsx:400-420`), da generalizzare e spostare server-side.
- Questa ADR è dichiarata ora perché condiziona lo schema `found-002` (indici su `updated_at`, colonna `client_version` già prevista).

## ADR-06: Lingua dei documenti e convenzioni

- Documentazione di progetto in italiano (audience: committente), identificatori di codice e commit in inglese.
- La spec §21 propone monorepo: applicato solo il principio "il codice server è separato dal codice client in cartelle distinte" (`server/` vs `components/`), senza cambiare la struttura fisica finché ADR-01 regge.
- Commit message: conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).