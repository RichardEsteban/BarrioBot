import { NextResponse } from 'next/server'

export type AgentRequestBody = {
  storeName: string
  category: string
  product: string
  previousPrice: number
  currentPrice: number
}

type AgentResult = {
  message: string
  recommendation: string
  source: 'llm' | 'template'
}

/**
 * No-network fallback so the demo keeps working even without an API key
 * configured, or if the LLM call fails/times out mid-presentation.
 */
function templateResult(body: AgentRequestBody): AgentResult {
  const pct = ((body.currentPrice - body.previousPrice) / body.previousPrice) * 100
  const up = pct > 0
  const message = `${body.storeName}: ${body.product} ${up ? 'subió' : 'bajó'} ${Math.abs(pct).toFixed(0)}%, ahora en S/ ${body.currentPrice.toFixed(2)}.`
  const recommendation = up
    ? 'Subida notable. Conviene comparar antes de comprar aquí esta semana.'
    : 'Buen momento para aprovechar, es de las bajadas más fuertes registradas.'
  return { message, recommendation, source: 'template' }
}

function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No se encontró JSON en la respuesta del modelo')
  return text.slice(start, end + 1)
}

function buildPrompt(body: AgentRequestBody): string {
  const pct = ((body.currentPrice - body.previousPrice) / body.previousPrice) * 100
  return `Eres un agente que vigila precios de productos en tiendas de un barrio y avisa a los vecinos apenas detecta un cambio.

Tienda: ${body.storeName} (${body.category})
Producto: ${body.product}
Precio anterior: S/ ${body.previousPrice.toFixed(2)}
Precio actual: S/ ${body.currentPrice.toFixed(2)}
Cambio: ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con esta forma exacta:
{"message": "...", "recommendation": "..."}

Reglas:
- "message": notificación corta (máx. 20 palabras) en español, tono cercano y directo, contando el cambio de precio.
- "recommendation": recomendación corta (máx. 20 palabras) en español, útil y concreta para el vecino.`
}

async function callAnthropic(apiKey: string, body: AgentRequestBody): Promise<AgentResult | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: buildPrompt(body) }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}`)
  const data = await res.json()
  const text = data?.content?.[0]?.text ?? ''
  const parsed = JSON.parse(extractJson(text))
  if (!parsed?.message || !parsed?.recommendation) return null
  return { message: parsed.message, recommendation: parsed.recommendation, source: 'llm' }
}

async function callOpenAI(apiKey: string, body: AgentRequestBody): Promise<AgentResult | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [{ role: 'user', content: buildPrompt(body) }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(extractJson(text))
  if (!parsed?.message || !parsed?.recommendation) return null
  return { message: parsed.message, recommendation: parsed.recommendation, source: 'llm' }
}

export async function POST(req: Request) {
  let body: AgentRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { storeName, category, product, previousPrice, currentPrice } = body
  if (
    !storeName ||
    !category ||
    !product ||
    typeof previousPrice !== 'number' ||
    typeof currentPrice !== 'number' ||
    previousPrice <= 0
  ) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // Never let a broken/missing key take down the demo — always fall back to
  // a template-generated alert if the LLM call fails for any reason.
  try {
    if (anthropicKey) {
      const result = await callAnthropic(anthropicKey, body)
      if (result) return NextResponse.json(result)
    } else if (openaiKey) {
      const result = await callOpenAI(openaiKey, body)
      if (result) return NextResponse.json(result)
    }
  } catch (err) {
    console.error('[/api/agent] LLM call failed, using template fallback:', err)
  }

  return NextResponse.json(templateResult(body))
}
