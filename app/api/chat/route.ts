import { NextResponse } from 'next/server'
import { ALERT_THRESHOLD_PCT, priceChangePct, type Store } from '@/lib/stores-data'

export const runtime = 'nodejs'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type StoreSnapshot = Pick<
  Store,
  'name' | 'category' | 'product' | 'previousPrice' | 'currentPrice' | 'recommendation'
> & { catalog?: { name: string; basePrice: number }[] }

type ChatRequestBody = {
  messages: ChatMessage[]
  stores: StoreSnapshot[]
}

function stateLabel(store: StoreSnapshot): string {
  const pct = priceChangePct(store)
  if (pct > ALERT_THRESHOLD_PCT) return 'SUBIDA'
  if (pct < -ALERT_THRESHOLD_PCT) return 'OFERTA'
  return 'normal'
}

function buildSystemPrompt(stores: StoreSnapshot[]): string {
  const lines = stores
    .map((s) => {
      const pct = priceChangePct(s)
      return `- ${s.name} (${s.category}): ${s.product} — antes S/ ${s.previousPrice.toFixed(2)}, ahora S/ ${s.currentPrice.toFixed(2)} (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%, ${stateLabel(s)}). Nota del agente: ${s.recommendation}`
    })
    .join('\n')

  return `Eres el agente de BarrioBot, que vigila los precios de las tiendas de un vecindario y ayuda al vecino a decidir dónde y cuándo comprar.

Tiendas bajo seguimiento ahora mismo:
${lines}

Responde siempre en español, en tono cercano y breve (2-4 frases). Basa tus respuestas únicamente en los datos anteriores; si preguntan algo fuera de esta lista, acláralo en vez de inventar.`
}

/**
 * No-network fallback so the chat keeps working even without any API key
 * configured, or if every LLM call fails — same philosophy as /api/agent.
 */
function templateReply(userText: string, stores: StoreSnapshot[]): string {
  const lower = userText.toLowerCase()
  const match = stores.find(
    (s) =>
      lower.includes(s.name.toLowerCase()) ||
      lower.includes(s.product.toLowerCase()) ||
      s.catalog?.some((p) => lower.includes(p.name.toLowerCase())),
  )
  if (match) {
    const pct = priceChangePct(match)
    const trend =
      pct > 0.5 ? `subió ${pct.toFixed(0)}%` : pct < -0.5 ? `bajó ${Math.abs(pct).toFixed(0)}%` : 'se mantiene estable'
    return `${match.name}: ${match.product} ${trend}, ahora en S/ ${match.currentPrice.toFixed(2)}. ${match.recommendation}`
  }

  const alerts = stores.filter((s) => stateLabel(s) !== 'normal')
  if (alerts.length === 0) {
    return 'No tengo una IA conectada ahora mismo, pero por lo que veo todas las tiendas están con precios estables. Toca un marcador para el detalle.'
  }
  const summary = alerts
    .map((s) => `${s.name} (${priceChangePct(s) > 0 ? '+' : ''}${priceChangePct(s).toFixed(0)}%)`)
    .join(', ')
  return `No tengo una IA conectada ahora mismo, pero esto es lo último que vi: ${summary}. Toca un marcador en el mapa para el detalle.`
}

function extractText(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim()
}

async function callAnthropic(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system,
      messages,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}`)
  const data = await res.json()
  const text = extractText(data?.content?.[0]?.text)
  if (!text) throw new Error('Respuesta vacía de Anthropic')
  return text
}

async function callOpenAI(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  const text = extractText(data?.choices?.[0]?.message?.content)
  if (!text) throw new Error('Respuesta vacía de OpenAI')
  return text
}

async function callGemini(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = extractText(data?.candidates?.[0]?.content?.parts?.[0]?.text)
  if (!text) throw new Error('Respuesta vacía de Gemini')
  return text
}

export async function POST(req: Request) {
  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { messages, stores } = body
  if (!Array.isArray(messages) || messages.length === 0 || !Array.isArray(stores)) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const system = buildSystemPrompt(stores)
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  // Same "never breaks the demo" pattern as /api/agent: try each configured
  // provider in order, and fall back to a local template if all fail.
  try {
    if (anthropicKey) return NextResponse.json({ text: await callAnthropic(anthropicKey, system, messages) })
    if (openaiKey) return NextResponse.json({ text: await callOpenAI(openaiKey, system, messages) })
    if (geminiKey) return NextResponse.json({ text: await callGemini(geminiKey, system, messages) })
  } catch (err) {
    console.error('[/api/chat] LLM call failed, using template fallback:', err)
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  return NextResponse.json({ text: templateReply(lastUser?.content ?? '', stores) })
}
