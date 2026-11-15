'use client'

import { useEffect, useState } from 'react'

/**
 * Single debounce hook for every search input (spec §13): text 600ms,
 * chips/filters 400ms, sliders 500ms — the caller picks the delay.
 */
export function useDebounced<T>(value: T, delay = 600): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
