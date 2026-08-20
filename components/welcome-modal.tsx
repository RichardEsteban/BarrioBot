'use client'

import { useEffect } from 'react'
import { MapPin, Sparkles, X, Zap } from 'lucide-react'

type WelcomeModalProps = {
  open: boolean
  onClose: () => void
  onTriggerDemo: () => void
}

export function WelcomeModal({ open, onClose, onTriggerDemo }: WelcomeModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="animate-bubble-in relative w-full max-w-md border-4 border-border bg-card pixel-shadow">
        {/* Title bar */}
        <div className="flex items-center justify-between gap-3 border-b-4 border-border bg-popover px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center border-2 border-primary bg-primary/15 text-primary">
              <Sparkles className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <h2 id="welcome-modal-title" className="font-pixel text-[11px] uppercase text-foreground">
              Bienvenido a BarrioBot
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex size-8 items-center justify-center border-2 border-border bg-secondary text-foreground transition-colors hover:bg-alert-up hover:text-alert-up-foreground"
          >
            <X className="size-4" strokeWidth={3} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          <p className="font-sans text-xl leading-snug text-foreground">
            Un agente vigila los precios de 5 tiendas de tu barrio y te avisa apenas detecta un
            cambio.
          </p>

          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
            <p className="font-sans text-lg leading-snug text-muted-foreground">
              Toca cualquier marcador del mapa para ver el precio actual, el anterior y la
              recomendación del agente.
            </p>
          </div>

          <div className="flex gap-3">
            <Zap className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
            <p className="font-sans text-lg leading-snug text-muted-foreground">
              El agente revisa precios solo, cada ~16 segundos. También puedes pulsar{' '}
              <span className="text-foreground">&ldquo;Simular alerta&rdquo;</span> junto al chat
              para forzar un evento cuando quieras.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onTriggerDemo()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 border-2 border-primary bg-primary/15 py-2.5 font-pixel text-[8px] uppercase text-primary transition-colors hover:bg-primary/25"
          >
            <Sparkles className="size-3.5" strokeWidth={3} aria-hidden="true" />
            Ver un ejemplo ahora
          </button>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-border bg-popover px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full border-2 border-border bg-secondary py-2 font-pixel text-[8px] uppercase text-foreground transition-colors hover:bg-muted"
          >
            Entendido, empezar
          </button>
        </div>
      </div>
    </div>
  )
}
