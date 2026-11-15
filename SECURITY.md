# Security policy

## Versioni supportate

MIRU è alla 0.1.x: solo l'ultima release riceve correzioni di sicurezza.

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa **Security → Report a vulnerability** su GitHub
(Private vulnerability reporting) oppure scrivi a `terzastella` tramite il profilo
GitHub, indicando:

- versione di MIRU e di Windows;
- passi per riprodurre, con il minimo dettaglio necessario;
- impatto che immagini (dati locali, rete, esecuzione di codice).

Risposta attesa entro 7 giorni. Se il problema riguarda una dipendenza, allega
l'output di `npm audit --omit=dev` e la versione installata.

## Ambito

In ambito: l'app desktop (`src-tauri/`), il codice web in `app/` e `lib/`, il
contenuto pubblicato delle release.

Fuori ambito: vulnerabilità nei servizi esterni (Jikan, AniList, Kitsu) e nei loro
contenuti, problemi che richiedono un accesso fisico alla macchina già compromessa,
falsi positivi di scanner su dipendenze di sviluppo non incluse nell'eseguibile.

## Cosa fa MIRU con i tuoi dati

Nessun account, nessun backend, nessuna telemetria: libreria e catalogo restano in
`%LOCALAPPDATA%\app.miru.desktop`. Le uniche richieste di rete sono verso le tre
API pubbliche sopra. L'elenco degli host consentiti è in
`src-tauri/capabilities/default.json`.
