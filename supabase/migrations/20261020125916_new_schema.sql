-- ============================================================================
-- Esquema inicial actualizado para Supabase (PostgreSQL)
-- Proyecto TFI - Sistema de ingreso a la TUP
--
-- IMPORTANTE:
-- - Este archivo está pensado para una BASE DE DATOS NUEVA.
-- - Si ya ejecutaron una migración anterior en un proyecto con datos, no la
--   reemplacen ni la ejecuten a ciegas: preparen una migración incremental.
-- - La liberación automática por vencimiento requiere programar la función
--   public.expire_reservations() (ver comentarios al final).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.user_sex AS ENUM ('M', 'F', 'O');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('INTERESADO', 'SECRETARIO', 'DIRECTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.procedure_state AS ENUM ('INICIADO', 'EN PROCESO', 'APROBADO', 'RECHAZADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. PROFILES / USERS
-- Supabase Auth guarda las credenciales en auth.users.
-- Esta tabla contiene los datos de perfil.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  dni VARCHAR(20) UNIQUE NOT NULL,
  cuil VARCHAR(20) UNIQUE NOT NULL,
  birthdate DATE NOT NULL,
  sex public.user_sex NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  role public.user_role NOT NULL DEFAULT 'INTERESADO',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. INGRESOS / PERÍODOS DE INGRESO
-- Un registro por período de ingreso (ej. Primer cuatrimestre 2027).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL UNIQUE,
  total_cupos INTEGER NOT NULL CHECK (total_cupos >= 0),
  cupos_disponibles INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ingresos_cupos_disponibles_check
    CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= total_cupos)
);

-- ============================================================================
-- 4. PROCEDURES / TRÁMITES
-- Cada trámite se vincula con el período de ingreso correspondiente.
-- ingreso_id queda nullable para permitir trámites sin período asignado aún.
-- Si todo trámite debe tener período desde su creación, cambiarlo a NOT NULL.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ingreso_id UUID REFERENCES public.ingresos(id) ON DELETE RESTRICT,
  state public.procedure_state NOT NULL DEFAULT 'INICIADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. DOCUMENTS / DOCUMENTOS DEL TRÁMITE
-- Cada documento pertenece directamente a un trámite mediante procedure_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  rute TEXT NOT NULL,
  validity INTEGER NOT NULL DEFAULT 0,
  document_type VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (status IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La tabla procedure_documents no se crea en este esquema porque documents ya
-- contiene procedure_id. Solo sería necesaria si un mismo documento pudiera
-- relacionarse con varios trámites (relación muchos a muchos).

-- ============================================================================
-- 6. RESERVATIONS / RESERVAS DE CUPOS
-- Se conserva el historial: las reservas vencidas/canceladas no se borran.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE RESTRICT,
  status public.reservation_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Como máximo una reserva activa por trámite. Se permiten nuevas reservas
-- después de que la anterior haya vencido o sido cancelada.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_one_active_per_procedure
  ON public.reservations (procedure_id)
  WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED');

-- Índice para buscar reservas pendientes que ya vencieron.
CREATE INDEX IF NOT EXISTS idx_reservations_status_expires_at
  ON public.reservations (status, expires_at);

-- ============================================================================
-- 7. PAYMENTS / PAGOS
-- Se separa el pago de la reserva para desacoplar el sistema del proveedor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE RESTRICT,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  provider VARCHAR(100),
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id
  ON public.payments (reservation_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status);

-- ============================================================================
-- 8. ÍNDICES GENERALES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);
CREATE INDEX IF NOT EXISTS idx_profiles_cuil ON public.profiles(cuil);
CREATE INDEX IF NOT EXISTS idx_procedures_user ON public.procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_ingreso ON public.procedures(ingreso_id);
CREATE INDEX IF NOT EXISTS idx_procedures_state ON public.procedures(state);
CREATE INDEX IF NOT EXISTS idx_documents_procedure ON public.documents(procedure_id);
CREATE INDEX IF NOT EXISTS idx_reservations_procedure ON public.reservations(procedure_id);

-- ============================================================================
-- 9. FUNCIÓN Y TRIGGERS PARA updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ingresos_updated_at ON public.ingresos;
CREATE TRIGGER set_ingresos_updated_at
BEFORE UPDATE ON public.ingresos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_procedures_updated_at ON public.procedures;
CREATE TRIGGER set_procedures_updated_at
BEFORE UPDATE ON public.procedures
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 10. CREAR RESERVA Y DESCONTAR CUPO ATÓMICAMENTE
--
-- Invocar esta función desde el backend; no descontar cupos desde el frontend.
-- Devuelve el UUID de la reserva creada.
-- p_expires_at debe ser NULL para reservas sin vencimiento temporal.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_reservation(
  p_procedure_id UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ingreso_id UUID;
  v_reservation_id UUID;
BEGIN
  -- Bloquea el trámite y obtiene su período de ingreso.
  SELECT ingreso_id
    INTO v_ingreso_id
    FROM public.procedures
   WHERE id = p_procedure_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el trámite indicado';
  END IF;

  IF v_ingreso_id IS NULL THEN
    RAISE EXCEPTION 'El trámite no tiene un período de ingreso asignado';
  END IF;

  -- No permitir una segunda reserva activa para el mismo trámite.
  IF EXISTS (
    SELECT 1
      FROM public.reservations
     WHERE procedure_id = p_procedure_id
       AND status IN ('PENDING_PAYMENT', 'CONFIRMED')
  ) THEN
    RAISE EXCEPTION 'El trámite ya tiene una reserva activa';
  END IF;

  -- UPDATE condicional: si no hay cupos, no actualiza ninguna fila.
  UPDATE public.ingresos
     SET cupos_disponibles = cupos_disponibles - 1
   WHERE id = v_ingreso_id
     AND cupos_disponibles > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay cupos disponibles para este período';
  END IF;

  INSERT INTO public.reservations (procedure_id, status, expires_at)
  VALUES (p_procedure_id, 'PENDING_PAYMENT', p_expires_at)
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

-- ============================================================================
-- 11. EXPIRAR RESERVAS VENCIDAS Y DEVOLVER CUPOS
--
-- Ejecutar esta función periódicamente con un scheduler (por ejemplo, pg_cron
-- si está habilitado en el proyecto Supabase). Cada reserva solo libera un
-- cupo una vez, porque se actualiza únicamente si sigue PENDING_PAYMENT.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_ingreso_id UUID;
  v_expired_count INTEGER := 0;
BEGIN
  FOR v_reservation IN
    SELECT r.id, r.procedure_id
      FROM public.reservations r
     WHERE r.status = 'PENDING_PAYMENT'
       AND r.expires_at IS NOT NULL
       AND r.expires_at <= now()
     FOR UPDATE SKIP LOCKED
  LOOP
    -- Marcar como vencida solo si todavía sigue pendiente.
    UPDATE public.reservations
       SET status = 'EXPIRED'
     WHERE id = v_reservation.id
       AND status = 'PENDING_PAYMENT';

    IF FOUND THEN
      SELECT p.ingreso_id
        INTO v_ingreso_id
        FROM public.procedures p
       WHERE p.id = v_reservation.procedure_id;

      IF v_ingreso_id IS NOT NULL THEN
        UPDATE public.ingresos
           SET cupos_disponibles = LEAST(cupos_disponibles + 1, total_cupos)
         WHERE id = v_ingreso_id;
      END IF;

      v_expired_count := v_expired_count + 1;
    END IF;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- ============================================================================
-- 12. TRIGGER DE AUTENTICACIÓN
-- Crea un perfil cuando se registra un usuario en auth.users.
-- La aplicación debe enviar los metadatos obligatorios requeridos por profiles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, lastname, dni, cuil, birthdate, sex, role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'cuil', ''),
    COALESCE((NEW.raw_user_meta_data->>'birthdate')::date, CURRENT_DATE),
    COALESCE((NEW.raw_user_meta_data->>'sex')::public.user_sex, 'O'::public.user_sex),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'INTERESADO'::public.user_role)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. SEGURIDAD Y PUESTA EN MARCHA
--
-- Revisar las políticas RLS antes de exponer tablas a clientes. No habilitar
-- acceso público a ingresos/reservations/payments sin políticas adecuadas.
--
-- La función create_reservation debe exponerse únicamente a usuarios/backend
-- autorizados. Revisar GRANT/REVOKE y validar la identidad del usuario en el
-- backend o dentro de la función según el modelo de autenticación del proyecto.
--
-- Programar public.expire_reservations() para que se ejecute periódicamente.
-- No se programa aquí automáticamente porque la disponibilidad/configuración
-- de pg_cron varía según el proyecto Supabase.
-- ============================================================================
