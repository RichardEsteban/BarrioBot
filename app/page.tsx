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
import { WelcomeModal } from '@/components/welcome-modal'

/** How often the agent "checks" prices on its own, in ms. */
const SIMULATION_INTERVAL_MS = 16000
const WELCOME_STORAGE_KEY = 'barriobot-welcome-seen'

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
      // Left blank on purpose: formatting the time here would run once on the
      // server and again on the client, and locale-formatted times can differ
      // between those two environments and trigger a hydration mismatch.
      time: '',
      text: `Buenos días. Iniciando el monitoreo de precios del vecindario. ${initialStores.length} tiendas bajo seguimiento.`,
    },
  ])
  const [isThinking, setIsThinking] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Fill in the first message's timestamp only after mount, client-side only.
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m, i) => (i === 0 ? { ...m, time: nowLabel() } : m)),
    )
  }, [])

  useEffect(() => {
    const seen = window.localStorage.getItem(WELCOME_STORAGE_KEY)
    if (!seen) setShowWelcome(true)
  }, [])

  function closeWelcome() {
    setShowWelcome(false)
    window.localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  }

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

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const sendChatMessage = useCallback(async (text: string) => {
    const userMsg: AgentMessage = { id: nextMessageId(), time: nowLabel(), text, role: 'user' }
    const history = [...messagesRef.current, userMsg]
    setMessages(history)
    setIsThinking(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stores: storesRef.current,
          messages: history.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `chat api ${res.status}`)
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), time: nowLabel(), text: data.text || '(sin respuesta)', role: 'agent' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          time: nowLabel(),
          text: 'No pude responder eso ahora mismo. Intenta de nuevo en un momento.',
          role: 'agent',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }, [])

  const selectedStore = selectedStoreId
    ? stores.find((s) => s.id === selectedStoreId) ?? null
    : null

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <NeighborhoodMap
        stores={stores}
        onSelectStore={(s) => setSelectedStoreId(s.id)}
        selectedStoreId={selectedStoreId}
        onOpenHelp={() => setShowWelcome(true)}
      />
      <AgentChat
        messages={messages}
        stores={stores}
        isThinking={isThinking}
        onSelectStore={(s) => setSelectedStoreId(s.id)}
        onTrigger={triggerEvent}
        onSendChat={sendChatMessage}
      />
      <StoreModal store={selectedStore} onClose={() => setSelectedStoreId(null)} />
      <WelcomeModal
        open={showWelcome}
        onClose={closeWelcome}
        onTriggerDemo={triggerEvent}
        onAskExample={(q) => {
          void sendChatMessage(q)
          closeWelcome()
        }}
      />
    </main>
  )
}
