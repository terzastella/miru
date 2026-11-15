# MIRU desktop (Tauri v2)

L'app desktop è la stessa UI Next.js dentro una finestra nativa (WebView2), senza
browser e senza Node.js a runtime.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run desktop:dev` | finestra Tauri contro il dev server Next (`localhost:3000`), hot reload |
| `npm run desktop:build` | exe in `src-tauri/target/release/MIRU.exe` (nessun installer) |
| `npm run desktop:portable` | come sopra + copia in `dist/MIRU.exe` |
| `npm run build` / `npm start` | versione web (route API attive), invariata |

Requisiti macchina di sviluppo: Rust (target `x86_64-pc-windows-msvc`) e i
Build Tools VS con workload C++. `scripts/tauri.mjs` cerca `vcvars64.bat` e
prepara l'ambiente MSVC da solo (qui `link.exe` non era nel PATH).

Sulla macchina dell'utente serve solo **WebView2 Runtime** (preinstallato su
Windows 11 e sulla maggior parte dei Windows 10). `dist/MIRU.exe` è un singolo
file: nessuna installazione, nessun Node.js.

## Come è fatto

- Build statica: `MIRU_DESKTOP=1 next build` → `output: 'export'` + `trailingSlash`.
  Gli asset finiscono in `out/`, che Tauri impacchetta nell'exe.
- Le route `app/api/**` sono `route.handler.ts`: incluse solo nella build web
  (`pageExtensions` esclude l'estensione `handler.ts` nel build desktop).
- Nel desktop il client non chiama `/api/anime/*` via HTTP: `lib/anime-api.ts`
  interpreta lo stesso path e invoca `lib/anime-sources.ts` dentro la webview,
  restituendo una `Response` equivalente. I componenti non cambiano.
- Le chiamate a Jikan/AniList/Kitsu escono dal processo Rust
  (`lib/net.ts` → `@tauri-apps/plugin-http`), quindi nessun vincolo CORS.
  Host consentiti in `src-tauri/capabilities/default.json`.
- Dati: `localStorage` della webview, profilo in
  `%LOCALAPPDATA%\app.miru.desktop`. Spostando l'exe i dati restano (non sono
  accanto all'eseguibile).

## Catalogo precaricato (splash + cache locale)

- `components/catalog-gate.tsx` mostra la schermata di caricamento al primo
  avvio e scarica il catalogo; se il catalogo esiste già l'app parte subito e
  l'aggiornamento avviene in sottofondo.
- `lib/catalog.ts` scarica da AniList 20 pagine per popolarità + 20 per voto
  (1213 titoli unici, 3 richieste in parallelo, ~15s) e le salva in
  IndexedDB (`miru-catalog`), TTL 7 giorni. Non è "tutto AniList": è il sottoinsieme
  che copre ricerca, Esplora, Consigliati e Home.
- `queryCatalog()` applica gli stessi filtri/sort di `searchAnime` sui dati
  locali, quindi `/api/anime/search` risponde in millisecondi. Se una ricerca
  testuale non trova nulla in locale, si esce in rete.
- Le schede `lib/anime-api.ts` → dettaglio servito dal catalogo quando il titolo
  c'è (episodi numerati dal totale), altrimenti rete.

## Icona

`tools/make-icon.ps1` genera `tools/miru-icon.png` (gradiente arancio + 見) con
GDI+, poi `npx tauri icon tools/miru-icon.png` produce la cartella `src-tauri/icons`.
Il vecchio `public/icon.svg` è il segnaposto v0 (trasparente quando renderizzato
fuori dal browser): da lì l'icona vuota in barra del titolo.

## Scrollbar

`app/globals.css` stila `::-webkit-scrollbar` (10px, thumb arrotondato
`--scrollbar-thumb`, hover sull'arancio primary, track trasparente) perché WebView2
altrimenti disegna la barra chiara di sistema con le frecce. `@supports not
selector(::-webkit-scrollbar)` copre i browser non Chromium con `scrollbar-color`.
Attenzione: dichiarare `scrollbar-width` (anche `thin`) fa tornare Chromium alla
barra nativa ignorando i pseudo-elementi — per questo `.cw-row` non lo usa più.


## Verifica layout

`node scripts/check-layout.mjs http://localhost:3100` (con `npm start` attivo)
controlla l'assenza di overflow orizzontale a 1920/1440/1280/1024/900 e apre il
dettaglio a 1024 salvando gli screenshot.


## Note

- `MIRU.exe` + `tools/launcher.cs` in radice sono il launcher precedente
  (avviava `next start` in un prompt e apriva il browser): sostituito da questo.
- CSP attiva in `tauri.conf.json`: `default-src 'self'`, script/stile inline (richiesti
  dall'export statico di Next), `img-src https:` per le copertine, `connect-src` solo
  verso l'IPC di Tauri (le chiamate esterne passano dal plugin HTTP in Rust).
  Restringere `img-src` ai CDN effettivi è un affinamento futuro.
- Se Jikan non risponde, ricerca e dettaglio degradano su AniList/Kitsu
  (`getAnimeDetail` ora ha il fallback Jikan → AniList).
