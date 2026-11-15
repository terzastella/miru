/** @type {import('next').NextConfig} */
const desktop = process.env.MIRU_DESKTOP === '1'

// Le route API (`app/api/**/route.handler.ts`) esistono solo per la versione web:
// nel build desktop statico l'app chiama `lib/anime-sources.ts` direttamente.
const routeExt = desktop ? [] : ['handler.ts']

const nextConfig = {
  images: {
    unoptimized: true,
  },
  pageExtensions: ['tsx', 'ts', ...routeExt],
  // Build statico per l'app desktop (Tauri): niente server Node, asset in `out/`.
  ...(desktop ? { output: 'export', trailingSlash: true } : {}),
}

export default nextConfig
