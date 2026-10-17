-- ============================================================================
-- Migración inicial para Supabase (PostgreSQL)
-- Compatible con Supabase CLI (supabase migration new init_schema)
-- ============================================================================

-- Habilitar extensión para generación de UUIDs (por defecto ya viene activa en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TIPOS ENUMERADOS (ENUMs)
-- ============================================================================

DO $$ BEGIN CREATE TYPE user_sex AS ENUM ('M', 'F', 'O'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('INTERESADO', 'SECRETARIO', 'DIRECTOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE procedure_state AS ENUM ('INICIADO', 'EN PROCESO', 'APROBADO', 'RECHAZADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 2. TABLA: profiles / users
-- NOTA IMPORTANTE SUPABASE:
-- Supabase gestiona autenticación en el schema auth.users (donde guarda id, email, password cifrada).
-- Por convención y seguridad, esta tabla almacena los datos de perfil y se enlaza
-- al usuario autenticado mediante: REFERENCES auth.users(id) ON DELETE CASCADE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
name VARCHAR(100) NOT NULL,
lastname VARCHAR(100) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
dni VARCHAR(20) UNIQUE NOT NULL,
cuil VARCHAR(20) UNIQUE NOT NULL,
birthdate DATE NOT NULL,
sex user_sex NOT NULL,
phone VARCHAR(30),
address TEXT,
role user_role NOT NULL DEFAULT 'INTERESADO',
verified BOOLEAN NOT NULL DEFAULT false,
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. TABLA: procedures (Trámites)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedures (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
state procedure_state NOT NULL DEFAULT 'INICIADO',
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. TABLA: documents (Documentos asociados a un trámite)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
rute TEXT NOT NULL,                  -- Ruta o URL del archivo (ej. Supabase Storage bucket)
validity INTEGER NOT NULL DEFAULT 0, -- Días de validez o año según tu lógica de dominio
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. TABLA INTERMEDIA (Opcional según tu comentario: id | id_tramite | id_documento)
-- Si la relación es Muchos a Muchos (un documento reutilizable en varios trámites).
-- Si un documento pertenece estrictamente a un trámite, la FK de documents.procedure_id es suficiente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedure_documents (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
CONSTRAINT unique_procedure_document UNIQUE (procedure_id, document_id)
);

-- ============================================================================
-- 6. ÍNDICES DE CONSULTA RÁPIDA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);
CREATE INDEX IF NOT EXISTS idx_profiles_cuil ON public.profiles(cuil);
CREATE INDEX IF NOT EXISTS idx_procedures_user ON public.procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_state ON public.procedures(state);
CREATE INDEX IF NOT EXISTS idx_documents_procedure ON public.documents(procedure_id);

-- ============================================================================
-- 7. TRIGGER: Actualización automática de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_procedures_updated_at ON public.procedures;
CREATE TRIGGER set_procedures_updated_at
BEFORE UPDATE ON public.procedures
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 8. TRIGGER DE AUTENTICACIÓN (Supabase Best Practice)
-- Sincroniza automáticamente la creación de usuarios desde auth.users a public.profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles ( id, email, name, lastname, dni, cuil, birthdate, sex, role ) VALUES ( NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'lastname', ''), COALESCE(NEW.raw_user_meta_data->>'dni', ''), COALESCE(NEW.raw_user_meta_data->>'cuil', ''), COALESCE((NEW.raw_user_meta_data->>'birthdate')::date, CURRENT_DATE), COALESCE((NEW.raw_user_meta_data->>'sex')::user_sex, 'O'::user_sex), COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'INTERESADO'::user_role) ); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();