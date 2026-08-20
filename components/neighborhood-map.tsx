'use client'

import Image from 'next/image'
import { getStoreState, type Store } from '@/lib/stores-data'
import { StoreMarker } from './store-marker'

type NeighborhoodMapProps = {
  stores: Store[]
  onSelectStore: (store: Store) => void
}

export function NeighborhoodMap({ stores, onSelectStore }: NeighborhoodMapProps) {
  const alertCount = stores.filter((s) => getStoreState(s) !== 'normal').length

  return (
    <section
      aria-label="Mapa interactivo del vecindario"
      className="flex min-h-0 flex-1 flex-col bg-card"
    >
      {/* Map toolbar */}
      <header className="flex items-center justify-between gap-4 border-b-4 border-border bg-popover px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="size-3 animate-pulse bg-primary" aria-hidden="true" />
          <h1 className="font-pixel text-[11px] uppercase tracking-tight text-primary">
            BarrioBot
          </h1>
          <span className="hidden font-sans text-lg leading-none text-muted-foreground sm:inline">
            Monitor de precios del vecindario
          </span>
        </div>
        <div className="flex items-center gap-2 border-2 border-alert-up/60 bg-alert-up/15 px-2 py-1">
          <span className="size-2 rounded-full bg-alert-up" aria-hidden="true" />
          <span className="font-pixel text-[8px] uppercase text-foreground">
            {alertCount} alertas
          </span>
        </div>
      </header>

      {/* Map canvas */}
      <div className="relative flex-1 overflow-hidden crt-scanlines">
        <div className="absolute inset-0">
          <Image
            src="/neighborhood-map.png"
            alt="Mapa pixel-art del vecindario con calles, parques y locales comerciales"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="pixelated object-cover"
          />
          {/* Tint to blend markers with the scene */}
          <div className="absolute inset-0 bg-background/25 mix-blend-multiply" />
        </div>

        {stores.map((store) => (
          <StoreMarker key={store.id} store={store} onClick={onSelectStore} />
        ))}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1.5 border-2 border-border bg-popover/90 px-3 py-2 backdrop-blur-sm">
          <span className="font-pixel text-[7px] uppercase text-muted-foreground">
            Estados
          </span>
          <LegendRow className="bg-secondary" label="Normal" />
          <LegendRow className="bg-alert-up" label="Subida" />
          <LegendRow className="bg-alert-down" label="Oferta" />
        </div>
      </div>
    </section>
  )
}

function LegendRow({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-3 border-2 border-background ${className}`} aria-hidden="true" />
      <span className="font-sans text-base leading-none text-foreground">{label}</span>
    </div>
  )
}
