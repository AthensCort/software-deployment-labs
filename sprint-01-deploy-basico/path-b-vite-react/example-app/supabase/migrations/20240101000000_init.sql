-- Migración inicial: tabla de tareas
create table if not exists public.tasks (
  id         bigserial   primary key,
  title      text        not null check (char_length(title) > 0),
  completed  boolean     not null default false,
  priority   text        not null default 'media' check (priority in ('alta', 'media', 'baja')),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Acceso público" on public.tasks
  for all using (true) with check (true);
