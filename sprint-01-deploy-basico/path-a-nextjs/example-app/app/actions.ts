'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string

  if (!title?.trim()) return

  await supabase.from('notes').insert({ title, content, category })
  revalidatePath('/')
}

export async function deleteNote(id: number) {
  const supabase = await createClient()
  await supabase.from('notes').delete().eq('id', id)
  revalidatePath('/')
}
