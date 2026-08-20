import {
  ShoppingCart,
  Pill,
  Coffee,
  MonitorSmartphone,
  Croissant,
  type LucideIcon,
} from 'lucide-react'

export type StoreState = 'normal' | 'alert-up' | 'alert-down'

export type ProductOption = {
  name: string
  basePrice: number
}

export type Store = {
  id: string
  name: string
  category: string
  icon: LucideIcon
  /** Position on the map as percentages (0-100) */
  x: number
  y: number
  product: string
  previousPrice: number
  currentPrice: number
  recommendation: string
  /** Other products this store sells, used to generate varied simulated events. */
  catalog: ProductOption[]
}

/** A price move beyond this magnitude (in %) is considered an alert. */
export const ALERT_THRESHOLD_PCT = 5

/** Percentage change between a store's previous and current price. */
export function priceChangePct(
  store: Pick<Store, 'previousPrice' | 'currentPrice'>,
): number {
  if (!store.previousPrice) return 0
  return ((store.currentPrice - store.previousPrice) / store.previousPrice) * 100
}

/** Visual/alert state derived from the actual price change, never set by hand. */
export function getStoreState(store: Store): StoreState {
  const pct = priceChangePct(store)
  if (pct > ALERT_THRESHOLD_PCT) return 'alert-up'
  if (pct < -ALERT_THRESHOLD_PCT) return 'alert-down'
  return 'normal'
}

/**
 * Initial snapshot: every store starts at a stable price (previous === current)
 * so the map loads "normal" and the agent's live monitoring is what produces
 * the first alerts, instead of the demo starting mid-alert.
 */
export const initialStores: Store[] = [
  {
    id: 'super-ahorro',
    name: 'Super Ahorro',
    category: 'Supermercado',
    icon: ShoppingCart,
    x: 26,
    y: 34,
    product: 'Aceite de girasol 1L',
    previousPrice: 2.49,
    currentPrice: 2.49,
    recommendation: 'Precio estable. Sin cambios relevantes que reportar.',
    catalog: [
      { name: 'Aceite de girasol 1L', basePrice: 2.49 },
      { name: 'Arroz extra 1kg', basePrice: 1.85 },
      { name: 'Azúcar rubia 1kg', basePrice: 1.6 },
    ],
  },
  {
    id: 'farmacia-vida',
    name: 'Farmacia Vida',
    category: 'Farmacia',
    icon: Pill,
    x: 62,
    y: 24,
    product: 'Vitamina C 500mg (60 uds.)',
    previousPrice: 12.9,
    currentPrice: 12.9,
    recommendation: 'Precio estable. Sin cambios relevantes que reportar.',
    catalog: [
      { name: 'Vitamina C 500mg (60 uds.)', basePrice: 12.9 },
      { name: 'Paracetamol 500mg (20 uds.)', basePrice: 2.3 },
      { name: 'Alcohol en gel 250ml', basePrice: 3.1 },
    ],
  },
  {
    id: 'cafe-central',
    name: 'Café Central',
    category: 'Cafetería',
    icon: Coffee,
    x: 44,
    y: 58,
    product: 'Café molido premium 250g',
    previousPrice: 5.2,
    currentPrice: 5.2,
    recommendation: 'Precio estable durante 3 semanas. Sin cambios relevantes que reportar.',
    catalog: [
      { name: 'Café molido premium 250g', basePrice: 5.2 },
      { name: 'Leche evaporada 400g', basePrice: 1.4 },
      { name: 'Pan francés (unidad)', basePrice: 0.35 },
    ],
  },
  {
    id: 'tech-store',
    name: 'PixelTech',
    category: 'Electrónica',
    icon: MonitorSmartphone,
    x: 78,
    y: 62,
    product: 'Auriculares inalámbricos',
    previousPrice: 39.99,
    currentPrice: 39.99,
    recommendation: 'Precio estable. Sin cambios relevantes que reportar.',
    catalog: [
      { name: 'Auriculares inalámbricos', basePrice: 39.99 },
      { name: 'Cargador USB-C 20W', basePrice: 14.5 },
      { name: 'Cable HDMI 2m', basePrice: 6.9 },
    ],
  },
  {
    id: 'panaderia-espiga',
    name: 'La Espiga',
    category: 'Panadería',
    icon: Croissant,
    x: 16,
    y: 72,
    product: 'Pan de masa madre',
    previousPrice: 2.8,
    currentPrice: 2.8,
    recommendation: 'Precio justo y calidad constante, sin necesidad de alerta.',
    catalog: [
      { name: 'Pan de masa madre', basePrice: 2.8 },
      { name: 'Torta de chocolate (porción)', basePrice: 2.2 },
      { name: 'Croissant de mantequilla', basePrice: 1.5 },
    ],
  },
]

export type PriceEvent = {
  storeId: string
  product: string
  previousPrice: number
  currentPrice: number
}

/**
 * Simulates the agent "detecting" a price change: picks a random store and a
 * random product from its catalog, and moves the price by a noticeable
 * amount (8%-30%, up or down). This stands in for a real price feed during
 * the hackathon demo.
 */
export function pickPriceEvent(stores: Store[]): PriceEvent {
  const store = stores[Math.floor(Math.random() * stores.length)]
  const option = store.catalog[Math.floor(Math.random() * store.catalog.length)]
  const direction = Math.random() < 0.5 ? -1 : 1
  const magnitudePct = 8 + Math.random() * 22 // 8% .. 30%
  const previousPrice = option.basePrice
  const currentPrice = Math.max(
    0.3,
    Math.round(previousPrice * (1 + (direction * magnitudePct) / 100) * 100) / 100,
  )
  return { storeId: store.id, product: option.name, previousPrice, currentPrice }
}

/**
 * Deterministic, no-network fallback used when the LLM call fails or no API
 * key is configured, so the demo never breaks mid-presentation.
 */
export function templateAlert(event: PriceEvent, storeName: string) {
  const pct = ((event.currentPrice - event.previousPrice) / event.previousPrice) * 100
  const up = pct > 0
  const message = `${storeName}: ${event.product} ${up ? 'subió' : 'bajó'} ${Math.abs(pct).toFixed(0)}%, ahora en S/ ${event.currentPrice.toFixed(2)}.`
  const recommendation = up
    ? 'Subida notable. Conviene comparar antes de comprar aquí esta semana.'
    : 'Buen momento para aprovechar, es de las bajadas más fuertes registradas.'
  return { message, recommendation }
}

export type AgentMessage = {
  id: string
  storeId?: string
  time: string
  text: string
  /** Who "said" this bubble; missing/'agent' both render as the agent. */
  role?: 'user' | 'agent'
}
