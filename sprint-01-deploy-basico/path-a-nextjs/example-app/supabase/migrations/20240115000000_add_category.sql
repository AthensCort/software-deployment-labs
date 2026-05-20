-- Segunda migración: agregar categoría a las notas
-- Ejemplo de cómo se hace una modificación al esquema existente

alter table public.notes
  add column if not exists category text not null default 'general';

-- Agregar un índice para búsquedas por categoría
create index if not exists notes_category_idx on public.notes (category);
