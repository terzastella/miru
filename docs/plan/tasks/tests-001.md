id: tests-001
scope: qa / integration / e2e
status: pending
depends-on: [ui-001, found-004]
---

## Objective

Batteria di test che blinda Fase 0+1 e i flussi critici della spec §18, wired in CI (anche se non eseguibile senza remoto: script locali funzionanti):

1. **Unit**: già coperti i mapper (`found-004`), `updateProgress` (`found-002`), envelope/validators (`lib-001`). Qui: test `computeStats` server-side 1:1 col client (parità numeriche), e test `sortEntries` del client.
2. **Integration (vitest + Postgres test container)**: ogni endpoint di `lib-001` e `found-003` con casi di errore: fonte esterna giù → fallback → `meta.stale` (con msw/interceptor), 401/403, validazione.
3. **E2E (Playwright)** — i 4 flussi della spec §18:
   1. register → verify → login → aggiungi anime → segna episodio → logout → login su secondo browser context → dato presente (multi-dispositivo).
   2. Offline (Playwright `context.setOffline`) → mutazione in coda → online → sync arrivato (verifica `GET /api/library`).
   3. Import file JSON MIRU → libreria popolata (se la Fase 5 non esiste ancora, usare l'export/import JSON già presente in settings).
   4. Jikan mockato 429 → esplora mostra risultati con badge AniList corretto.
4. **a11y base**: axe-core nel setup Playwright sui 4 flussi di cui sopra (non sostituisce audit Fase 6).
5. Config: `playwright.config.ts` (webServer che avvia `pnpm dev` con DB test dedicato), `vitest.config.ts`, script `test:e2e`/`test:unit`. CI: job separati (spec §20).

## Context

- Spec tecnica §18 (testing strategy completa), §20 (CI)
- Task `found-002/003/004`, `lib-001`, `ui-001` (superfici da testare)
- `docs/plan/tasks/*` (verifiche già imposte dai singoli task confluiscono qui per i path critici)

## Path

- `vitest.config.ts`, `playwright.config.ts`, `tests/unit/**`, `tests/integration/**`, `tests/e2e/**`, `package.json` (script), `.github/workflows/ci.yml` (aggiunta job E2E)

## Verification

- `pnpm test:unit` e `pnpm test:e2e` verdi su macchina locale con `docker compose` su (l'e2e usa il DB di test).
- Il flusso 2 (offline→sync) dimostra sincronizzazione effettiva: righe in `library_entries` col `client_version` incrementato.
- Il flusso 4 dimostra `meta.source === 'anilist'` nel DOM (badge).
- Qualunque fallimento in CI segnalato come bloccante nei review (i test fanno parte della definition of done della Fase 1).