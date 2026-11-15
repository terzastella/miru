id: found-003
scope: auth
status: pending
depends-on: [found-002]
---

## Objective

Modulo auth completo e collaudato, conforme spec §5:

1. better-auth (ADR-03) configurato con: email+password (Argon2id), verifica email obbligatoria per sync multi-dispositivo, reset password con token a scadenza 15 min, 2FA TOTP opzionale, sessioni access token (15 min) + refresh token rotanti (30 gg, hashati in DB, revocabili).
2. OAuth Google + Discord tramite variabili d'ambiente (funzionante quando chiavi presenti; skip in CI).
3. Rate limiting (spec §17) su register/login/reset: 5 tentativi/15 min per IP. Implementazione leggera: middleware Next o helper di route, no dipendenza nuova se possibile (se serve, `@upstash/ratelimit`-like con Redis dall'ADR-04 — valutare in review).
4. Route wrapper `app/api/auth/*` con envelope §8 (`{data, meta, error}` + `error.code` machine-readable) — vedi ADR-06 in `lib-001` per il formato: definire qui l'helper `envelope()` in `server/common/envelope.ts` come unico punto di verità.
5. Endpoint utente: `GET/PATCH /api/users/me`, `DELETE /api/users/me` (soft-delete + anonimizzazione dati personali, periodo di grazia 30gg — GDPR §5).
6. Gestione sessioni attive: elenco dispositivi e revoca (spec §7.7).

## Context

- `docs/plan/analysis/architecture-decisions.md` (ADR-03)
- Spec tecnica §5 (auth completa), §8 (contratto), §17 (rate limiting, GDPR)
- Task `found-002` (le tabelle users/oauth_accounts nascono qui)

## Path

- `server/auth/*` (config better-auth, route handlers), `server/common/envelope.ts`, `app/api/auth/*/route.ts`, `app/api/users/me/route.ts`, `docs/INDEX.md` (se aggiunge moduli), `package.json` (dipendenze auth)

## Verification

- Test integration (vitest + DB test): register → verify email → login → accesso route protetta → refresh → logout → refresh successivo deve fallire (rotazione/revoca).
- Reset password: token scade dopo 15 min (test con orologio fake o configurazione breve in test).
- Rate limit: 6° tentativo login sbagliato in 15 min → 429 con `error.code` coerente.
- 2FA: abilitazione, login senza codice → rifiutato, con codice → ok.
- `DELETE /api/users/me` anonimizza i record personali; le voci di libreria restano utilizzabili da altri flussi (o cancellate come da decisione documentata nei review).