'use client'

import { cn } from '@/lib/utils'
import { getStoreState, type Store } from '@/lib/stores-data'

type StoreMarkerProps = {
  store: Store
  onClick: (store: Store) => void
}

const stateStyles = {
  normal: {
    box: 'bg-secondary text-muted-foreground border-border',
    glow: '',
    label: 'bg-secondary text-secondary-foreground border-border',
  },
  'alert-up': {
    box: 'bg-alert-up text-alert-up-foreground border-alert-up-foreground/40 animate-marker-pulse',
    glow: 'shadow-[0_0_16px_2px_var(--alert-up)]',
    label: 'bg-alert-up text-alert-up-foreground border-alert-up-foreground/40',
  },
  'alert-down': {
    box: 'bg-alert-down text-alert-down-foreground border-alert-down-foreground/40 animate-marker-pulse',
    glow: 'shadow-[0_0_16px_2px_var(--alert-down)]',
    label:
      'bg-alert-down text-alert-down-foreground border-alert-down-foreground/40',
  },
} as const

export function StoreMarker({ store, onClick }: StoreMarkerProps) {
  const Icon = store.icon
  const state = getStoreState(store)
  const styles = stateStyles[state]
  const isAlert = state !== 'normal'

  return (
    <button
      type="button"
      onClick={() => onClick(store)}
      style={{ left: `${store.x}%`, top: `${store.y}%` }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      aria-label={`${store.name} — ${store.category}${
        isAlert ? ' (alerta de precio)' : ''
      }`}
    >
      {/* Floating label */}
      <span
        className={cn(
          'absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-tight opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
          styles.label,
        )}
      >
        {store.name}
      </span>

      {/* Marker box */}
      <span
        className={cn(
          'flex size-10 items-center justify-center border-4 pixel-shadow transition-transform duration-150 group-hover:-translate-y-1 group-active:translate-y-0',
          styles.box,
          styles.glow,
        )}
      >
        <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </span>

      {/* Pointer foot */}
      <span
        className={cn(
          'mx-auto -mt-1 block size-2.5 rotate-45',
          state === 'alert-up' && 'bg-alert-up',
          state === 'alert-down' && 'bg-alert-down',
          state === 'normal' && 'bg-secondary',
        )}
        aria-hidden="true"
      />

      {/* Alert ping */}
      {isAlert && (
        <span className="absolute right-0 top-0 flex size-3 -translate-y-1 translate-x-1">
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-70',
              state === 'alert-up' ? 'bg-alert-up' : 'bg-alert-down',
            )}
          />
          <span
            className={cn(
              'relative inline-flex size-3 rounded-full border-2 border-background',
              state === 'alert-up' ? 'bg-alert-up' : 'bg-alert-down',
            )}
          />
        </span>
      )}
    </button>
  )
}
