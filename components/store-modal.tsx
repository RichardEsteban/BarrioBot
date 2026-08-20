'use client'

import { useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStoreState, priceChangePct, type Store } from '@/lib/stores-data'

type StoreModalProps = {
  store: Store | null
  onClose: () => void
}

export function StoreModal({ store, onClose }: StoreModalProps) {
  useEffect(() => {
    if (!store) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [store, onClose])

  if (!store) return null

  const Icon = store.icon
  const pct = priceChangePct(store)
  const state = getStoreState(store)
  const isUp = state === 'alert-up'
  const isDown = state === 'alert-down'

  const trendColor = isUp
    ? 'text-alert-up'
    : isDown
      ? 'text-alert-down'
      : 'text-muted-foreground'
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-modal-title"
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
            <span className="flex size-9 items-center justify-center border-2 border-border bg-secondary text-primary">
              <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="store-modal-title"
                className="font-pixel text-[11px] uppercase text-foreground"
              >
                {store.name}
              </h2>
              <p className="font-sans text-base leading-none text-muted-foreground">
                {store.category}
              </p>
            </div>
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
        <div className="space-y-4 p-4">
          <div>
            <p className="font-pixel text-[7px] uppercase tracking-tight text-muted-foreground">
              Producto
            </p>
            <p className="font-sans text-2xl leading-tight text-foreground">
              {store.product}
            </p>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <PriceBox
              label="Precio anterior"
              value={store.previousPrice}
              className="text-muted-foreground line-through decoration-2"
            />
            <PriceBox
              label="Precio actual"
              value={store.currentPrice}
              className={trendColor}
            />
          </div>

          {/* Change */}
          <div
            className={cn(
              'flex items-center justify-between border-2 px-3 py-2',
              isUp && 'border-alert-up/50 bg-alert-up/15',
              isDown && 'border-alert-down/50 bg-alert-down/15',
              !isUp && !isDown && 'border-border bg-secondary',
            )}
          >
            <span className="font-sans text-lg text-foreground">Variación</span>
            <span className={cn('flex items-center gap-1.5 font-pixel text-[12px]', trendColor)}>
              <TrendIcon className="size-4" strokeWidth={3} aria-hidden="true" />
              {pct > 0 ? '+' : ''}
              {pct.toFixed(1)}%
            </span>
          </div>

          {/* Recommendation */}
          <div className="border-2 border-primary/50 bg-primary/10 p-3">
            <p className="mb-1 flex items-center gap-1.5 font-pixel text-[7px] uppercase text-primary">
              <Lightbulb className="size-3" strokeWidth={3} aria-hidden="true" />
              Recomendación del agente
            </p>
            <p className="font-sans text-lg leading-snug text-foreground">
              {store.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceBox({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="border-2 border-border bg-secondary/50 px-3 py-2">
      <p className="font-pixel text-[7px] uppercase tracking-tight text-muted-foreground">
        {label}
      </p>
      <p className={cn('font-sans text-3xl leading-none', className)}>
        {value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
      </p>
    </div>
  )
}
