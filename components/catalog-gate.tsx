'use client'

import { useEffect, useRef, useState } from 'react'

import { buildCatalog, CATALOG_PAGES, getCatalog, isCatalogStale } from '@/lib/catalog'
import { useI18n } from '@/lib/i18n'
import { isDesktop } from '@/lib/net'

type Phase = 'checking' | 'building' | 'ready'

/**
 * Schermata di caricamento del catalogo (solo desktop).
 *
 * Al primo avvio scarica in locale i titoli più popolari/votati: dopo,
 * ricerca, Esplora, Consigliati e schede anime aprono senza attendere la rete.
 * Se il catalogo esiste già l'app parte subito e l'eventuale aggiornamento
 * avviene in sottofondo.
 */
export function CatalogGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('checking')
  const [pages, setPages] = useState(0)
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!isDesktop()) {
      setPhase('ready')
      return
    }

    let alive = true
    void (async () => {
      const existing = await getCatalog()
      if (!alive) return

      if (existing) {
        setPhase('ready')
        if (isCatalogStale(existing)) void buildCatalog().catch(() => undefined)
        return
      }

      setPhase('building')
      try {
        await buildCatalog((done, _total, found) => {
          if (!alive) return
          setPages(done)
          setCount(found)
        })
        if (alive) setPhase('ready')
      } catch {
        if (alive) setPhase('ready')
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (phase !== 'ready') return
    const timer = setTimeout(() => setFading(true), 220)
    return () => clearTimeout(timer)
  }, [phase])

  const ready = phase === 'ready'

  return (
    <>
      {ready && children}
      {!fading && (
        <div
          className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-background px-6 transition-opacity duration-200 ${
            ready ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-hidden={ready}
        >
          <div className="flex flex-col items-center gap-4">
            <span
              className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5a2c] via-[#ff8a3c] to-[#ff5a2c] font-sans text-3xl leading-none font-bold text-[#1a0a02] shadow-lg shadow-[#ff5a2c]/25 [transform:rotate(6deg)]"
              aria-hidden="true"
            >
              見
            </span>
            <span className="font-display text-3xl tracking-[0.18em] text-foreground">
              MIRU
            </span>
          </div>

          <div className="flex w-full max-w-xs flex-col items-center gap-3">
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((pages / CATALOG_PAGES) * 100)}
              aria-label={t('splash.title')}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.max(4, (pages / CATALOG_PAGES) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{t('splash.title')}</p>
            <p className="font-mono text-xs text-muted-foreground/70 tabular-nums">
              {count} anime · {Math.round((pages / CATALOG_PAGES) * 100)}%
            </p>
          </div>

          <p className="max-w-sm text-center text-xs text-muted-foreground/70">
            {t('splash.body')}
          </p>
        </div>
      )}
    </>
  )
}
