-- ============================================================================
-- Renombrar el esquema al español y alinear los estados con el dominio
-- (ADR-0007, spec 001-postulacion-plazo-cupos, research R8)
--
-- - profiles → perfiles, procedures → postulaciones, documents → documentos.
-- - Enums nuevos: rol_usuario, sexo, estado_postulacion, estado_documento.
--   Postgres no permite borrar valores de un enum, así que se crean enums nuevos,
--   se convierten las columnas con USING y se eliminan los viejos.
-- - Se elimina procedure_documents: documentos.postulacion_id alcanza.
-- - handle_updated_at() pasa a ser actualizar_actualizado_el().
--
-- El trigger de registro (handle_new_user) queda roto entre esta migración y la
-- de registro estricto (20261021000300), que lo reemplaza: todas se aplican juntas.
-- ============================================================================

-- ============================================================================
-- 1. Tabla intermedia que sobra
-- ============================================================================

DROP TABLE IF EXISTS public.procedure_documents;

-- ============================================================================
-- 2. Enums nuevos
-- ============================================================================

CREATE TYPE public.rol_usuario AS ENUM ('ASPIRANTE', 'SECRETARIA', 'DIRECCION', 'TESORERIA');

CREATE TYPE public.sexo AS ENUM ('M', 'F', 'O');

CREATE TYPE public.estado_postulacion AS ENUM (
  'PREINSCRIPTO',
  'PAGO_PENDIENTE',
  'PAGO_EN_REVISION',
  'VACANTE_CONFIRMADA',
  'VENCIDO',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
  'DOCUMENTACION_VALIDADA',
  'CONFIRMADO_PARA_EXPORTAR'
);

CREATE TYPE public.estado_documento AS ENUM ('PENDIENTE', 'APROBADO', 'OBSERVADO');

-- ============================================================================
-- 3. perfiles (antes profiles)
-- ============================================================================

ALTER TABLE public.profiles RENAME TO perfiles;

ALTER TABLE public.perfiles RENAME COLUMN name TO nombre;
ALTER TABLE public.perfiles RENAME COLUMN lastname TO apellido;
ALTER TABLE public.perfiles RENAME COLUMN birthdate TO fecha_nacimiento;
ALTER TABLE public.perfiles RENAME COLUMN sex TO sexo;
ALTER TABLE public.perfiles RENAME COLUMN phone TO telefono;
ALTER TABLE public.perfiles RENAME COLUMN address TO direccion;
ALTER TABLE public.perfiles RENAME COLUMN role TO rol;
ALTER TABLE public.perfiles RENAME COLUMN verified TO verificado;
ALTER TABLE public.perfiles RENAME COLUMN created_at TO creado_el;
ALTER TABLE public.perfiles RENAME COLUMN updated_at TO actualizado_el;

-- El default viejo ('INTERESADO'::user_role) no se puede convertir solo: se saca y se vuelve a poner.
ALTER TABLE public.perfiles ALTER COLUMN rol DROP DEFAULT;
ALTER TABLE public.perfiles
  ALTER COLUMN rol TYPE public.rol_usuario USING (
    CASE rol::text
      WHEN 'INTERESADO' THEN 'ASPIRANTE'
      WHEN 'SECRETARIO' THEN 'SECRETARIA'
      WHEN 'DIRECTOR' THEN 'DIRECCION'
      WHEN 'ADMIN' THEN 'TESORERIA'  -- ADMIN era Tesorería (ADR-0007)
    END
  )::public.rol_usuario;
ALTER TABLE public.perfiles ALTER COLUMN rol SET DEFAULT 'ASPIRANTE';

ALTER TABLE public.perfiles
  ALTER COLUMN sexo TYPE public.sexo USING sexo::text::public.sexo;

ALTER INDEX public.idx_profiles_dni RENAME TO idx_perfiles_dni;
ALTER INDEX public.idx_profiles_cuil RENAME TO idx_perfiles_cuil;

-- ============================================================================
-- 4. postulaciones (antes procedures)
-- ============================================================================

ALTER TABLE public.procedures RENAME TO postulaciones;

ALTER TABLE public.postulaciones RENAME COLUMN user_id TO aspirante_id;
ALTER TABLE public.postulaciones RENAME COLUMN state TO estado;
ALTER TABLE public.postulaciones RENAME COLUMN created_at TO creado_el;
ALTER TABLE public.postulaciones RENAME COLUMN updated_at TO actualizado_el;

-- Mapeo de los estados viejos (datos de prueba). "EN PROCESO" va a PREINSCRIPTO y no a
-- PAGO_PENDIENTE: una Postulación pendiente necesita vence_el (CHECK de 20261021000200), y estas
-- filas no tienen un plazo real que inventarles.
ALTER TABLE public.postulaciones ALTER COLUMN estado DROP DEFAULT;
ALTER TABLE public.postulaciones
  ALTER COLUMN estado TYPE public.estado_postulacion USING (
    CASE estado::text
      WHEN 'INICIADO' THEN 'PREINSCRIPTO'
      WHEN 'EN PROCESO' THEN 'PREINSCRIPTO'
      WHEN 'APROBADO' THEN 'VACANTE_CONFIRMADA'
      WHEN 'RECHAZADO' THEN 'VENCIDO'
    END
  )::public.estado_postulacion;
ALTER TABLE public.postulaciones ALTER COLUMN estado SET DEFAULT 'PREINSCRIPTO';

ALTER INDEX public.idx_procedures_user RENAME TO idx_postulaciones_aspirante;
ALTER INDEX public.idx_procedures_state RENAME TO idx_postulaciones_estado;

-- ============================================================================
-- 5. documentos (antes documents)
-- ============================================================================

ALTER TABLE public.documents RENAME TO documentos;

ALTER TABLE public.documentos RENAME COLUMN procedure_id TO postulacion_id;
ALTER TABLE public.documentos RENAME COLUMN rute TO ruta;
ALTER TABLE public.documentos RENAME COLUMN validity TO vigencia;
ALTER TABLE public.documentos RENAME COLUMN created_at TO creado_el;
ALTER TABLE public.documentos RENAME COLUMN updated_at TO actualizado_el;

ALTER TABLE public.documentos ADD COLUMN tipo VARCHAR(100);
ALTER TABLE public.documentos
  ADD COLUMN estado public.estado_documento NOT NULL DEFAULT 'PENDIENTE';

ALTER INDEX public.idx_documents_procedure RENAME TO idx_documentos_postulacion;

-- ============================================================================
-- 6. Enums viejos (ya no los usa ninguna columna)
-- ============================================================================

DROP TYPE public.user_role;
DROP TYPE public.user_sex;
DROP TYPE public.procedure_state;

-- ============================================================================
-- 7. actualizado_el automático (reemplaza handle_updated_at)
-- ============================================================================

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.perfiles;
DROP TRIGGER IF EXISTS set_procedures_updated_at ON public.postulaciones;
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documentos;
DROP FUNCTION IF EXISTS public.handle_updated_at();

CREATE FUNCTION public.actualizar_actualizado_el()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.actualizado_el = now();
  RETURN NEW;
END;
$$;

-- Es una función de trigger: nadie la invoca directamente.
REVOKE EXECUTE ON FUNCTION public.actualizar_actualizado_el() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.postulaciones
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

-- RLS: el renombre conserva el ENABLE ROW LEVEL SECURITY de 20261018002315_enable_rls.
-- Las policies por rol llegan en 20261021000500.
