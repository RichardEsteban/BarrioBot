'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { agentMessages, stores, type Store } from '@/lib/stores-data'

type AgentChatProps = {
  onSelectStore: (store: Store) => void
}

export function AgentChat({ onSelectStore }: AgentChatProps) {
  const [visibleCount, setVisibleCount] = useState(1)
  const [typing, setTyping] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reveal notifications one after another, like an incoming chat.
  useEffect(() => {
    if (visibleCount >= agentMessages.length) {
      setTyping(false)
      return
    }
    setTyping(true)
    const t = setTimeout(() => {
      setVisibleCount((c) => c + 1)
    }, 1600)
    return () => clearTimeout(t)
  }, [visibleCount])

  // Keep the latest bubble in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [visibleCount, typing])

  const shown = agentMessages.slice(0, visibleCount)

  return (
    <aside
      aria-label="Notificaciones del agente"
      className="flex h-[45%] w-full min-h-0 flex-col border-t-4 border-border bg-sidebar lg:h-full lg:w-[360px] lg:shrink-0 lg:border-l-4 lg:border-t-0"
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b-4 border-border bg-popover px-4 py-3">
        <span className="relative flex size-9 items-center justify-center border-2 border-primary bg-primary/15 text-primary">
          <Bot className="size-5" strokeWidth={2.5} aria-hidden="true" />
          <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-popover bg-alert-down" />
        </span>
        <div>
          <p className="font-pixel text-[10px] uppercase text-foreground">Agente</p>
          <p className="font-sans text-base leading-none text-alert-down">en línea</p>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {shown.map((msg) => {
          const store = msg.storeId
            ? stores.find((s) => s.id === msg.storeId)
            : undefined
          return (
            <div key={msg.id} className="animate-bubble-in flex flex-col gap-1">
              <div className="max-w-[92%] border-2 border-border bg-card px-3 py-2 pixel-shadow">
                <p className="font-sans text-lg leading-snug text-card-foreground">
                  {msg.text}
                </p>
                {store && (
                  <button
                    type="button"
                    onClick={() => onSelectStore(store)}
                    className={cn(
                      'mt-2 flex w-full items-center justify-between gap-2 border-2 px-2 py-1 font-pixel text-[7px] uppercase transition-colors',
                      store.state === 'alert-up' &&
                        'border-alert-up/60 bg-alert-up/15 text-foreground hover:bg-alert-up/25',
                      store.state === 'alert-down' &&
                        'border-alert-down/60 bg-alert-down/15 text-foreground hover:bg-alert-down/25',
                      store.state === 'normal' &&
                        'border-border bg-secondary text-foreground hover:bg-muted',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <store.icon className="size-3" strokeWidth={3} aria-hidden="true" />
                      Ver {store.name}
                    </span>
                    <ChevronRight className="size-3" strokeWidth={3} aria-hidden="true" />
                  </button>
                )}
              </div>
              <span className="px-1 font-sans text-sm text-muted-foreground">
                {msg.time}
              </span>
            </div>
          )
        })}

        {typing && <TypingBubble />}
      </div>

      {/* Footer status */}
      <footer className="border-t-4 border-border bg-popover px-4 py-2">
        <p className="font-sans text-base text-muted-foreground">
          {typing
            ? 'El agente está escribiendo…'
            : `${agentMessages.length} notificaciones recibidas`}
        </p>
      </footer>
    </aside>
  )
}

function TypingBubble() {
  return (
    <div className="flex w-fit items-center gap-1 border-2 border-border bg-card px-3 py-2.5">
      <span className="size-2 animate-bounce bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-2 animate-bounce bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="size-2 animate-bounce bg-muted-foreground" />
    </div>
  )
}
