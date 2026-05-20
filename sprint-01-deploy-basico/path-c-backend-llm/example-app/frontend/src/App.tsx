import { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage, clearMessages, type Message } from './lib/api'

const ENV = import.meta.env.VITE_ENV_NAME ?? 'local'
const ENV_COLOR: Record<string, string> = {
  development: '#2563eb', staging: '#d97706', production: '#16a34a', local: '#6b7280',
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMessages().then(setMessages).catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now(), role: 'user', content: input, created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const reply = await sendMessage(userMsg.content)
      setMessages(prev => [...prev, reply])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleClear() {
    await clearMessages()
    setMessages([])
  }

  const color = ENV_COLOR[ENV] ?? ENV_COLOR.local

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: color, color: '#fff', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Chat con IA</strong>
          <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', opacity: 0.8 }}>Entorno: {ENV}</span>
        </div>
        <button onClick={handleClear} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
          Limpiar chat
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f9fafb' }}>
        {messages.length === 0 && !loading && (
          <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '3rem' }}>Escribe un mensaje para comenzar.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '0.6rem 1rem',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? color : '#fff',
              color: msg.role === 'user' ? '#fff' : '#111827',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '0.6rem 1rem', borderRadius: '18px 18px 18px 4px', color: '#6b7280', fontSize: '0.9rem' }}>
              Escribiendo...
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', background: '#fff' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
          style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid #d1d5db', borderRadius: 24, fontSize: '0.95rem', outline: 'none' }}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ background: color, color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 24, cursor: 'pointer', fontSize: '0.95rem', opacity: loading || !input.trim() ? 0.6 : 1 }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
