-- ============================================================================
-- Acreditación de pagos informados (US1, contracts/rpc.md)
--
-- El dominio decide (evaluarPago) y la base garantiza: la función recibe la
-- decisión ya tomada y, en una sola transacción, verifica que sus
-- precondiciones sigan valiendo antes de aplicarla.
--
--   1. Inserta el pago con ON CONFLICT DO NOTHING: si la referencia ya existía
--      devuelve DUPLICADO y no hace nada más. Va primero para que dos pedidos
--      con la misma referencia en paralelo den REGISTRADO y DUPLICADO (el
--      índice único hace esperar al segundo).
--   2. CONFIRMAR o REVISION: lock del período y después de la Postulación, en
--      el mismo orden que confirmar_vacante_manual y prorrogar_plazo_de_pago.
--   3. Precondiciones: el estado persistido es el esperado y, si CONFIRMAR,
--      queda cupo. Si alguna falla se deshace también el pago insertado (el
--      bloque EXCEPTION abre un savepoint) y devuelve CONFLICTO: el caso de uso
--      relee y vuelve a decidir.
--
-- Tesorería la llama con su sesión (el rol se verifica adentro, segunda
-- barrera) y queda limitada a su institución. service_role la puede llamar
-- para el aviso de Pagos360, que no tiene sesión.
-- ============================================================================

CREATE FUNCTION public.acreditar_pago(
  p_proveedor public.proveedor_pago,
  p_referencia_externa TEXT,
  p_monto_centavos BIGINT,
  p_pagado_el TIMESTAMPTZ,
  p_decision TEXT,
  p_postulacion_id UUID DEFAULT NULL,
  p_estado_esperado public.estado_postulacion DEFAULT NULL,
  p_motivo_revision public.motivo_revision DEFAULT NULL,
  p_motivo_no_imputado public.motivo_no_imputado DEFAULT NULL,
  p_dni_informado VARCHAR(20) DEFAULT NULL,
  p_numero_informado BIGINT DEFAULT NULL,
  p_carga_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_es_servicio BOOLEAN := auth.role() = 'service_role';
  v_institucion UUID;
  v_pago public.pagos%ROWTYPE;
  v_post public.postulaciones%ROWTYPE;
  v_periodo public.periodos_de_ingreso%ROWTYPE;
  v_ocupados INTEGER;
BEGIN
  IF NOT v_es_servicio AND public.rol_actual() IS DISTINCT FROM 'TESORERIA' THEN
    RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
  END IF;

  IF p_decision NOT IN ('CONFIRMAR', 'REVISION', 'NO_IMPUTAR') THEN
    RAISE EXCEPTION 'Decisión de acreditación desconocida: %', p_decision;
  END IF;

  IF p_decision <> 'NO_IMPUTAR' AND (p_postulacion_id IS NULL OR p_estado_esperado IS NULL) THEN
    RAISE EXCEPTION 'CONFIRMAR y REVISION requieren la Postulación y el estado esperado';
  END IF;

  -- Alcance por institución: Tesorería solo imputa a Postulaciones y cargas propias.
  IF NOT v_es_servicio THEN
    v_institucion := public.institucion_actual();

    IF p_carga_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.cargas_de_informe
       WHERE id = p_carga_id AND institucion_id = v_institucion
    ) THEN
      RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
    END IF;

    IF p_postulacion_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
        FROM public.postulaciones po
        JOIN public.periodos_de_ingreso pe ON pe.id = po.periodo_id
       WHERE po.id = p_postulacion_id AND pe.institucion_id = v_institucion
    ) THEN
      RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.pagos (
      proveedor,
      referencia_externa,
      monto_centavos,
      pagado_el,
      estado,
      motivo_revision,
      motivo_no_imputado,
      postulacion_id,
      carga_id,
      dni_informado,
      numero_informado,
      registrado_por
    )
    VALUES (
      p_proveedor,
      p_referencia_externa,
      p_monto_centavos,
      p_pagado_el,
      CASE p_decision
        WHEN 'CONFIRMAR' THEN 'ACREDITADO'
        WHEN 'REVISION' THEN 'A_DECIDIR'
        ELSE 'NO_IMPUTADO'
      END::public.estado_pago,
      CASE WHEN p_decision = 'REVISION' THEN p_motivo_revision END,
      CASE WHEN p_decision = 'NO_IMPUTAR' THEN p_motivo_no_imputado END,
      p_postulacion_id,
      p_carga_id,
      p_dni_informado,
      p_numero_informado,
      auth.uid()
    )
    ON CONFLICT (proveedor, referencia_externa) DO NOTHING
    RETURNING * INTO v_pago;

    IF v_pago.id IS NULL THEN
      SELECT * INTO v_pago
        FROM public.pagos
       WHERE proveedor = p_proveedor AND referencia_externa = p_referencia_externa;

      RETURN jsonb_build_object('resultado', 'DUPLICADO', 'pago', to_jsonb(v_pago));
    END IF;

    IF p_decision = 'NO_IMPUTAR' THEN
      RETURN jsonb_build_object('resultado', 'REGISTRADO', 'pago', to_jsonb(v_pago));
    END IF;

    SELECT * INTO v_periodo
      FROM public.periodos_de_ingreso
     WHERE id = (SELECT periodo_id FROM public.postulaciones WHERE id = p_postulacion_id)
     FOR UPDATE;

    SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id FOR UPDATE;

    IF NOT FOUND OR v_post.estado <> p_estado_esperado THEN
      RAISE EXCEPTION USING ERRCODE = 'TF409', MESSAGE = 'La Postulación ya no está en el estado esperado';
    END IF;

    IF p_decision = 'CONFIRMAR' THEN
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
        RAISE EXCEPTION USING ERRCODE = 'TF409', MESSAGE = 'El período ya no tiene cupo';
      END IF;

      UPDATE public.postulaciones
         SET estado = 'VACANTE_CONFIRMADA',
             motivo_revision = NULL
       WHERE id = p_postulacion_id;
    ELSE
      UPDATE public.postulaciones
         SET estado = 'PAGO_EN_REVISION',
             motivo_revision = p_motivo_revision
       WHERE id = p_postulacion_id;
    END IF;

    RETURN jsonb_build_object('resultado', 'REGISTRADO', 'pago', to_jsonb(v_pago));
  EXCEPTION
    WHEN SQLSTATE 'TF409' THEN
      RETURN jsonb_build_object('resultado', 'CONFLICTO');
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acreditar_pago(
  public.proveedor_pago, TEXT, BIGINT, TIMESTAMPTZ, TEXT, UUID, public.estado_postulacion,
  public.motivo_revision, public.motivo_no_imputado, VARCHAR, BIGINT, UUID
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.acreditar_pago(
  public.proveedor_pago, TEXT, BIGINT, TIMESTAMPTZ, TEXT, UUID, public.estado_postulacion,
  public.motivo_revision, public.motivo_no_imputado, VARCHAR, BIGINT, UUID
) TO authenticated, service_role;
