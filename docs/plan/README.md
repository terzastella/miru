# Delivery Plan — README

Workflow: docs-sprint. Orchestratore legge questa README, il task file, le design docs in `context`, e gestisce il ciclo develop/verify.

## Struttura

```text
docs/plan/
├─ README.md
├─ analysis/
│  ├─ gap-analysis-vs-spec.md
│  └─ architecture-decisions.md
├─ tasks/
│  └─ {area}-{seq}.md
├─ reviews/            # generate da verify agent
└─ backlog.md          # fasi 2-8 + non-blocking findings
```

## Ciclo task

```text
pending ── depends-on all done ──► ready ──► in-progress ──► done
                                                │
                                             blocked
```

1. Orchestratore sceglie task `ready`, crea branch `task/{id}` e lo assegna a un develop agent.
2. Develop: legge task file + design docs in `context`, implementa solo `objective`, committa.
3. Verify: agente separato scrive `docs/plan/reviews/{id}-{seq}.md` (findings P1/P2/P3, blocking/non-blocking), conclude `pass` o `blocked`.
4. `pass` → merge su main, full test, task `done`, findings non-blocking in `backlog.md`.
   `blocked` → fix sul branch, re-verify.

## Vincoli del progetto

- Nessun worktree: **esecuzione seriale** finché il repo non ha remoto e setup CI (task `found-001`).
- Commit solo se richiesto dall'orchestratore.
- Linguaggio dei documenti: italiano. Identificatori di codice: inglese.
- Verifica minima per ogni task: `npm run typecheck` + test richiesti dal task.
- La specifica tecnica è la fonte di verità: se un task diverge dalla spec, aggiornare prima `../SPEC-TECNICA.md` e chiedere conferma.

## Definizione di stato

| Stato | Criterio |
|---|---|
| pending | Scritto, prerequisiti non pronti |
| ready | `depends-on` tutti `done` |
| in-progress | Assegnato a develop agent |
| done | Verificato `pass`, mergiato su main, full test ok |
| blocked | Findings P1/P2 non risolti |