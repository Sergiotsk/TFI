-- ============================================================================
-- Instituciones, períodos de ingreso y los datos de la Postulación
-- (ADR-0006, spec 001-postulacion-plazo-cupos, data-model.md, research R6 y R8)
--
-- - instituciones: tabla mínima. Se inserta FRH porque sin una institución activa
--   nadie se puede registrar (el seed no corre en el remoto).
-- - institucion_id solo en las raíces: periodos_de_ingreso y perfiles
--   (cargas_de_informe llega en 20261021000400). Las postulaciones la derivan del período.
-- - postulaciones: periodo_id, numero legible, vence_el y motivo_revision.
-- ============================================================================

-- ============================================================================
-- 1. instituciones
-- ============================================================================

CREATE TABLE public.instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_el TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.instituciones
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;

-- Dato de referencia: la única institución real hoy.
INSERT INTO public.instituciones (codigo, nombre) VALUES ('FRH', 'UTN FRH');

-- ============================================================================
-- 2. periodos_de_ingreso
-- ============================================================================

CREATE TABLE public.periodos_de_ingreso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE RESTRICT,
  nombre VARCHAR(150) NOT NULL,
  total_cupos INTEGER NOT NULL CHECK (total_cupos >= 0),
  cierra_el TIMESTAMPTZ NOT NULL,
  dias_plazo_pago INTEGER NOT NULL CHECK (dias_plazo_pago > 0),
  monto_matricula_centavos BIGINT NOT NULL CHECK (monto_matricula_centavos > 0),
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT periodos_de_ingreso_nombre_unico UNIQUE (institucion_id, nombre)
);

CREATE INDEX idx_periodos_de_ingreso_institucion ON public.periodos_de_ingreso (institucion_id);

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.periodos_de_ingreso
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

ALTER TABLE public.periodos_de_ingreso ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. perfiles.institucion_id
-- ============================================================================

ALTER TABLE public.perfiles ADD COLUMN institucion_id UUID;

UPDATE public.perfiles
   SET institucion_id = (SELECT id FROM public.instituciones WHERE codigo = 'FRH')
 WHERE institucion_id IS NULL;

ALTER TABLE public.perfiles ALTER COLUMN institucion_id SET NOT NULL;
ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_institucion_id_fkey
  FOREIGN KEY (institucion_id) REFERENCES public.instituciones(id) ON DELETE RESTRICT;

CREATE INDEX idx_perfiles_institucion ON public.perfiles (institucion_id);

-- ============================================================================
-- 4. postulaciones: período, número, plazo y motivo de revisión
-- ============================================================================

CREATE TYPE public.motivo_revision AS ENUM ('FUERA_DE_PLAZO', 'SIN_CUPO');

ALTER TABLE public.postulaciones ADD COLUMN periodo_id UUID;

-- research R8: las postulaciones de prueba que ya existían no tienen período. Si hay alguna,
-- se les crea uno de migración (cerrado y sin cupos) para no vaciar tablas sin acuerdo del equipo.
DO $$
DECLARE
  v_periodo_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.postulaciones WHERE periodo_id IS NULL) THEN
    INSERT INTO public.periodos_de_ingreso
      (institucion_id, nombre, total_cupos, cierra_el, dias_plazo_pago, monto_matricula_centavos)
    VALUES (
      (SELECT id FROM public.instituciones WHERE codigo = 'FRH'),
      'Migración de datos de prueba',
      0,
      now(),
      1,
      1
    )
    RETURNING id INTO v_periodo_id;

    UPDATE public.postulaciones SET periodo_id = v_periodo_id WHERE periodo_id IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.postulaciones ALTER COLUMN periodo_id SET NOT NULL;
ALTER TABLE public.postulaciones
  ADD CONSTRAINT postulaciones_periodo_id_fkey
  FOREIGN KEY (periodo_id) REFERENCES public.periodos_de_ingreso(id) ON DELETE RESTRICT;

-- research R6: número legible para la ventanilla. Al agregarlo, Postgres numera las filas existentes.
ALTER TABLE public.postulaciones
  ADD COLUMN numero BIGINT GENERATED ALWAYS AS IDENTITY;
ALTER TABLE public.postulaciones
  ADD CONSTRAINT postulaciones_numero_unico UNIQUE (numero);

ALTER TABLE public.postulaciones ADD COLUMN vence_el TIMESTAMPTZ;
ALTER TABLE public.postulaciones ADD COLUMN motivo_revision public.motivo_revision;

-- Toda Postulación pendiente tiene vencimiento. vence_el se conserva después para auditoría.
ALTER TABLE public.postulaciones
  ADD CONSTRAINT postulaciones_pendiente_con_vencimiento
  CHECK (estado <> 'PAGO_PENDIENTE' OR vence_el IS NOT NULL);

-- El motivo existe si y solo si la Postulación está en revisión.
ALTER TABLE public.postulaciones
  ADD CONSTRAINT postulaciones_revision_con_motivo
  CHECK ((estado = 'PAGO_EN_REVISION') = (motivo_revision IS NOT NULL));

-- Una Postulación activa por aspirante y período. Si los datos de prueba tuvieran duplicados,
-- la migración falla acá con un mensaje claro en lugar de elegir cuál conservar.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.postulaciones
     WHERE estado <> 'VENCIDO'
     GROUP BY aspirante_id, periodo_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay aspirantes con más de una postulación activa en el mismo período. '
      'Son datos de prueba: resolverlos con el equipo antes de aplicar esta migración (research R8).';
  END IF;
END;
$$;

CREATE UNIQUE INDEX uq_postulaciones_una_activa_por_periodo
  ON public.postulaciones (aspirante_id, periodo_id)
  WHERE estado <> 'VENCIDO';

-- Conteo de ocupación por período (data-model.md, "Ocupación derivada").
CREATE INDEX idx_postulaciones_periodo_estado ON public.postulaciones (periodo_id, estado);
