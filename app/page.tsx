'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  initialStores,
  pickPriceEvent,
  templateAlert,
  type AgentMessage,
  type Store,
} from '@/lib/stores-data'
import { NeighborhoodMap } from '@/components/neighborhood-map'
import { AgentChat } from '@/components/agent-chat'
import { StoreModal } from '@/components/store-modal'

/** How often the agent "checks" prices on its own, in ms. */
const SIMULATION_INTERVAL_MS = 16000

let messageCounter = 0
function nextMessageId() {
  messageCounter += 1
  return `m-${messageCounter}`
}

function nowLabel() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function Page() {
  const [stores, setStores] = useState<Store[]>(initialStores)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>(() => [
    {
      id: nextMessageId(),
      time: nowLabel(),
      text: `Buenos días. Iniciando el monitoreo de precios del vecindario. ${initialStores.length} tiendas bajo seguimiento.`,
    },
  ])
  const [isThinking, setIsThinking] = useState(false)

  // Read the latest stores inside the interval/callback without re-creating it every render.
  const storesRef = useRef(stores)
  storesRef.current = stores

  const triggerEvent = useCallback(async () => {
    setIsThinking(true)
    const event = pickPriceEvent(storesRef.current)
    const store = storesRef.current.find((s) => s.id === event.storeId)
    if (!store) {
      setIsThinking(false)
      return
    }

    let message: string
    let recommendation: string
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeName: store.name,
          category: store.category,
          product: event.product,
          previousPrice: event.previousPrice,
          currentPrice: event.currentPrice,
        }),
      })
      if (!res.ok) throw new Error(`agent api ${res.status}`)
      const data = await res.json()
      message = data.message
      recommendation = data.recommendation
    } catch {
      // The API route already falls back to a template server-side; this
      // client-side fallback only covers the network call itself failing
      // (e.g. offline during the demo).
      const fallback = templateAlert(event, store.name)
      message = fallback.message
      recommendation = fallback.recommendation
    }

    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id
          ? {
              ...s,
              product: event.product,
              previousPrice: event.previousPrice,
              currentPrice: event.currentPrice,
              recommendation,
            }
          : s,
      ),
    )
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), storeId: store.id, time: nowLabel(), text: message },
    ])
    setIsThinking(false)
  }, [])

  // Automatic ambient ticks, so the agent keeps "working" even if no one
  // clicks the manual trigger during the demo.
  useEffect(() => {
    const timer = setInterval(triggerEvent, SIMULATION_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [triggerEvent])

  const selectedStore = selectedStoreId
    ? stores.find((s) => s.id === selectedStoreId) ?? null
    : null

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <NeighborhoodMap stores={stores} onSelectStore={(s) => setSelectedStoreId(s.id)} />
      <AgentChat
        messages={messages}
        stores={stores}
        isThinking={isThinking}
        onSelectStore={(s) => setSelectedStoreId(s.id)}
        onTrigger={triggerEvent}
      />
      <StoreModal store={selectedStore} onClose={() => setSelectedStoreId(null)} />
    </main>
  )
}
