id: found-001
scope: repo / tooling / CI
status: pending
depends-on: []
---

## Objective

Baseline di repository e tooling, abilitante per tutti gli altri task:

1. `git init` nel repo (oggi non è un repo git), `.gitignore` adeguato (niente `.env`, `.next`, `node_modules`, `coverage`).
2. Standardizzare il package manager (oggi doppio lockfile: `package-lock.json` + `pnpm-lock.yaml`): scegliere **pnpm**, rimuovere `package-lock.json`, documentare nel README.
3. `docker-compose.yml` in `infra/` con PostgreSQL 16 + Redis 7 (porte dedicate per env local; volume nominato per persistenza).
4. `.env.example` con `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, chiavi OAuth Google/Discord vuote, `NEXT_PUBLIC_*` necessari.
5. Script npm: `typecheck` (tsc --noEmit), `test:unit` (vitest run), `test:e2e` (playwright test), `lint` esistente.
6. CI GitHub Actions (`.github/workflows/ci.yml`): su ogni PR lint + typecheck + build; su merge in main integration/e2e (staging).
7. README.md di setup locale: `pnpm install`, `docker compose up -d`, seed DB, `pnpm dev`.

## Context

- `docs/plan/analysis/architecture-decisions.md` (ADR-01, ADR-02)
- Spec tecnica §20 (CI/CD), §21 (struttura repo)

## Path

- `.gitignore`, `.github/workflows/ci.yml`, `infra/docker-compose.yml`, `.env.example`, `package.json` (scripts), `package-lock.json` (rimozione), `README.md`, `docs/INDEX.md` (aggiornamento se serve)

## Verification

- `pnpm typecheck` e `pnpm lint` passano (sul codice esistente: la build resta rotta fino a `ui-000`; si accetta che typecheck fallisca SOLO per i TS2307/TS7053 già documentati — registrare come finding non-blocking nei review).
- `docker compose up -d` avvia postgres e redis; `docker compose down` li ferma.
- GitHub Actions file valido sintatticamente (nessuna esecuzione possibile senza remoto: da segnalare nel review come limitazione).
- README step ripercorribili su macchina pulita.