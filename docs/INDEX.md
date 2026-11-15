# MIRU — Indice documentazione

Riferimento architetturale: `../SPEC-TECNICA.md` (specifica completa, sez. 0-23).

| Area | Doc | Contenuto |
|---|---|---|
| Piano di delivery | `plan/README.md` | Workflow docs-sprint: analysis → tasks → develop → verify → merge |
| Gap analysis | `plan/analysis/gap-analysis-vs-spec.md` | Stato attuale del prototipo vs specifica §23, mappato file-per-file |
| Decisioni architetturali | `plan/analysis/architecture-decisions.md` | ADR: monolith Next.js, Prisma, better-auth, Redis adapter, envelope API |
| Task Fase 0 | `plan/tasks/found-*.md` | Fondamenta: tooling/CI, DB schema, auth, discovery hardening |
| Task Fase 1 | `plan/tasks/ui-000.md`, `lib-001.md`, `ui-001.md`, `tests-001.md` | Parità col prototipo su architettura solida |
| Backlog | `plan/backlog.md` | Fasi 2-8 (offline/sync, calendario, notifiche, import/export, a11y, osservabilità, condivisione) |
| Issues | `issues/*.md` | Inconsistenze/bug rilevati in analisi |
| App desktop | `desktop-app.md` | Build Tauri v2 (`dist/MIRU.exe`), architettura statica, comandi |

## Stato attuale (18/08/2026)

- Prototipo Next.js 16: **build verde** (fix `ui-000` completato — 3 moduli ripristinati: explore-view, settings-view, anime-detail-dialog + fix TS).
- Discovery server-side con fallback Jikan→AniList→Kitsu→cache in-memory: presente e operativo (verificato: fallback AniList funzionante sotto rate-limit Jikan).
- Libreria UI completa lato client su localStorage (modalità ospite).
- Nessun backend persistente, nessuna auth, nessuna PWA/offline/sync.
- Prossimo: Fase 0 (`found-001` tooling+CI → `found-002` schema → `found-003` auth → `found-004` discovery hardening).
- Dettagli in `plan/analysis/gap-analysis-vs-spec.md`.