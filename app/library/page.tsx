import type { Metadata } from 'next'

import { LibraryView } from '@/components/views/library-view'

export const metadata: Metadata = {
  title: 'Libreria — MIRU',
}

export default function LibraryPage() {
  return <LibraryView />
}
