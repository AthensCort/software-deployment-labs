import { useState, useEffect } from 'react'
import { supabase, type Task } from './lib/supabase'

const ENV = import.meta.env.VITE_ENV_NAME ?? 'local'
const ENV_COLOR: Record<string, string> = {
  development: '#2563eb',
  staging:     '#d97706',
  production:  '#16a34a',
  local:       '#6b7280',
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  alta:  '🔴 Alta',
  media: '🟡 Media',
  baja:  '🟢 Baja',
}

export default function App() {
  const [tasks, setTasks]   = useState<Task[]>([])
  const [title, setTitle]   = useState('')
  const [priority, setPriority] = useState<Task['priority']>('media')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setTasks(data ?? [])
    setLoading(false)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: title.trim(), priority, completed: false })
      .select().single()
    if (error) setError(error.message)
    else { setTasks(prev => [data, ...prev]); setTitle('') }
  }

  async function toggleTask(task: Task) {
    const { error } = await supabase
      .from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    if (error) setError(error.message)
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
  }

  async function deleteTask(id: number) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) setError(error.message)
    else setTasks(prev => prev.filter(t => t.id !== id))
  }

  const color = ENV_COLOR[ENV] ?? ENV_COLOR.local

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>

      {/* Banner de entorno — útil para saber en cuál estás */}
      <div style={{ background: color, color: '#fff', padding: '0.4rem 1rem', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Entorno: {ENV} · {import.meta.env.VITE_SUPABASE_URL}
      </div>

      <h1 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Mis Tareas</h1>

      {/* Formulario */}
      <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Nueva tarea..."
          style={{ flex: 1, minWidth: 200, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '1rem' }}
        />
        <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <button type="submit" style={{ background: color, color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontSize: '1rem' }}>
          Agregar
        </button>
      </form>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>⚠️ {error}</div>}
      {loading && <p style={{ color: '#6b7280' }}>Cargando...</p>}

      {/* Lista */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.map(task => (
          <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, background: task.completed ? '#f9fafb' : '#fff' }}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#9ca3af' : '#111827' }}>
              {task.title}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{PRIORITY_LABEL[task.priority]}</span>
            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </li>
        ))}
      </ul>

      {!loading && tasks.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>No hay tareas aún.</p>}
    </div>
  )
}
