# BarrioBot

Panel interactivo estilo pixel-art que simula un agente vigilando los
precios de una zona piloto de tiendas del barrio. Cuando detecta un cambio
de precio, avisa en un chat en vivo y resalta la tienda en el mapa; al hacer
clic se ve el detalle completo (precio anterior, precio actual, variación y
recomendación).



## Cómo funciona el agente

- `lib/stores-data.ts` define las tiendas, su catálogo de productos y la
  simulación de eventos de precio (`pickPriceEvent`).
- Cada ~16 segundos (o al presionar **"Simular alerta"** en el panel del
  agente) se genera un evento de cambio de precio y se envía a
  `app/api/agent/route.ts`.
- Esa ruta intenta redactar el mensaje y la recomendación con un LLM real
  (Anthropic u OpenAI, según qué API key esté configurada). Si no hay ninguna
  key configurada, o la llamada falla, cae automáticamente en un generador de
  texto local (`templateResult`) — así la demo nunca se rompe en vivo.
- El estado visual de cada tienda (normal / alerta de subida / oferta) se
  calcula siempre a partir del precio real (`getStoreState`), nunca se marca
  a mano, para que el mapa y el chat nunca queden desincronizados.

## Configurar el LLM (opcional)

Copia `.env.example` a `.env.local` y define una de las dos:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# o
OPENAI_API_KEY=sk-...
```

En Vercel: Project Settings → Environment Variables, agrega la misma
variable y vuelve a desplegar.

## Getting Started

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui, desplegado
en Vercel. Generado inicialmente con [v0](https://v0.app).
