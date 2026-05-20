import { createClient } from '@/utils/supabase/server'
import NoteForm from '@/components/NoteForm'
import NoteList from '@/components/NoteList'

export const dynamic = 'force-dynamic'

export type Note = {
  id: number
  title: string
  content: string
  category: string
  created_at: string
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: 6 }}>
        Error al conectar con Supabase: {error.message}
        <br />
        <small>Verificar variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY</small>
      </div>
    )
  }

  return (
    <>
      <NoteForm />
      <NoteList notes={notes ?? []} />
    </>
  )
}
