-- ============================================================================
-- Confirmación de vacante por webhook de pasarela (sistema)
--
-- Permite acreditar pago vía MercadoPago usando service role (bypass RLS).
-- No verifica rol (es llamado por el sistema). Sí verifica cupo y estado
-- igual que el flujo manual.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.confirmar_vacante_por_webhook(p_postulacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_post public.postulaciones%ROWTYPE;
  v_periodo public.periodos_de_ingreso%ROWTYPE;
  v_ocupados INTEGER;
BEGIN
  SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'NO_ENCONTRADA');
  END IF;

  SELECT * INTO v_periodo
    FROM public.periodos_de_ingreso
   WHERE id = v_post.periodo_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'NO_ENCONTRADA');
  END IF;

  SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id FOR UPDATE;

  IF v_post.estado NOT IN ('PAGO_PENDIENTE', 'VENCIDO') THEN
    RETURN jsonb_build_object('resultado', 'CONFLICTO');
  END IF;

  SELECT count(*) INTO v_ocupados
    FROM public.postulaciones
   WHERE periodo_id = v_post.periodo_id
     AND estado IN (
       'VACANTE_CONFIRMADA',
       'ESPERANDO_DOCUMENTACION',
       'DOCUMENTACION_EN_REVISION',
       'OBSERVADO',
       'DOCUMENTACION_VALIDADA',
       'CONFIRMADO_PARA_EXPORTAR'
     );

  IF v_ocupados >= v_periodo.total_cupos THEN
    RETURN jsonb_build_object('resultado', 'SIN_CUPO');
  END IF;

  INSERT INTO public.pagos (
    proveedor,
    referencia_externa,
    monto_centavos,
    pagado_el,
    estado,
    postulacion_id,
    registrado_por
  )
  VALUES (
    'MERCADOPAGO',
    'mp:webhook:' || p_postulacion_id::text,
    v_periodo.monto_matricula_centavos,
    now(),
    'ACREDITADO',
    p_postulacion_id,
    NULL
  )
  ON CONFLICT (proveedor, referencia_externa) DO NOTHING;

  UPDATE public.postulaciones
     SET estado = 'VACANTE_CONFIRMADA',
         motivo_revision = NULL
   WHERE id = p_postulacion_id;

  RETURN jsonb_build_object('resultado', 'OK');
END;
$$;

-- Solo el webhook (service_role): no verifica rol, así que un usuario logueado no la puede llamar.
REVOKE EXECUTE ON FUNCTION public.confirmar_vacante_por_webhook(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_vacante_por_webhook(UUID) TO service_role;
