'use client'

import { useRef } from 'react'
import { createNote } from '@/app/actions'

const CATEGORIES = ['general', 'trabajo', 'personal', 'ideas']

export default function NoteForm() {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await createNote(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          name="title"
          placeholder="Título de la nota"
          required
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '1rem' }}
        />
        <textarea
          name="content"
          placeholder="Contenido (opcional)"
          rows={3}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '1rem', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            name="category"
            defaultValue="general"
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '1rem' }}
          >
            Agregar nota
          </button>
        </div>
      </div>
    </form>
  )
}
