# Backlog — Fasi 2-8 (dopo Fase 0+1)

Ogni voce è un futuro task (formato `docs/plan/tasks/`). Ordine = ordine della spec §22. Le voci in **grassetto** sono bloccanti per la release "completa" (§23).

## Fase 2 — Offline-first e sync (§9, §10)

| # | Voce | Dettagli chiave |
|---|---|---|
| B1 | **Coda mutazioni offline** | Dexie (IndexedDB) per: libreria offline, coda mutazioni `{id, entryId, clientVersion, changes, clientUpdatedAt}` duratura; sostituisce la coda volatile di `ui-001` |
| B2 | **Service Worker + Manifest** | Workbox: cache-first asset, network-first API read, Background Sync per la coda; `app/manifest.ts` con icone esistenti (`public/icon*`), `theme_color #0c0c10`, `display: standalone`; indicatore "Offline — sincronizzo" (toast riusabile) |
| B3 | **POST /api/library/sync** | Batch merge server-side: LWW per campo indipendente (§9), conflitto stesso campo → vince timestamp più recente, client perdente riceve `warnings[]`; notification di "aggiornato da altro dispositivo" |
| B4 | Cache immagini poster | Cache API TTL 30gg per locandine offline |

## Fase 3 — Feature mancanti core (§7.3, §7.6, §7.2)

| # | Voce | Dettagli chiave |
|---|---|---|
| B5 | **Calendario uscite** | Vista settimanale/mensile su `next_episode_at` per anime `airing` in libreria; click episodio → dettaglio |
| B6 | Vista lista densa AniList-style | Riga compatta (poster 32px, titolo, status, progresso, voto, tags) — estensione `library-view` |
| B7 | Streak giorni | Metrica giorni consecutivi con azione di tracking da `activity_log`; mostrata in Home |
| B8 | Consigliati v2 | Badge "Simile a {Titolo}" basato su top titolo completato con voto alto; persistenza `dismissed_recommendations` server-side |

## Fase 4 — Notifiche e job (§6.3, §11)

| # | Voce | Dettagli chiave |
|---|---|---|
| B9 | **Job periodici** | BullMQ: refresh ogni 6h di `anime_catalog` airing in libreria di ≥1 utente (aggiorna `next_episode_at`, episodi); cleanup cache stale >30gg |
| B10 | **Notifiche in-app** | `notifications` table, centro notifiche con badge non lette, marcatura read |
| B11 | **Web Push** | `push_subscriptions`, VAPID, trigger "nuovo episodio" solo con opt-in esplicito |
| B12 | Digest email settimanale | Opzionale, "Cosa guardare questa settimana" dal calendario; solo se preferenza attiva |

## Fase 5 — Import/Export (§12)

| # | Voce | Dettagli chiave |
|---|---|---|
| B13 | **Export MAL XML** | Generazione XML standard `<myanimelist>`; job async (`data_jobs`) + URL firmato 24h |
| B14 | **Import MAL XML** | Parsing stati MAL→interni, dry-run "verranno importati N, M duplicati", scelta skip/overwrite/merge per duplicati |
| B15 | Import AniList | Via OAuth AniList (o export JSON manuale) |
| B16 | Export/import server-side | Spostare i job su backend con polling `GET /api/data/export/:jobId`; mantiene il JSON locale come fallback |

## Fase 6 — A11y, i18n, performance (§14, §15, §16)

| # | Voce | Dettagli chiave |
|---|---|---|
| B17 | **Audit WCAG 2.1 AA** | `:focus-visible` globale, `prefers-reduced-motion` (o sfruttare `tw-animate-css`), contrasto `--text-dim` ≥4.5:1, audit axe + manuale NVDA su flussi critici |
| B18 | **i18n leak** | Estrarre `activityText` (`home-view.tsx:29-56`) nel dizionario; audit stringhe hardcoded |
| B19 | **Virtualizzazione griglia** | `@tanstack/react-virtual` su libreria >1000 voci senza lag |
| B20 | Code splitting + bundle | Analisi `vite-bundle-visualizer` (Next: `next-bundle-analyzer`), target <200KB gzip principale |

## Fase 7 — Osservabilità e sicurezza (§17, §19)

| # | Voce | Dettagli chiave |
|---|---|---|
| B21 | **Sentry frontend+backend** | Source maps, release tracking |
| B22 | Logging strutturato | JSON logs con request-id; mai payload sensibili |
| B23 | Metriche + alerting | Latenza endpoint, hit-rate cache, tasso fallback per fonte, alert su soglie Jikan |
| B24 | **Rate limiting globale + CSP** | Tutte le route, header di sicurezza, `esc()` per contenuto user-generated quando entrerà il markdown note (G7/Q7) |

## Fase 8 — Condivisione e polish (§7.8, §10)

| # | Voce | Dettagli chiave |
|---|---|---|
| B25 | Profilo pubblico `/u/{username}` | Solo se `is_profile_public`; libreria read-only + statistiche + preferiti |
| B26 | Card condivisa | Link pubblico al dettaglio |
| B27 | **Audit Lighthouse** | Performance/Accessibility/Best Practices/PWA ≥90; PWA installabile rifinita |
| B28 | Beta testing reale + fixes | Round di test con utenti veri, fixes da findings |

## Regole del backlog

- Una voce diventa task `ready` quando: dipendenze di Fase completate E orchestratore approva lo split (nuovi ADR/decisioni annotate in `architecture-decisions.md`).
- La definition of done finale = checklist §23, aggiornata in `gap-analysis-vs-spec.md` man mano che le voci si chiudono.