'use client'

import { useState } from 'react'
import type { Store } from '@/lib/stores-data'
import { NeighborhoodMap } from '@/components/neighborhood-map'
import { AgentChat } from '@/components/agent-chat'
import { StoreModal } from '@/components/store-modal'

export default function Page() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <NeighborhoodMap onSelectStore={setSelectedStore} />
      <AgentChat onSelectStore={setSelectedStore} />
      <StoreModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </main>
  )
}
