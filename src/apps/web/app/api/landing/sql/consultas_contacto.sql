-- Tabla del formulario de contacto. Ejecutar en Supabase: SQL Editor > New query.
-- Es la única tabla que usa el sitio de presentación; no toca las del sistema de inscripción.

create table if not exists public.consultas_contacto (
    id uuid primary key default gen_random_uuid(),
    nombre text not null check (char_length(nombre) between 2 and 100),
    email text not null check (char_length(email) <= 254),
    asunto text not null,
    mensaje text not null check (char_length(mensaje) between 10 and 2000),
    estado text not null default 'nueva' check (estado in ('nueva', 'leida', 'respondida')),
    creado_en timestamptz not null default now()
);

-- RLS activada y SIN políticas: nadie puede leer ni escribir desde el navegador.
-- Solo el backend PHP, con la clave service_role, inserta consultas.
alter table public.consultas_contacto enable row level security;
