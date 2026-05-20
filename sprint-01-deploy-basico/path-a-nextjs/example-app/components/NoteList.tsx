'use client'

import { deleteNote } from '@/app/actions'
import type { Note } from '@/app/page'

const CATEGORY_COLORS: Record<string, string> = {
  general:  '#6b7280',
  trabajo:  '#2563eb',
  personal: '#16a34a',
  ideas:    '#d97706',
}

export default function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '3rem' }}>No hay notas. ¡Agrega una!</p>
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {notes.map(note => (
        <li
          key={note.id}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', background: '#fff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: CATEGORY_COLORS[note.category] ?? '#6b7280',
                  background: '#f3f4f6',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 999,
                }}>
                  {note.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(note.created_at).toLocaleDateString('es')}
                </span>
              </div>
              <strong style={{ fontSize: '1rem' }}>{note.title}</strong>
              {note.content && (
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.9rem' }}>{note.content}</p>
              )}
            </div>
            <form action={deleteNote.bind(null, note.id)}>
              <button
                type="submit"
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem' }}
                title="Eliminar"
              >
                ✕
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}
