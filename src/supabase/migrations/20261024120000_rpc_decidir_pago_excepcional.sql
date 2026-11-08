-- ============================================================================
-- Decisión de Dirección sobre un pago excepcional (US5, contracts/rpc.md)
--
-- Un pago queda A_DECIDIR cuando llegó fuera de plazo o sin cupo, y su
-- Postulación en PAGO_EN_REVISION. Dirección lo resuelve, en una sola
-- transacción:
--
--   1. Lock del pago (FOR UPDATE) y verifica que siga A_DECIDIR: si otra
--      decisión llegó antes devuelve CONFLICTO (cubre la doble decisión).
--   2. Lock del período y después de la Postulación, en el mismo orden que
--      acreditar_pago, y verifica que siga PAGO_EN_REVISION.
--   3. ACEPTAR: Postulación VACANTE_CONFIRMADA y pago ACREDITADO, SIN comparar
--      contra el total (la decisión de Dirección autoriza el exceso, FR-005).
--      RECHAZAR: Postulación VENCIDO y pago DEVUELTO (Tesorería reintegra).
--      El pago conserva su motivo para auditoría.
--   4. Registra la decisión en decisiones_de_direccion con decidida_por de la
--      sesión. Cada vacante en exceso queda trazada (SC-007).
--
-- Solo DIRECCION (el rol se verifica adentro, segunda barrera) y sobre pagos
-- de su institución.
-- ============================================================================

CREATE FUNCTION public.decidir_pago_excepcional(
  p_pago_id UUID,
  p_decision public.decision_direccion,
  p_comentario TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pago public.pagos%ROWTYPE;
  v_post public.postulaciones%ROWTYPE;
BEGIN
  IF public.rol_actual() IS DISTINCT FROM 'DIRECCION' THEN
    RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
  END IF;

  SELECT * INTO v_pago FROM public.pagos WHERE id = p_pago_id FOR UPDATE;

  IF NOT FOUND OR v_pago.estado <> 'A_DECIDIR' THEN
    RETURN jsonb_build_object('resultado', 'CONFLICTO');
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.postulaciones po
      JOIN public.periodos_de_ingreso pe ON pe.id = po.periodo_id
     WHERE po.id = v_pago.postulacion_id AND pe.institucion_id = public.institucion_actual()
  ) THEN
    RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
  END IF;

  PERFORM 1
     FROM public.periodos_de_ingreso
    WHERE id = (SELECT periodo_id FROM public.postulaciones WHERE id = v_pago.postulacion_id)
    FOR UPDATE;

  SELECT * INTO v_post FROM public.postulaciones WHERE id = v_pago.postulacion_id FOR UPDATE;

  IF v_post.estado <> 'PAGO_EN_REVISION' THEN
    RETURN jsonb_build_object('resultado', 'CONFLICTO');
  END IF;

  UPDATE public.postulaciones
     SET estado = CASE p_decision
                    WHEN 'ACEPTAR' THEN 'VACANTE_CONFIRMADA'
                    ELSE 'VENCIDO'
                  END::public.estado_postulacion,
         motivo_revision = NULL
   WHERE id = v_post.id;

  UPDATE public.pagos
     SET estado = CASE p_decision
                    WHEN 'ACEPTAR' THEN 'ACREDITADO'
                    ELSE 'DEVUELTO'
                  END::public.estado_pago
   WHERE id = v_pago.id
  RETURNING * INTO v_pago;

  INSERT INTO public.decisiones_de_direccion (pago_id, decision, decidida_por, comentario)
  VALUES (v_pago.id, p_decision, auth.uid(), NULLIF(btrim(p_comentario), ''));

  RETURN jsonb_build_object('resultado', 'REGISTRADA', 'pago', to_jsonb(v_pago));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decidir_pago_excepcional(UUID, public.decision_direccion, TEXT)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.decidir_pago_excepcional(UUID, public.decision_direccion, TEXT)
  TO authenticated;
