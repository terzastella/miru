'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { AddAnimeDialog } from '@/components/add-anime-dialog'
import { AnimeDetailDialog } from '@/components/anime-detail-dialog'
import { Toaster } from '@/components/ui/sonner'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV: { href: string; label: TranslationKey }[] = [
  { href: '/', label: 'nav.home' },
  { href: '/library', label: 'nav.library' },
  { href: '/recommend', label: 'nav.recommend' },
  { href: '/explore', label: 'nav.explore' },
  { href: '/settings', label: 'nav.settings' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const { preferences, stats, openAddDialog } = useMiru()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t('a11y.skipToContent')}
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff5a2c] via-[#ff8a3c] to-[#ff5a2c] font-sans text-lg leading-none font-bold text-[#1a0a02] shadow-lg shadow-[#ff5a2c]/25 [transform:rotate(6deg)]"
              aria-hidden="true"
            >
              見
            </span>
            <span className="font-display text-2xl leading-none tracking-[0.18em] text-foreground">
              MIRU
            </span>
          </Link>

          <nav
            aria-label={t('nav.openMenu')}
            className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map(({ href, label }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors md:px-4',
                    active
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {t(label)}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden font-mono text-[11px] text-muted-foreground xl:block">
              {preferences.displayName || t('account.guest')} · {stats.titles} ·{' '}
              {stats.episodes} ep
            </span>
            <button
              type="button"
              onClick={openAddDialog}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent-soft md:px-4"
            >
              <Plus className="size-4 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">{t('nav.add')}</span>
              <span className="sm:hidden">{t('nav.add')}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <AddAnimeDialog />
      <AnimeDetailDialog />
      <Toaster position="top-center" />
    </div>
  )
}
