import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno.\n' +
    'Crea un archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos que reflejan el esquema de la base de datos
export type Task = {
  id: number
  title: string
  completed: boolean
  priority: 'alta' | 'media' | 'baja'
  created_at: string
}
