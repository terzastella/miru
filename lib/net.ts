/**
 * `fetch` per le API esterne (Jikan, AniList, Kitsu).
 *
 * Nell'app desktop la richiesta passa dal plugin HTTP di Tauri: parte dal
 * processo Rust, quindi non dipende dai permessi CORS dell'origine webview.
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function netFetch(input: string, init?: RequestInit): Promise<Response> {
  if (isDesktop()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    return tauriFetch(input, {
      method: init?.method,
      headers: init?.headers as Record<string, string> | undefined,
      body: init?.body as BodyInit | undefined,
      signal: init?.signal ?? undefined,
    }) as unknown as Promise<Response>
  }
  return fetch(input, init)
}
