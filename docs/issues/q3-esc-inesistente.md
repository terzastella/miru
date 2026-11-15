# Issue Q3 (P3) — Spec §17: `esc()` dichiarato ma inesistente (gap G7)

Stato: 待处理 · Creato: 18/08/2026 · Area: spec / sicurezza

## Descrizione

La spec §17 afferma: "il prototipo ha già una funzione `esc()` per HTML escaping nei template string — pattern da mantenere". Verifica su tutto il codice (`app`, `components`, `lib`): **nessuna funzione `esc` esiste** e non c'è alcun `dangerouslySetInnerHTML` (i contenuti esterni sono già escapati da React per costruzione).

Il rischio XSS favorevole oggi è nullo; il requisito diventa attivo quando introdurremo rendering markdown per le note personali e contenuti esterni nel DOM (`detail.notes` supporta markdown in §7.3).

## Azione

- Correggere la riga spec o annotare che il requisito è "da implementare" quando arriva il markdown (B24 in `docs/plan/backlog.md`).
- Nessun task urgente: registrato come non-blocking nel backlog Fase 7.

Stato: 已修复 → archiviare quando la spec viene corretta (aggiornamento in `docs/INDEX.md` contestuale al primo aggiornamento spec).