/**
 * KAZAJOB — Couche d'abstraction IA
 * ─────────────────────────────────────────────────────────────
 * Provider actuel : Groq (openai/gpt-oss-120b — Llama 3.3 a été retiré par Groq le 16/08/2026)
 * Pour passer à Claude : AI_PROVIDER=anthropic + ANTHROPIC_API_KEY
 *
 * Interface unique → aucun changement côté application
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIStreamChunk {
  text: string
  done: boolean
}

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'

const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  // Surchargeable sans redéployer de code : GROQ_MODEL=openai/gpt-oss-20b (plus rapide)
  // ou qwen/qwen3.6-27b (autre remplaçant conseillé par Groq).
  model:   process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
}

/**
 * Les modèles gpt-oss « réfléchissent » avant de répondre, et ce raisonnement
 * consomme le même budget de jetons que la réponse. On garde donc maxTokens
 * comme longueur de la réponse visible et on ajoute un budget de raisonnement,
 * avec un effort bas (réponses rapides, suffisant pour nos usages).
 */
const REASONING_BUDGET = 1024

export function groqRequestBody(
  model: string,
  messages: AIMessage[],
  options: { maxTokens?: number; temperature?: number } | undefined,
  stream: boolean,
): Record<string, unknown> {
  const maxTokens = options?.maxTokens ?? 2048
  const reasoning = model.startsWith('openai/gpt-oss')
  return {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    stream,
    ...(reasoning
      ? { max_completion_tokens: maxTokens + REASONING_BUDGET, reasoning_effort: 'low', include_reasoning: false }
      : { max_tokens: maxTokens }),
  }
}

/** Message d'erreur affichable à l'utilisateur (le détail technique part dans les logs). */
export function publicAIError(err: unknown): string {
  const msg = err instanceof Error ? err.message : ''
  if (msg.includes('GROQ_API_KEY manquant')) return 'KazaIA n’est pas encore configurée sur ce serveur.'
  if (/\b429\b/.test(msg)) return 'KazaIA est très sollicitée en ce moment. Réessaie dans une minute.'
  return 'KazaIA est momentanément indisponible. Réessaie dans un instant.'
}

const ANTHROPIC_CONFIG = {
  // Quand tu passes à Claude, change juste AI_PROVIDER=anthropic
  // La lib @anthropic-ai/sdk sera utilisée automatiquement
  model: 'claude-opus-4-5',    // Meilleur pour la rédaction (ou sonnet pour moins cher)
}

function getProvider(): 'groq' | 'anthropic' {
  return (process.env.AI_PROVIDER ?? 'groq') as 'groq' | 'anthropic'
}

export async function generateText(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const provider = getProvider()

  if (provider === 'groq') {
    return generateWithGroq(messages, options)
  }

  if (provider === 'anthropic') {
    return generateWithAnthropic(messages, options)
  }

  throw new Error(`Provider inconnu : ${provider}`)
}

export async function streamText(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider()

  if (provider === 'groq') {
    return streamWithGroq(messages, options)
  }

  if (provider === 'anthropic') {
    return streamWithAnthropic(messages, options)
  }

  throw new Error(`Provider inconnu : ${provider}`)
}

async function generateWithGroq(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY manquant dans .env.local')

  const res = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(groqRequestBody(GROQ_CONFIG.model, messages, options, false)),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

async function streamWithGroq(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY manquant dans .env.local')

  const res = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(groqRequestBody(GROQ_CONFIG.model, messages, options, true)),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API stream error ${res.status}: ${err}`)
  }

  return sseToTextStream(res.body!)
}

/**
 * Transforme le SSE OpenAI-compatible de Groq en flux de texte brut.
 * Une ligne SSE peut arriver coupée entre deux paquets réseau : on garde
 * le reste incomplet en tampon au lieu de le jeter (sinon du texte se perd).
 * Seul delta.content est transmis (jamais le raisonnement du modèle).
 */
export function sseToTextStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      let buffer = ''
      const handle = (line: string): boolean => {
        if (!line.startsWith('data:')) return false
        const data = line.slice(5).trim()
        if (data === '[DONE]') return true
        try {
          const text = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        } catch {
          // Ligne mal formée : ignorée
        }
        return false
      }
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (handle(line.trim())) return
          }
        }
        handle(buffer.trim())
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}

async function generateWithAnthropic(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  // Décommenter quand AI_PROVIDER=anthropic et npm install @anthropic-ai/sdk
  //
  // const Anthropic = (await import('@anthropic-ai/sdk')).default
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  //
  // const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  // const userMessages = messages.filter(m => m.role !== 'system')
  //
  // const res = await client.messages.create({
  //   model:      ANTHROPIC_CONFIG.model,
  //   max_tokens: options?.maxTokens ?? 2048,
  //   system:     systemMsg,
  //   messages:   userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  // })
  //
  // return res.content[0].type === 'text' ? res.content[0].text : ''

  throw new Error('Anthropic non configuré — installe @anthropic-ai/sdk et décommente le code dans provider.ts')
}

async function streamWithAnthropic(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  // Décommenter quand AI_PROVIDER=anthropic
  //
  // const Anthropic = (await import('@anthropic-ai/sdk')).default
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  // const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  // const userMessages = messages.filter(m => m.role !== 'system')
  //
  // const encoder = new TextEncoder()
  // const stream = client.messages.stream({
  //   model: ANTHROPIC_CONFIG.model,
  //   max_tokens: options?.maxTokens ?? 2048,
  //   system: systemMsg,
  //   messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  // })
  //
  // return new ReadableStream({
  //   async start(controller) {
  //     for await (const event of stream) {
  //       if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
  //         controller.enqueue(encoder.encode(event.delta.text))
  //       }
  //     }
  //     controller.close()
  //   },
  // })

  throw new Error('Anthropic streaming non configuré')
}
