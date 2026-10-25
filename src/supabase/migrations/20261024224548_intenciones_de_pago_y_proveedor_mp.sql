-- ============================================================================
-- Integración MercadoPago (ADR-0011)
--
-- - Agrega MERCADOPAGO al enum proveedor_pago (mantiene MANUAL, INFORME_SYSADMIN, PAGOS360)
-- - Crea public.intenciones_de_pago para idempotencia de webhook/redirección
-- - Ambos caminos (manual + pasarela) deben terminar en public.pagos acreditados
-- ============================================================================

-- 1) Agregar proveedor MERCADOPAGO
ALTER TYPE public.proveedor_pago ADD VALUE IF NOT EXISTS 'MERCADOPAGO';

-- 2) Intenciones de pago
CREATE TABLE IF NOT EXISTS public.intenciones_de_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postulacion_id UUID NOT NULL REFERENCES public.postulaciones(id) ON DELETE RESTRICT,
  periodo_id UUID NOT NULL REFERENCES public.periodos_de_ingreso(id) ON DELETE RESTRICT,
  institucion_id UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE RESTRICT,
  monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
  external_id TEXT NOT NULL UNIQUE,
  preference_id TEXT,
  init_point TEXT,
  sandbox_init_point TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','PROCESANDO','COMPLETADA','EXPIRADA','CANCELADA')),
  payment_id_mp TEXT,
  webhook_event_id TEXT,
  pagado_el TIMESTAMPTZ,
  creado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_el TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_el TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_intenciones_postulacion ON public.intenciones_de_pago (postulacion_id);
CREATE INDEX IF NOT EXISTS idx_intenciones_periodo ON public.intenciones_de_pago (periodo_id);
CREATE INDEX IF NOT EXISTS idx_intenciones_estado ON public.intenciones_de_pago (estado);
CREATE INDEX IF NOT EXISTS idx_intenciones_external_id ON public.intenciones_de_pago (external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intenciones_payment_mp ON public.intenciones_de_pago (payment_id_mp) WHERE payment_id_mp IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_intenciones_webhook_event ON public.intenciones_de_pago (webhook_event_id) WHERE webhook_event_id IS NOT NULL;

CREATE TRIGGER actualizar_actualizado_el_intenciones
  BEFORE UPDATE ON public.intenciones_de_pago
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_actualizado_el();

ALTER TABLE public.intenciones_de_pago ENABLE ROW LEVEL SECURITY;

-- Aspirante ve sus propias intenciones
DROP POLICY IF EXISTS intenciones_alta ON public.intenciones_de_pago;
CREATE POLICY intenciones_alta ON public.intenciones_de_pago
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS intenciones_lectura ON public.intenciones_de_pago;
CREATE POLICY intenciones_lectura ON public.intenciones_de_pago
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
      AND EXISTS (
        SELECT 1 FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
         WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
      )
    )
  );

DROP POLICY IF EXISTS intenciones_actualizacion ON public.intenciones_de_pago;
CREATE POLICY intenciones_actualizacion ON public.intenciones_de_pago
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
      AND EXISTS (
        SELECT 1 FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
         WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
      AND EXISTS (
        SELECT 1 FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
         WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
      )
    )
  );

-- 3) Relacionar pago con intención (opcional pero trazable)
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS intencion_id UUID REFERENCES public.intenciones_de_pago(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pagos_intencion ON public.pagos (intencion_id);

-- Grants mínimos para el rol authenticated
GRANT SELECT, INSERT, UPDATE ON public.intenciones_de_pago TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pagos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.decisiones_de_direccion TO authenticated;
