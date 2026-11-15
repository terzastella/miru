# NOTES — MIRU desktop (handoff)

## Obiettivo
MIRU come app Windows portable (Tauri v2): finestra nativa, niente browser, niente Node
a runtime. Aggiornato 15/11/2026: icona, layout fluido, catalogo precaricato.

## Stato (verificato a schermo)
- `dist/MIRU.exe` ~14.7 MB, finestra massimizzata, icona MIRU in barra del titolo.
- Splash primo avvio: scarica 1213 titoli in IndexedDB (~15s, progress reale).
- Secondo avvio: nessuna splash, Home/Consigliati già pieni.
- Ricerca locale: "gintama" → 6 risultati in <2s, zero rete.
- Layout: nessun overflow orizzontale da 900 a 1920 px; dettaglio a 1024 dentro il viewport
  (`node scripts/check-layout.mjs` con `npm start` attivo).
- Scrollbar: thumb scuro arrotondato senza frecce (globals.css), niente barra nativa.
- `tsc --noEmit` = 0. Web build invariata (`/api/anime/*` attive).

## Architettura in breve
- Build statica Next (`MIRU_DESKTOP=1`), route API escluse via `pageExtensions`
  (`app/api/**/route.handler.ts`).
- Desktop: `lib/anime-api.ts` risponde agli stessi path `/api/anime/*` eseguendo
  `lib/anime-sources.ts` in webview; prima consulta `lib/catalog.ts` (IndexedDB).
- Rete esterna dal processo Rust (`lib/net.ts` → plugin-http): niente CORS.
- Icona: `tools/make-icon.ps1` → `npx tauri icon tools/miru-icon.png`.

## Comandi
`npm run desktop:dev` | `desktop:build` | `desktop:portable` | `npm run build`

## Da sapere
- Rust compila solo nell'env MSVC: `scripts/tauri.mjs` chiama `vcvars64.bat`.
- Jikan è bloccato da questa rete: ricerca/dettaglio passano da AniList (~7s il primo
  tentativo Jikan, poi fallback). Il catalogo locale evita quasi sempre l'attesa.
- Dati: `%LOCALAPPDATA%\app.miru.desktop` (localStorage + IndexedDB `miru-catalog`).
- `MIRU.exe` + `tools/launcher.cs` in radice = vecchio launcher, superfluo.
- `public/icon.svg` è ancora il segnaposto v0 (favicon web): non usato dall'exe.
- Doc: `docs/desktop-app.md`.

## Prossimi passi possibili
- CSP restrittiva (ora `null`), installer NSIS (`npx tauri build`), favicon web,
  refresh manuale del catalogo dalle Impostazioni, dimensione catalogo configurabile.
