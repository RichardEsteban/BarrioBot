import {
  ShoppingCart,
  Pill,
  Coffee,
  MonitorSmartphone,
  Croissant,
  type LucideIcon,
} from 'lucide-react'

export type StoreState = 'normal' | 'alert-up' | 'alert-down'

export type Store = {
  id: string
  name: string
  category: string
  icon: LucideIcon
  /** Position on the map as percentages (0-100) */
  x: number
  y: number
  state: StoreState
  product: string
  previousPrice: number
  currentPrice: number
  recommendation: string
}

export const stores: Store[] = [
  {
    id: 'super-ahorro',
    name: 'Super Ahorro',
    category: 'Supermercado',
    icon: ShoppingCart,
    x: 26,
    y: 34,
    state: 'alert-up',
    product: 'Aceite de girasol 1L',
    previousPrice: 2.49,
    currentPrice: 3.15,
    recommendation:
      'Subida fuerte del 26%. Conviene abastecerse en Panadería La Espiga o esperar a la próxima oferta.',
  },
  {
    id: 'farmacia-vida',
    name: 'Farmacia Vida',
    category: 'Farmacia',
    icon: Pill,
    x: 62,
    y: 24,
    state: 'alert-down',
    product: 'Vitamina C 500mg (60 uds.)',
    previousPrice: 12.9,
    currentPrice: 9.45,
    recommendation:
      'Bajó un 27%, el precio más bajo del mes. Buen momento para comprar si lo necesitas.',
  },
  {
    id: 'cafe-central',
    name: 'Café Central',
    category: 'Cafetería',
    icon: Coffee,
    x: 44,
    y: 58,
    state: 'normal',
    product: 'Café molido premium 250g',
    previousPrice: 5.2,
    currentPrice: 5.2,
    recommendation:
      'Precio estable durante 3 semanas. Sin cambios relevantes que reportar.',
  },
  {
    id: 'tech-store',
    name: 'PixelTech',
    category: 'Electrónica',
    icon: MonitorSmartphone,
    x: 78,
    y: 62,
    state: 'alert-up',
    product: 'Auriculares inalámbricos',
    previousPrice: 39.99,
    currentPrice: 47.99,
    recommendation:
      'Subida del 20% previa a la temporada de rebajas. Recomiendo esperar antes de comprar.',
  },
  {
    id: 'panaderia-espiga',
    name: 'La Espiga',
    category: 'Panadería',
    icon: Croissant,
    x: 16,
    y: 72,
    state: 'normal',
    product: 'Pan de masa madre',
    previousPrice: 2.8,
    currentPrice: 2.75,
    recommendation:
      'Ligera bajada del 2%. Precio justo y calidad constante, sin necesidad de alerta.',
  },
]

export function priceChangePct(store: Store): number {
  if (store.previousPrice === 0) return 0
  return ((store.currentPrice - store.previousPrice) / store.previousPrice) * 100
}

export type AgentMessage = {
  id: string
  storeId?: string
  time: string
  text: string
}

/** Sequential notifications the agent "sends" into the chat panel. */
export const agentMessages: AgentMessage[] = [
  {
    id: 'm1',
    time: '08:02',
    text: 'Buenos días. Iniciando el monitoreo de precios del vecindario. 5 tiendas bajo seguimiento.',
  },
  {
    id: 'm2',
    storeId: 'farmacia-vida',
    time: '08:47',
    text: 'Farmacia Vida bajó la Vitamina C un 27%. Es el precio más bajo registrado este mes.',
  },
  {
    id: 'm3',
    storeId: 'super-ahorro',
    time: '09:15',
    text: 'Alerta: Super Ahorro subió el aceite de girasol un 26%. Toca el marcador rojo para ver el detalle.',
  },
  {
    id: 'm4',
    storeId: 'tech-store',
    time: '10:30',
    text: 'PixelTech incrementó los auriculares un 20%. Suele bajar de nuevo antes de rebajas.',
  },
  {
    id: 'm5',
    storeId: 'panaderia-espiga',
    time: '11:05',
    text: 'La Espiga mantiene el pan de masa madre estable. Todo en orden por aquí.',
  },
  {
    id: 'm6',
    time: '11:40',
    text: 'Resumen: 2 alertas de subida, 1 oferta destacada. Seguiré vigilando el barrio.',
  },
]
