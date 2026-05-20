// Cliente para comunicarse con el backend
// El frontend NUNCA llama a Supabase o al LLM directamente

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

export type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(`${BASE_URL}/api/messages`)
  if (!res.ok) throw new Error('Error al cargar mensajes')
  return res.json()
}

export async function sendMessage(message: string): Promise<Message> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error del servidor')
  }
  return res.json()
}

export async function clearMessages(): Promise<void> {
  await fetch(`${BASE_URL}/api/messages`, { method: 'DELETE' })
}
