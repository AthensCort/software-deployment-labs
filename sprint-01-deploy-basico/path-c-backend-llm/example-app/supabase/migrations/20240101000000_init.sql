-- Migración inicial: historial de mensajes del chat
create table if not exists public.messages (
  id         bigserial   primary key,
  role       text        not null check (role in ('user', 'assistant', 'system')),
  content    text        not null,
  created_at timestamptz not null default now()
);

-- RLS: el backend accede con service_role (ignora RLS)
-- El frontend NO accede directamente a esta tabla
alter table public.messages enable row level security;

-- Sin políticas públicas: solo el backend (service_role) puede leer/escribir
-- Esto es correcto — el frontend siempre pasa por el backend
