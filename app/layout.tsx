import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

import { AppShell } from '@/components/app-shell'
import { CatalogGate } from '@/components/catalog-gate'
import { MiruProvider } from '@/lib/store'
import './globals.css'

const heading = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const numeric = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-numeric',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MIRU — anime tracker',
  description:
    'MIRU is a local anime tracker for Windows: episode progress, ratings, notes and tags, with discovery from Jikan, AniList and Kitsu.',
  generator: 'v0.app',
  applicationName: 'MIRU',
  keywords: [
    'anime tracker',
    'watchlist',
    'diario anime',
    'MyAnimeList',
    'AniList',
    'Tauri',
  ],
  openGraph: {
    title: 'MIRU — anime tracker',
    description:
      'Track, rate and discover anime. Episode progress, personal scores, notes and tags — all stored on your device.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0c0c10',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${heading.variable} ${body.variable} ${numeric.variable} bg-background`}
    >
      <body className="min-h-dvh overflow-x-hidden font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MiruProvider>
            <CatalogGate>
              <AppShell>{children}</AppShell>
            </CatalogGate>
          </MiruProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' &&
          !process.env.NEXT_PUBLIC_MIRU_DESKTOP && <Analytics />}
      </body>
    </html>
  )
}
