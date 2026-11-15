import type { Metadata } from 'next'

import { RecommendView } from '@/components/views/recommend-view'

export const metadata: Metadata = {
  title: 'Consigliati — MIRU',
}

export default function RecommendPage() {
  return <RecommendView />
}