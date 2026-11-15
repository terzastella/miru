id: found-002
scope: db / schema
status: pending
depends-on: [found-001]
---

## Objective

Schema Postgres completo via Prisma, mappatura 1:1 con spec §4 + il mapping better-auth (ADR-03):

- Tabelle spec §4: `users`, `oauth_accounts`, `anime_catalog` (con indici GIN su titolo/generi), `anime_episodes` (UNIQUE anime_id+number), `library_entries` (UNIQUE user_id+anime_id, indice parziale su status WHERE deleted_at IS NULL, `client_version`, soft delete), `watched_episodes` (UNIQUE library_entry_id+episode_number), `activity_log`, `notifications`, `push_subscriptions`, `data_jobs`.
- Aggiunta richiesta dalla feature 7.4: `dismissed_recommendations (user_id, anime_id)`.
- Trigger/app-level per mantenere `progress_episodes` di `library_entries` coerente con `watched_episodes` (spec §4 nota) — implementazione: funzione prisma `updateProgress` riusata da tutti i punti di mutazione.
- `prisma migrate dev --name init`, seed script con 5-10 righe di `anime_catalog` (dati finti ma realistici) per test di fallback a cache locale.
- Stato di default della spec §4 rispettato: `locale 'it'`, `theme 'dark'`, `timezone 'Europe/Rome'`, password_hash nullable (OAuth-only), ecc.

## Context

- `docs/plan/analysis/architecture-decisions.md` (ADR-02, ADR-03, ADR-05)
- Spec tecnica §4 (schema DB completo), §5 (auth), §9 (sync — colonne già previste)
- `lib/types.ts` (già allineato al modello)

## Path

- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `infra/docker-compose.yml` (se serve variare nome db), `docs/INDEX.md` (punto a schema), `package.json` (prisma scripts)

## Verification

- `pnpm prisma migrate dev` su postgres locale applica il migrate pulito da zero.
- `pnpm prisma db seed` popola `anime_catalog`.
- Migrazione idempotente: `migrate reset` + `migrate dev` da zero non produce conflitti.
- Uno unit test (vitest) verifica che `updateProgress` mantenga il contatore sync con `watched_episodes` in 3 scenari (aggiunta, rimozione, riordinamento fuori ordine).