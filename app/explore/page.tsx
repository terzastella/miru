import type { Metadata } from 'next'

import { ExploreView } from '@/components/views/explore-view'

export const metadata: Metadata = {
  title: 'Esplora — MIRU',
}

export default function ExplorePage() {
  return <ExploreView />
}
