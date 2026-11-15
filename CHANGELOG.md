# Changelog

Modifiche rilevanti di MIRU. Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/),
versioning [SemVer](https://semver.org/lang/it/).

## [Unreleased]

## [0.1.2] - 2026-11-15

### Fixed

- Gli eventi dello storico importati ora vengono riagganciati all'id locale della voce
  (`idMap` in `mergeLibraryState`): prima restavano legati all'id del backup e non
  comparivano nella scheda dell'anime (`activityFor` confronta l'id esatto).
- Se il salvataggio locale fallisce (quota piena o storage bloccato) l'utente vede un
  avviso, non solo una riga in console.

### Added

- Test dedicato al rimappaggio degli id tra backup e libreria locale.

## [0.1.1] - 2026-11-15

### Added

- Validazione runtime dei dati locali e dei backup importati (`lib/library-merge.ts`):
  JSON valido ma con tipi sbagliati viene normalizzato campo per campo, la struttura
  inutilizzabile viene rifiutata e messa in quarantena invece di sovrascritta.
- Test dedicati al fuso `Europe/Rome` (mezzanotte e mezza locale contro UTC) e a
  stati/backup malformati.
- Job CI `windows-latest` che compila l'eseguibile Tauri su tag e su richiesta manuale,
  calcola lo SHA-256 e carica l'artefatto.

## [0.1.0] - 2026-11-15

### Added

- Test unitari con `node:test` su merge dell'import, date locali e ricerca locale;
  la CI li esegue prima del build.
- App desktop Windows (Tauri v2 + WebView2) distribuita come singolo eseguibile
  portabile, accanto alla versione web Next.js 16.
- Catalogo locale precaricato (~1200 titoli da AniList) in IndexedDB, con schermata
  di avanzamento al primo avvio: ricerca, Esplora e Consigliati istantanei.
- Interfaccia IT/EN con lingua presa dal sistema al primo avvio e selettore in
  Impostazioni; `<html lang>` segue la preferenza.
- Export JSON, import con merge e export XML compatibile MyAnimeList.
- Documentazione bilingue (`README.md`, `README.it.md`) con screenshot per lingua,
  `SECURITY.md`, licenza MIT, note di release IT/EN.

### Changed

- Le chiamate a Jikan/AniList/Kitsu escono dal processo Rust (`tauri-plugin-http`):
  nessun vincolo CORS nella webview, host consentiti in `capabilities/default.json`.
- Nelle Impostazioni le select mostrano l'etichetta (`English`, `Dark`) e non il codice.
- Finestra desktop massimizzata all'avvio, layout fluido da 900 px in su.

### Fixed

- L'import di un backup ripristina anche lo storico attività, che prima veniva
  scartato (`mergeLibraryState` in `lib/library-merge.ts`).
- Se il salvataggio locale è illeggibile viene copiato in
  `miru.state.v1.corrupted.<timestamp>` invece di essere sovrascritto dallo stato vuoto.
- Le date di inizio/fine usano il calendario locale (`localISODate`) e non più UTC,
  che in Italia spostava la data di un giorno tra mezzanotte e l'una.
- La libreria non viene più sovrascritta con lo stato vuoto durante l'idratazione:
  il salvataggio è guardato da `ready` (`lib/store.tsx`).
- Il dettaglio anime fa fallback Jikan → AniList invece di restituire una cache vuota
  quando Jikan non risponde.
- Ricerca locale normalizzata (accenti e punteggiatura): "fullmetal alchemist
  brotherhood" trova "Fullmetal Alchemist: Brotherhood" senza uscire in rete.
- Scrollbar di sistema chiara sostituita da un thumb scuro coerente col tema.
- Nessun overflow orizzontale da 900 a 1920 px; il dettaglio si impila sotto i 1024 px.

### Security

- `next` aggiornato a 16.4.6 (advisory RCE sui server Next su Windows) e `shadcn`
  spostato tra le `devDependencies`: `npm audit --omit=dev` a 0 vulnerabilità.
- CSP attiva e ristretta: `img-src` ai CDN delle copertine, `connect-src` solo verso
  l'IPC di Tauri, `object-src`/`form-action`/`frame-ancestors` chiusi.
- Permessi Tauri minimi (nessun plugin fs/shell), devtools solo in debug.
- `.gitignore` copre `.env*`, editor e artefatti di build; `.gitattributes` impone LF.
