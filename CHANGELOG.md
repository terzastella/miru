# Changelog

Modifiche rilevanti di MIRU. Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/),
versioning [SemVer](https://semver.org/lang/it/).

## [Unreleased]

## [0.1.3] - 2026-11-15

Prima release pubblica.

### Added

- App desktop Windows (Tauri v2 + WebView2) distribuita come singolo eseguibile
  portabile, accanto alla versione web Next.js 16.
- Libreria con stati (da vedere, in corso, in pausa, completati, droppati), preferiti,
  voto personale, note, tag e contatore rewatch.
- Progresso episodi casella per casella, con "segna tutti" e paginazione per le serie lunghe.
- Consigliati derivati dai generi seguiti, con "non mi interessa".
- Esplora con filtri (tipo, stato, anno, episodi, studio, generi, voto minimo) e ordinamenti.
- Ricerca con aggiunta rapida alla libreria.
- Export JSON, import con merge e export XML compatibile MyAnimeList.
- Catalogo locale precaricato (~1200 titoli da AniList) in IndexedDB, con schermata di
  avanzamento al primo avvio: ricerca, Esplora e Consigliati istantanei.
- Interfaccia IT/EN con lingua presa dal sistema al primo avvio e selettore in Impostazioni.
- Documentazione bilingue (`README.md`, `README.it.md`) con screenshot per lingua,
  `SECURITY.md`, licenza MIT, note di release IT/EN.
- Test unitari con `node:test` (stato, import, date, ricerca locale) eseguiti in CI.
- CI su GitHub Actions: type-check, test, build web, export desktop e job Windows che
  compila l'eseguibile Tauri sui tag e ne pubblica hash e artefatto.

### Changed

- Le chiamate a Jikan/AniList/Kitsu escono dal processo Rust (`tauri-plugin-http`):
  nessun vincolo CORS nella webview, host consentiti in `capabilities/default.json`.
- La finestra desktop si apre massimizzata e il layout è fluido da 900 px in su.
- Nelle Impostazioni le select mostrano l'etichetta (`English`, `Dark`) e non il codice.

### Fixed

- La libreria non viene sovrascritta con lo stato vuoto durante l'idratazione.
- L'import di un backup ripristina lo storico attività e riaggancia gli eventi all'id
  locale della voce (`idMap`), invece di lasciarli legati agli id del backup.
- Il dettaglio anime fa fallback Jikan → AniList quando la sorgente primaria non risponde.
- Ricerca locale normalizzata (accenti e punteggiatura): "fullmetal alchemist brotherhood"
  trova "Fullmetal Alchemist: Brotherhood" senza uscire in rete.
- Le date di inizio/fine usano il calendario locale, non UTC.
- Scrollbar di sistema chiara sostituita da un thumb scuro coerente col tema.
- Nessun overflow orizzontale da 900 a 1920 px; il dettaglio si impila sotto i 1024 px.

### Security

- `next` 16.4.6 e `shadcn` tra le `devDependencies`: `npm audit --omit=dev` a 0.
- CSP attiva e ristretta (immagini solo dai CDN delle copertine, `connect-src` solo IPC),
  permessi Tauri minimi, devtools solo in debug.
- Validazione runtime dello stato locale e dei backup; struttura inutilizzabile messa in
  quarantena, record parzialmente corrotti recuperati con avviso e copia dell'originale.
- `.gitignore` copre `.env*`, editor e artefatti di build; `.gitattributes` impone LF.
