-- Migración inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor

create table if not exists public.notes (
  id         bigserial    primary key,
  title      text         not null check (char_length(title) > 0),
  content    text         not null default '',
  created_at timestamptz  not null default now()
);

-- Row Level Security: cualquiera puede leer y escribir
-- En un proyecto real, esto lo restringirías por usuario autenticado
alter table public.notes enable row level security;

create policy "Acceso público" on public.notes
  for all using (true) with check (true);
