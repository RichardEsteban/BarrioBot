# BarrioBot

Panel interactivo estilo pixel-art que simula un agente vigilando los precios
de una zona piloto de tiendas del barrio. Cuando detecta un cambio de precio,
avisa en un chat en vivo y resalta la tienda en el mapa; al hacer clic se ve
el detalle completo (precio anterior, precio actual, variación y
recomendación). El agente también responde preguntas libres sobre los
precios, usando un LLM real cuando hay una API key configurada.

**Demo en vivo:** [v0-barriobot.vercel.app](https://v0-barriobot.vercel.app/)

## Capturas

| Mapa del vecindario + chat en vivo | Guía de bienvenida |
| --- | --- |
| ![Mapa interactivo con marcadores de tiendas y chat del agente](docs/screenshots/map-overview.png) | ![Modal de bienvenida con preguntas de ejemplo](docs/screenshots/welcome-modal.png) |

## Tech Stack

**Lenguajes**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**Frameworks y librerías**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

**IA y backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Anthropic Claude](https://img.shields.io/badge/Anthropic_Claude-191919?style=for-the-badge&logo=anthropic&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

**Herramientas y plataformas**

![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

## Cómo funciona el agente

- `lib/stores-data.ts` define las tiendas, su catálogo de productos y la
  simulación de eventos de precio (`pickPriceEvent`).
- **Monitoreo automático:** cada ~16 segundos (o al presionar **"Simular
  alerta"** en el panel del agente) se genera un evento de cambio de precio
  y se envía a `app/api/agent/route.ts`, que redacta la notificación y la
  recomendación.
- **Chat libre:** el vecino puede escribirle lo que quiera al agente desde
  el panel de la derecha; `app/api/chat/route.ts` responde usando el precio
  actual de todas las tiendas como contexto.
- **Nunca se rompe la demo:** ambas rutas prueban los proveedores de LLM en
  orden — `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` → `GEMINI_API_KEY` — y si
  ninguno está configurado (o la llamada falla) caen automáticamente a un
  generador de texto local, así el agente sigue respondiendo sin depender de
  ninguna API en el momento de la presentación.
- El estado visual de cada tienda (normal / alerta de subida / oferta) se
  calcula siempre a partir del precio real (`getStoreState`), nunca se marca
  a mano, para que el mapa y el chat nunca queden desincronizados.

## Configurar el LLM (opcional)

Copia `.env.example` a `.env.local` y define una o más:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

Se revisa primero `ANTHROPIC_API_KEY`, luego `OPENAI_API_KEY` y por último
`GEMINI_API_KEY`. Ninguna es obligatoria: sin key, el agente sigue
funcionando con el generador de texto local.

En Vercel: **Project Settings → Environment Variables**, agrega la(s)
misma(s) variable(s) y haz **Redeploy** — los deployments ya existentes no
recogen variables nuevas automáticamente.

## Getting Started

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

Desplegado en Vercel, conectado al repositorio de GitHub — cada push a
`main` dispara un deployment nuevo automáticamente.

---

