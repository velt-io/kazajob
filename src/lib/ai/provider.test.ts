/**
 * Tests de la couche IA Groq (format de requête, flux SSE, erreurs affichées).
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_GROQ_MODEL, groqRequestBody, publicAIError, sseToTextStream } from './provider'

const msgs = [{ role: 'user' as const, content: 'Bonjour' }]

test('modèle par défaut : remplaçant officiel de Llama 3.3', () => {
  assert.equal(DEFAULT_GROQ_MODEL, 'openai/gpt-oss-120b')
})

test('gpt-oss : budget de raisonnement ajouté, effort bas, raisonnement non renvoyé', () => {
  const body = groqRequestBody('openai/gpt-oss-120b', msgs, { maxTokens: 80, temperature: 0.2 }, false)
  assert.equal(body.max_completion_tokens, 80 + 1024)
  assert.equal(body.reasoning_effort, 'low')
  assert.equal(body.include_reasoning, false)
  assert.equal(body.max_tokens, undefined)
  assert.equal(body.temperature, 0.2)
})

test('autre modèle (GROQ_MODEL) : paramètres classiques', () => {
  const body = groqRequestBody('qwen/qwen3.6-27b', msgs, undefined, true)
  assert.equal(body.max_tokens, 2048)
  assert.equal(body.reasoning_effort, undefined)
  assert.equal(body.stream, true)
})

async function readAll(chunks: string[]): Promise<string> {
  const enc = new TextEncoder()
  const src = new ReadableStream<Uint8Array>({
    start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)); c.close() },
  })
  return new Response(sseToTextStream(src)).text()
}

const ev = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`

test('flux SSE : texte reconstitué même quand une ligne est coupée entre deux paquets', async () => {
  const full = ev('Bonjour ') + ev('Maëva') + 'data: [DONE]\n\n'
  const cut = [full.slice(0, 17), full.slice(17, 40), full.slice(40)]
  assert.equal(await readAll(cut), 'Bonjour Maëva')
})

test('flux SSE : le raisonnement du modèle n’est jamais transmis', async () => {
  const reasoning = `data: ${JSON.stringify({ choices: [{ delta: { reasoning: 'je réfléchis…' } }] })}\n\n`
  assert.equal(await readAll([reasoning, ev('Réponse'), 'data: [DONE]\n\n']), 'Réponse')
})

test('erreurs affichées sans détail technique', () => {
  const notFound = new Error('Groq API stream error 404: {"error":{"code":"model_not_found"}}')
  assert.equal(publicAIError(notFound), 'KazaIA est momentanément indisponible. Réessaie dans un instant.')
  assert.match(publicAIError(new Error('Groq API error 429: rate limit')), /très sollicitée/)
  assert.match(publicAIError(new Error('GROQ_API_KEY manquant dans .env.local')), /pas encore configurée/)
})
