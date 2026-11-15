# Issue Q1 (P1) — Build rotta: 3 moduli importati assenti + TS7053

Stato: 待処理 · Creato: 18/08/2026 · Area: frontend

## Sintomo

`pnpm typecheck`/`next build` falliscono:

```
app/explore/page.tsx(3,29): TS2307 — 'components/views/explore-view' non trovato
app/settings/page.tsx(3,30): TS2307 — 'components/views/settings-view' non trovato
components/app-shell.tsx(7,35): TS2307 — 'components/anime-detail-dialog' non trovato
components/views/home-view.tsx(293,22): TS7053 — indice string su Record<ActivityAction,string>
```

## Origine

I tre file sono importati (`app-shell.tsx:7,118`, `explore/page.tsx:3,9`, `settings/page.tsx:3,9`) ma non esistono sul disco. Il dizionario i18n (`lib/i18n.tsx`) contiene già tutte le chiavi `explore.*`, `settings.*`, `detail.*`, `a11y.*` — la UI era progettata e non è stata re-committata. `.next/` è residuo di una build precedente e maschera l'errore in dev.

## Risoluzione

Task `docs/plan/tasks/ui-000.md` — parità 1:1 con design system, nessuna dipendenza nuova.

Stato: 已修复 → spostare in `docs/issues/archived/` quando `ui-000` è merged.