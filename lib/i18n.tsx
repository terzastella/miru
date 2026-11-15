'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'

export type Locale = 'it' | 'en'

const it = {
  'app.name': 'MIRU',
  'app.tagline': 'Il tuo diario anime',

  'nav.home': 'Home',
  'nav.library': 'Libreria',
  'nav.recommend': 'Consigliati',
  'nav.explore': 'Esplora',
  'nav.settings': 'Impostazioni',
  'nav.openMenu': 'Apri il menu di navigazione',
  'nav.add': 'Aggiungi anime',

  'account.guest': 'Ospite locale',
  'account.guestHint':
    'I dati sono salvati su questo dispositivo. Collega un account per sincronizzarli.',

  'status.plan': 'Da vedere',
  'status.watching': 'In corso',
  'status.onhold': 'In pausa',
  'status.dropped': 'Droppati',
  'status.done': 'Completati',
  'status.all': 'Tutti',
  'status.favorites': 'Preferiti',

  'stamp.done': 'VISTO',
  'stamp.onhold': 'IN PAUSA',
  'stamp.dropped': 'DROPPATO',

  'airing.airing': 'In onda',
  'airing.complete': 'Concluso',
  'airing.upcoming': 'In arrivo',

  'sort.updated_desc': 'Ultimo aggiornamento',
  'sort.added_desc': 'Data aggiunta',
  'sort.title_asc': 'Titolo A-Z',
  'sort.title_desc': 'Titolo Z-A',
  'sort.score_desc': 'Voto più alto',
  'sort.score_asc': 'Voto più basso',
  'sort.year_desc': 'Anno di uscita',
  'sort.progress_desc': 'Progresso %',

  'home.greeting': 'Bentornato',
  'home.continue': 'Riprendi da qui',
  'home.continueEmpty': 'Nessun anime in corso. Inizia a guardarne uno.',
  'home.recommended': 'Consigliati per te',
  'home.recommendedWhy': 'Perché ti piace {genre}',
  'home.recommendedEmpty':
    'Aggiungi qualche titolo alla libreria per ricevere consigli.',
  'home.activity': 'Attività recente',
  'home.activityEmpty': 'Ancora nessuna attività.',
  'home.emptyTitle': 'La tua libreria è vuota',
  'home.emptyBody':
    'Cerca un anime e aggiungilo al diario: progresso, voti, note e tag restano tutti qui.',
  'home.emptyCta': 'Esplora gli anime',
  'home.addFirst': 'Aggiungi il tuo primo anime',
  'home.seeAll': 'Vedi tutti',
  'home.dismiss': 'Non mi interessa',

  'stats.titles': 'Titoli',
  'stats.episodes': 'Episodi visti',
  'stats.hours': 'Ore guardate',
  'stats.meanScore': 'Voto medio',
  'stats.rewatches': 'Rewatch',

  'library.title': 'Libreria',
  'library.search': 'Cerca per titolo, note o tag',
  'library.sortBy': 'Ordina per',
  'library.view.grid': 'Griglia',
  'library.view.list': 'Lista',
  'library.tags': 'Tag',
  'library.allTags': 'Tutti i tag',
  'library.count': '{count} titoli',
  'library.empty': 'Nessun titolo corrisponde ai filtri.',
  'library.selected': '{count} selezionati',
  'library.bulkStatus': 'Cambia stato',
  'library.bulkDelete': 'Rimuovi',
  'library.clearSelection': 'Annulla selezione',
  'library.select': 'Seleziona {title}',
  'library.minScore': 'Voto minimo',

  'explore.title': 'Esplora',
  'explore.search': 'Cerca un anime',
  'explore.filters': 'Filtri',
  'explore.type': 'Tipo',
  'explore.anyType': 'Qualsiasi tipo',
  'explore.airing': 'Stato',
  'explore.anyAiring': 'Qualsiasi stato',
  'explore.genres': 'Generi',
  'explore.minScoreSource': 'Voto minimo fonte',
  'explore.yearFrom': 'Dal',
  'explore.yearTo': 'Al',
  'explore.episodesMin': 'Episodi min',
  'explore.episodesMax': 'Episodi max',
  'explore.studio': 'Studio',
  'explore.loadMore': 'Carica altri',
  'explore.noResults': 'Nessun risultato. Prova a cambiare i filtri.',
  'explore.reset': 'Azzera filtri',
  'explore.source': 'Fonte',
  'explore.sourceCache': 'cache locale',
  'explore.trending': 'Tendenze della stagione',

  'type.tv': 'Serie TV',
  'type.movie': 'Film',
  'type.ova': 'OVA',
  'type.ona': 'ONA',
  'type.special': 'Special',

  'sort.popularity': 'Popolarità',
  'sort.score': 'Voto fonte',
  'sort.newest': 'Più recenti',
  'sort.title': 'Titolo',
  'explore.rateLimited':
    'Le fonti esterne stanno limitando le richieste: riprovo tra poco.',
  'explore.offline':
    'Fonti non raggiungibili. Mostro i risultati dalla cache locale.',

  'add.title': 'Aggiungi anime',
  'add.search': 'Cerca un anime…',
  'add.hint': 'Prova "One Piece", "AoT", "Frieren"…',
  'add.add': 'Aggiungi',
  'add.added': 'In libreria',
  'add.alreadyInLibrary': 'Già in libreria',
  'add.toastAdded': 'Aggiunto a "Da vedere"',
  'add.noResults': 'Nessun risultato. Riprova con un altro titolo.',

  'recommend.subtitle': 'In base a: {genres}',
  'recommend.noResults':
    'Nessun consiglio per questi generi. Prova ad aggiungere altri titoli.',

  'detail.addToLibrary': 'Aggiungi alla libreria',
  'detail.inLibrary': 'In libreria',
  'detail.remove': 'Rimuovi dalla libreria',
  'detail.status': 'Stato',
  'detail.score': 'Il tuo voto',
  'detail.scoreNone': 'Non votato',
  'detail.notes': 'Note personali',
  'detail.notesPlaceholder': 'Pensieri, citazioni, dove sei rimasto…',
  'detail.tags': 'Tag personalizzati',
  'detail.tagsPlaceholder': 'Aggiungi un tag e premi Invio',
  'detail.episodes': 'Episodi',
  'detail.episodesMarkAll': 'Segna tutti',
  'detail.episodesUnmarkAll': 'Azzera tutti',
  'detail.rewatch': 'Ho rivisto questo anime',
  'detail.rewatchConfirm':
    'Incremento il contatore rewatch e azzero gli episodi visti. Procedo?',
  'detail.rewatchCount': 'Rewatch: {count}',
  'detail.dates': 'Date di visione',
  'detail.startedAt': 'Iniziato il',
  'detail.finishedAt': 'Finito il',
  'detail.history': 'Cronologia',
  'detail.historyEmpty': 'Nessun evento registrato.',
  'detail.synopsis': 'Sinossi',
  'detail.info': 'Informazioni',
  'detail.studios': 'Studio',
  'detail.episodesTotal': 'Episodi',
  'detail.duration': 'Durata',
  'detail.sourceScore': 'Voto fonte',
  'detail.year': 'Anno',
  'detail.unknown': 'n.d.',
  'detail.favorite': 'Preferito',
  'detail.favoriteAdd': 'Aggiungi ai preferiti',
  'detail.favoriteRemove': 'Rimuovi dai preferiti',
  'detail.loadingEpisodes': 'Carico gli episodi…',
  'detail.episodesUnavailable':
    'Lista episodi non disponibile: uso il numero totale di episodi.',
  'detail.episodesUnknown': 'Elenco episodi non disponibile.',
  'detail.pagePrev': 'Indietro',
  'detail.pageNext': 'Avanti',
  'detail.clearDate': 'Azzera data',
  'detail.progress': '{watched} di {total} episodi',
  'detail.progressUnknown': '{watched} episodi visti',
  'detail.close': 'Chiudi',

  'settings.title': 'Impostazioni',
  'settings.profile': 'Profilo',
  'settings.displayName': 'Nome visualizzato',
  'settings.language': 'Lingua',
  'settings.theme': 'Tema',
  'settings.themeDark': 'Scuro',
  'settings.themeLight': 'Chiaro',
  'settings.themeSystem': 'Sistema',
  'settings.data': 'Dati',
  'settings.export': 'Esporta backup JSON',
  'settings.exportHint':
    'Scarica tutta la libreria in formato MIRU JSON (schemaVersion 1).',
  'settings.exportMal': 'Esporta XML compatibile MyAnimeList',
  'settings.import': 'Importa backup',
  'settings.importHint':
    'Accetta un file JSON MIRU. I duplicati vengono uniti sulla voce esistente.',
  'settings.importDone': 'Importate {count} voci.',
  'settings.importError': 'File non valido.',
  'settings.reset': 'Cancella tutti i dati locali',
  'settings.resetConfirm':
    'Vengono eliminati libreria, attività e preferenze su questo dispositivo. Confermi?',
  'settings.storage': 'Archiviazione',
  'settings.storageLocal':
    'Modalità ospite: i dati vivono in questo browser. Un backend Postgres può essere collegato senza cambiare la UI.',

  'splash.title': 'Preparo il catalogo',
  'splash.body':
    'Scarico una volta sola i titoli più popolari e votati: ricerca, consigliati e schede poi si aprono subito.',

  'common.cancel': 'Annulla',
  'common.confirm': 'Conferma',
  'common.save': 'Salva',
  'common.saved': 'Salvato',
  'common.loading': 'Caricamento…',
  'common.retry': 'Riprova',
  'common.add': 'Aggiungi',
  'common.remove': 'Rimuovi',
  'common.error': 'Qualcosa è andato storto.',
  'storage.saveFailed':
    'Impossibile salvare sul dispositivo: controlla lo spazio disponibile.',
  'common.of': 'di',

  'a11y.skipToContent': 'Salta al contenuto',
  'a11y.markEpisode': 'Segna episodio {number} come visto',
  'a11y.unmarkEpisode': 'Segna episodio {number} come non visto',
  'a11y.openDetail': 'Apri i dettagli di {title}',
}

const en: Record<keyof typeof it, string> = {
  'app.name': 'MIRU',
  'app.tagline': 'Your anime diary',

  'nav.home': 'Home',
  'nav.library': 'Library',
  'nav.recommend': 'Recommended',
  'nav.explore': 'Explore',
  'nav.settings': 'Settings',
  'nav.openMenu': 'Open navigation menu',
  'nav.add': 'Add anime',

  'account.guest': 'Local guest',
  'account.guestHint':
    'Data is stored on this device. Connect an account to sync it.',

  'status.plan': 'Plan to watch',
  'status.watching': 'Watching',
  'status.onhold': 'On hold',
  'status.dropped': 'Dropped',
  'status.done': 'Completed',
  'status.all': 'All',
  'status.favorites': 'Favorites',

  'stamp.done': 'WATCHED',
  'stamp.onhold': 'ON HOLD',
  'stamp.dropped': 'DROPPED',

  'airing.airing': 'Airing',
  'airing.complete': 'Finished',
  'airing.upcoming': 'Upcoming',

  'sort.updated_desc': 'Last updated',
  'sort.added_desc': 'Date added',
  'sort.title_asc': 'Title A-Z',
  'sort.title_desc': 'Title Z-A',
  'sort.score_desc': 'Highest score',
  'sort.score_asc': 'Lowest score',
  'sort.year_desc': 'Release year',
  'sort.progress_desc': 'Progress %',

  'home.greeting': 'Welcome back',
  'home.continue': 'Pick up where you left off',
  'home.continueEmpty': 'Nothing in progress. Start watching something.',
  'home.recommended': 'Recommended for you',
  'home.recommendedWhy': 'Because you like {genre}',
  'home.recommendedEmpty': 'Add a few titles to your library to get suggestions.',
  'home.activity': 'Recent activity',
  'home.activityEmpty': 'No activity yet.',
  'home.emptyTitle': 'Your library is empty',
  'home.emptyBody':
    'Search for an anime and add it to your diary: progress, scores, notes and tags all live here.',
  'home.emptyCta': 'Explore anime',
  'home.addFirst': 'Add your first anime',
  'home.seeAll': 'See all',
  'home.dismiss': 'Not interested',

  'stats.titles': 'Titles',
  'stats.episodes': 'Episodes watched',
  'stats.hours': 'Hours watched',
  'stats.meanScore': 'Mean score',
  'stats.rewatches': 'Rewatches',

  'library.title': 'Library',
  'library.search': 'Search by title, notes or tags',
  'library.sortBy': 'Sort by',
  'library.view.grid': 'Grid',
  'library.view.list': 'List',
  'library.tags': 'Tags',
  'library.allTags': 'All tags',
  'library.count': '{count} titles',
  'library.empty': 'No title matches the current filters.',
  'library.selected': '{count} selected',
  'library.bulkStatus': 'Change status',
  'library.bulkDelete': 'Remove',
  'library.clearSelection': 'Clear selection',
  'library.select': 'Select {title}',
  'library.minScore': 'Min score',

  'explore.title': 'Explore',
  'explore.search': 'Search an anime',
  'explore.filters': 'Filters',
  'explore.type': 'Type',
  'explore.anyType': 'Any type',
  'explore.airing': 'Status',
  'explore.anyAiring': 'Any status',
  'explore.genres': 'Genres',
  'explore.minScoreSource': 'Min source score',
  'explore.yearFrom': 'From',
  'explore.yearTo': 'To',
  'explore.episodesMin': 'Min episodes',
  'explore.episodesMax': 'Max episodes',
  'explore.studio': 'Studio',
  'explore.loadMore': 'Load more',
  'explore.noResults': 'No results. Try different filters.',
  'explore.reset': 'Reset filters',
  'explore.source': 'Source',
  'explore.sourceCache': 'local cache',
  'explore.trending': 'Trending this season',

  'type.tv': 'TV Series',
  'type.movie': 'Movie',
  'type.ova': 'OVA',
  'type.ona': 'ONA',
  'type.special': 'Special',

  'sort.popularity': 'Popularity',
  'sort.score': 'Source score',
  'sort.newest': 'Newest',
  'sort.title': 'Title',
  'explore.rateLimited':
    'External sources are rate limiting us: retrying shortly.',
  'explore.offline': 'Sources unreachable. Showing results from local cache.',

  'add.title': 'Add anime',
  'add.search': 'Search an anime…',
  'add.hint': 'Try "One Piece", "AoT", "Frieren"…',
  'add.add': 'Add',
  'add.added': 'In library',
  'add.alreadyInLibrary': 'Already in library',
  'add.toastAdded': 'Added to "Plan to watch"',
  'add.noResults': 'No results. Try a different title.',

  'recommend.subtitle': 'Based on: {genres}',
  'recommend.noResults':
    'No recommendations for these genres. Try adding more titles.',

  'detail.addToLibrary': 'Add to library',
  'detail.inLibrary': 'In library',
  'detail.remove': 'Remove from library',
  'detail.status': 'Status',
  'detail.score': 'Your score',
  'detail.scoreNone': 'Not rated',
  'detail.notes': 'Personal notes',
  'detail.notesPlaceholder': 'Thoughts, quotes, where you stopped…',
  'detail.tags': 'Custom tags',
  'detail.tagsPlaceholder': 'Add a tag and press Enter',
  'detail.episodes': 'Episodes',
  'detail.episodesMarkAll': 'Mark all',
  'detail.episodesUnmarkAll': 'Clear all',
  'detail.rewatch': 'I rewatched this anime',
  'detail.rewatchConfirm':
    'This increments the rewatch counter and clears watched episodes. Continue?',
  'detail.rewatchCount': 'Rewatches: {count}',
  'detail.dates': 'Watch dates',
  'detail.startedAt': 'Started on',
  'detail.finishedAt': 'Finished on',
  'detail.history': 'History',
  'detail.historyEmpty': 'No events recorded.',
  'detail.synopsis': 'Synopsis',
  'detail.info': 'Details',
  'detail.studios': 'Studio',
  'detail.episodesTotal': 'Episodes',
  'detail.duration': 'Duration',
  'detail.sourceScore': 'Source score',
  'detail.year': 'Year',
  'detail.unknown': 'n/a',
  'detail.favorite': 'Favorite',
  'detail.favoriteAdd': 'Add to favorites',
  'detail.favoriteRemove': 'Remove from favorites',
  'detail.loadingEpisodes': 'Loading episodes…',
  'detail.episodesUnavailable':
    'Episode list unavailable: falling back to the total episode count.',
  'detail.episodesUnknown': 'Episode list unavailable.',
  'detail.pagePrev': 'Previous',
  'detail.pageNext': 'Next',
  'detail.clearDate': 'Clear date',
  'detail.progress': '{watched} of {total} episodes',
  'detail.progressUnknown': '{watched} episodes watched',
  'detail.close': 'Close',

  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.displayName': 'Display name',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.themeDark': 'Dark',
  'settings.themeLight': 'Light',
  'settings.themeSystem': 'System',
  'settings.data': 'Data',
  'settings.export': 'Export JSON backup',
  'settings.exportHint':
    'Download the whole library as MIRU JSON (schemaVersion 1).',
  'settings.exportMal': 'Export MyAnimeList-compatible XML',
  'settings.import': 'Import backup',
  'settings.importHint':
    'Accepts a MIRU JSON file. Duplicates are merged into the existing entry.',
  'settings.importDone': 'Imported {count} entries.',
  'settings.importError': 'Invalid file.',
  'settings.reset': 'Erase all local data',
  'settings.resetConfirm':
    'Library, activity and preferences on this device will be deleted. Continue?',
  'settings.storage': 'Storage',
  'settings.storageLocal':
    'Guest mode: data lives in this browser. A Postgres backend can be plugged in without changing the UI.',

  'splash.title': 'Preparing the catalog',
  'splash.body':
    'Downloading the most popular and top-rated titles once: search, recommendations and details then open instantly.',

  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.saved': 'Saved',
  'common.loading': 'Loading…',
  'common.retry': 'Retry',
  'common.add': 'Add',
  'common.remove': 'Remove',
  'common.error': 'Something went wrong.',
  'storage.saveFailed':
    "Couldn't save to this device: check the available space.",
  'common.of': 'of',

  'a11y.skipToContent': 'Skip to content',
  'a11y.markEpisode': 'Mark episode {number} as watched',
  'a11y.unmarkEpisode': 'Mark episode {number} as unwatched',
  'a11y.openDetail': 'Open details for {title}',
}

export type TranslationKey = keyof typeof it

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { it, en }

export const LOCALES: Locale[] = ['it', 'en']
export const LOCALE_LABELS: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
}

type Vars = Record<string, string | number>

const I18nContext = createContext<Locale>('it')

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>
}

export function translate(locale: Locale, key: TranslationKey, vars?: Vars) {
  const raw = dictionaries[locale][key] ?? dictionaries.it[key] ?? key
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    raw,
  )
}

export function useI18n() {
  const locale = useContext(I18nContext)
  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => translate(locale, key, vars),
    [locale],
  )
  return useMemo(() => ({ locale, t }), [locale, t])
}

export function formatDate(locale: Locale, iso: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatRelative(locale: Locale, iso: string) {
  const date = new Date(iso).getTime()
  if (Number.isNaN(date)) return ''
  const diff = date - Date.now()
  const rtf = new Intl.RelativeTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    numeric: 'auto',
  })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['week', 604800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return rtf.format(Math.round(diff / 1000), 'second')
}
