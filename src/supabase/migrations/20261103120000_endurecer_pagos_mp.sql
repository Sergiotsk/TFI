-- ============================================================================
-- Endurecimiento del circuito Mercado Pago (ADR-0012)
--
-- La primera versión de las migraciones de MP (20261024224548 y
-- 20261024224550) otorgaba INSERT/UPDATE directo sobre pagos y
-- decisiones_de_direccion, y dejaba una RPC SECURITY DEFINER ejecutable por
-- authenticated. Esta migración correctiva converge tanto las bases nuevas
-- (que aplican las migraciones corregidas) como las que ya tenían la versión
-- vulnerable aplicada:
--
--   1. Elimina la RPC confirmar_vacante_por_webhook. El webhook ahora usa
--      acreditar_pago con service_role, que registra el pago real y aplica las
--      mismas reglas que el informe.
--   2. Restaura los privilegios mínimos de pagos y decisiones_de_direccion:
--      authenticated solo lee; escribe únicamente por RPC SECURITY DEFINER.
--   3. Endurece intenciones_de_pago: el aspirante solo puede insertar las
--      columnas de su intención y la política exige que la Postulación, el
--      período, la institución y el monto coincidan. No hay UPDATE directo.
-- ============================================================================

-- Motivo específico para un pago aprobado cuyo monto o moneda no coincide con
-- la intención. No se usa en esta migración, solo queda disponible para la app.
ALTER TYPE public.motivo_no_imputado ADD VALUE IF NOT EXISTS 'MONTO_INCORRECTO';

-- 1) La RPC vieja ya no se usa y no debe quedar expuesta.
DROP FUNCTION IF EXISTS public.confirmar_vacante_por_webhook(UUID);

-- 2) pagos y decisiones_de_direccion: solo lectura para authenticated.
--    Las escrituras pasan por acreditar_pago / decidir_pago_excepcional.
REVOKE ALL ON public.pagos, public.decisiones_de_direccion FROM anon, authenticated;
GRANT SELECT ON public.pagos, public.decisiones_de_direccion TO authenticated;
GRANT ALL ON public.pagos, public.decisiones_de_direccion TO service_role;

-- 3) intenciones_de_pago: SELECT completo, INSERT solo de las columnas que
--    arma la aplicación. estado, payment_id_mp, webhook_event_id y pagado_el
--    quedan fuera del GRANT: los maneja el webhook con service_role.
REVOKE ALL ON public.intenciones_de_pago FROM anon, authenticated;
GRANT SELECT ON public.intenciones_de_pago TO authenticated;
GRANT INSERT (
  postulacion_id,
  periodo_id,
  institucion_id,
  monto_centavos,
  external_id,
  preference_id,
  init_point,
  sandbox_init_point,
  expira_el
) ON public.intenciones_de_pago TO authenticated;
GRANT ALL ON public.intenciones_de_pago TO service_role;

-- La intención solo puede crearse para una Postulación propia, en pago, del
-- período abierto de la institución y por el monto exacto de la matrícula.
-- Esto evita que un aspirante invente una intención con otro período, otra
-- institución o un monto distinto para intentar acreditar de menos.
DROP POLICY IF EXISTS intenciones_alta ON public.intenciones_de_pago;
CREATE POLICY intenciones_alta ON public.intenciones_de_pago
  FOR INSERT TO authenticated
  WITH CHECK (
    estado = 'PENDIENTE'
    AND payment_id_mp IS NULL
    AND webhook_event_id IS NULL
    AND pagado_el IS NULL
    AND EXISTS (
      SELECT 1
        FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
       WHERE po.id = postulacion_id
         AND po.aspirante_id = auth.uid()
         AND po.estado = 'PAGO_PENDIENTE'
         AND p.id = periodo_id
         AND p.institucion_id = institucion_id
         AND p.monto_matricula_centavos = monto_centavos
         AND now() <= p.cierra_el
    )
  );
