import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app  = express()
const port = process.env.PORT || 3001

// ── Supabase (con service_role — acceso total, solo en el servidor) ──────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}))

// ── Health check (útil para verificar que el servidor responde) ───────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV ?? 'development' })
})

// ── GET /api/messages — historial del chat ────────────────────────────────────
app.get('/api/messages', async (_req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ── POST /api/chat — enviar mensaje y obtener respuesta del LLM ───────────────
app.post('/api/chat', async (req, res) => {
  const { message } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'El campo message es requerido' })
  }

  // 1. Guardar el mensaje del usuario en Supabase
  await supabase.from('messages').insert({ role: 'user', content: message })

  // 2. Obtener los últimos mensajes para contexto
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .order('created_at', { ascending: true })
    .limit(20)

  // 3. Llamar al LLM
  // El ejemplo usa OpenAI — adaptar según el proveedor de tu proyecto
  let assistantMessage = ''

  try {
    assistantMessage = await callLLM(history ?? [])
  } catch (err) {
    return res.status(500).json({ error: `Error del LLM: ${err.message}` })
  }

  // 4. Guardar la respuesta del asistente
  const { data: saved } = await supabase
    .from('messages')
    .insert({ role: 'assistant', content: assistantMessage })
    .select()
    .single()

  res.json(saved)
})

// ── DELETE /api/messages — limpiar historial ──────────────────────────────────
app.delete('/api/messages', async (_req, res) => {
  const { error } = await supabase.from('messages').delete().neq('id', 0)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ── Función auxiliar: llamar al LLM ──────────────────────────────────────────
// Adaptar según tu proveedor. Ambos ejemplos siguen el mismo patrón.
async function callLLM(messages) {

  // ── Opción A: OpenAI ───────────────────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un asistente útil y conciso.' },
          ...messages,
        ],
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? 'Error de OpenAI')
    return data.choices[0].message.content
  }

  // ── Opción B: Anthropic ────────────────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     'Eres un asistente útil y conciso.',
        messages,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? 'Error de Anthropic')
    return data.content[0].text
  }

  // ── Fallback: respuesta simulada (sin API key) ────────────────────────────
  return `[Modo demo] Recibí tu mensaje: "${messages.at(-1)?.content}". Configura OPENAI_API_KEY o ANTHROPIC_API_KEY para respuestas reales.`
}

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend corriendo en http://localhost:${port}`)
  console.log(`LLM: ${process.env.OPENAI_API_KEY ? 'OpenAI' : process.env.ANTHROPIC_API_KEY ? 'Anthropic' : 'modo demo (sin key)'}`)
})
