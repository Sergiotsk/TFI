-- ============================================================================
-- Pagos, cargas de informe y decisiones de Dirección
-- (ADR-0005, spec FR-006 y FR-012 a FR-014, data-model.md)
--
-- - Un pago nace solo cuando llega una acreditación (fila del informe o aviso de Pagos360).
-- - UNIQUE (proveedor, referencia_externa): la idempotencia.
-- - Nadie escribe estas tablas directamente: solo las RPC de 20261021000600 y 20261021000700.
-- ============================================================================

CREATE TYPE public.estado_pago AS ENUM ('ACREDITADO', 'NO_IMPUTADO', 'A_DECIDIR', 'DEVUELTO');

CREATE TYPE public.motivo_no_imputado AS ENUM (
  'REFERENCIA_DESCONOCIDA',
  'AMBIGUA',
  'DNI_NO_COINCIDE',
  'MONTO_INSUFICIENTE',
  'YA_TIENE_PAGO',
  'SIN_PAGO_INICIADO'
);

CREATE TYPE public.proveedor_pago AS ENUM ('INFORME_SYSADMIN', 'PAGOS360');

CREATE TYPE public.decision_direccion AS ENUM ('ACEPTAR', 'RECHAZAR');

-- ============================================================================
-- 1. cargas_de_informe
-- ============================================================================

CREATE TABLE public.cargas_de_informe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE RESTRICT,
  cargada_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  cargada_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre_archivo TEXT NOT NULL,
  acreditados INTEGER NOT NULL DEFAULT 0 CHECK (acreditados >= 0),
  a_decidir INTEGER NOT NULL DEFAULT 0 CHECK (a_decidir >= 0),
  no_imputados INTEGER NOT NULL DEFAULT 0 CHECK (no_imputados >= 0),
  duplicados INTEGER NOT NULL DEFAULT 0 CHECK (duplicados >= 0)
);

CREATE INDEX idx_cargas_de_informe_institucion ON public.cargas_de_informe (institucion_id, cargada_el DESC);

ALTER TABLE public.cargas_de_informe ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. pagos
-- ============================================================================

CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor public.proveedor_pago NOT NULL,
  referencia_externa TEXT NOT NULL,
  monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
  pagado_el TIMESTAMPTZ NOT NULL,
  registrado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado public.estado_pago NOT NULL,
  motivo_revision public.motivo_revision,
  motivo_no_imputado public.motivo_no_imputado,
  postulacion_id UUID REFERENCES public.postulaciones(id) ON DELETE RESTRICT,
  carga_id UUID REFERENCES public.cargas_de_informe(id) ON DELETE RESTRICT,
  dni_informado VARCHAR(20),  -- dato personal: retención según TODO(RETENCION_DATOS), ADR-0006
  numero_informado BIGINT,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_el TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pagos_referencia_unica UNIQUE (proveedor, referencia_externa),
  -- Acreditado, a decidir y devuelto siempre están imputados a una Postulación.
  CONSTRAINT pagos_imputado_si_no_es_no_imputado
    CHECK (estado = 'NO_IMPUTADO' OR postulacion_id IS NOT NULL),
  CONSTRAINT pagos_a_decidir_con_motivo
    CHECK (estado <> 'A_DECIDIR' OR motivo_revision IS NOT NULL),
  CONSTRAINT pagos_no_imputado_con_motivo
    CHECK ((estado = 'NO_IMPUTADO') = (motivo_no_imputado IS NOT NULL))
);

CREATE INDEX idx_pagos_estado ON public.pagos (estado);
CREATE INDEX idx_pagos_postulacion ON public.pagos (postulacion_id);
CREATE INDEX idx_pagos_carga ON public.pagos (carga_id);

CREATE TRIGGER actualizar_actualizado_el
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. decisiones_de_direccion (una por pago, inmutables)
-- ============================================================================

CREATE TABLE public.decisiones_de_direccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL UNIQUE REFERENCES public.pagos(id) ON DELETE RESTRICT,
  decision public.decision_direccion NOT NULL,
  decidida_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  decidida_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  comentario TEXT
);

ALTER TABLE public.decisiones_de_direccion ENABLE ROW LEVEL SECURITY;
