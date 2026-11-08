-- ============================================================================
-- Acciones manuales del personal sobre Postulaciones
--
-- El personal (Secretaría, Tesorería y Dirección) puede ayudar a un postulante
-- con dos acciones explícitas, nunca editando el estado a mano:
--
--   1. confirmar_vacante_manual: acredita un pago verificado fuera del sistema.
--      Toma el lock del período y cuenta las vacantes ocupadas: dos
--      confirmaciones simultáneas por el último cupo no pueden pasar las dos.
--   2. prorrogar_plazo_de_pago: extiende el vencimiento o reactiva una VENCIDO.
--      El nuevo vencimiento no puede pasar del cierre del período.
--
-- Las dos verifican el rol adentro (segunda barrera) y el alcance por
-- institución. Son SECURITY DEFINER: el trigger de transiciones deja pasar la
-- escritura porque current_user deja de ser 'authenticated'.
-- ============================================================================

CREATE FUNCTION public.confirmar_vacante_manual(p_postulacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rol public.rol_usuario;
  v_post public.postulaciones%ROWTYPE;
  v_periodo public.periodos_de_ingreso%ROWTYPE;
  v_ocupados INTEGER;
BEGIN
  v_rol := public.rol_actual();
  IF v_rol IS NULL OR v_rol NOT IN ('SECRETARIA', 'TESORERIA', 'DIRECCION') THEN
    RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
  END IF;

  SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'NO_ENCONTRADA');
  END IF;

  -- Lock del período, en el mismo orden que prorrogar_plazo_de_pago.
  SELECT * INTO v_periodo
    FROM public.periodos_de_ingreso
   WHERE id = v_post.periodo_id
     AND institucion_id = public.institucion_actual()
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

  -- El pago manual queda registrado con el monto de la matrícula del período.
  -- La referencia es idempotente por Postulación.
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
    'MANUAL',
    'manual:' || p_postulacion_id::text,
    v_periodo.monto_matricula_centavos,
    now(),
    'ACREDITADO',
    p_postulacion_id,
    auth.uid()
  )
  ON CONFLICT (proveedor, referencia_externa) DO NOTHING;

  UPDATE public.postulaciones
     SET estado = 'VACANTE_CONFIRMADA',
         motivo_revision = NULL
   WHERE id = p_postulacion_id;

  RETURN jsonb_build_object('resultado', 'OK');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirmar_vacante_manual(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_vacante_manual(UUID) TO authenticated;

CREATE FUNCTION public.prorrogar_plazo_de_pago(
  p_postulacion_id UUID,
  p_vence_el TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rol public.rol_usuario;
  v_post public.postulaciones%ROWTYPE;
  v_periodo public.periodos_de_ingreso%ROWTYPE;
BEGIN
  v_rol := public.rol_actual();
  IF v_rol IS NULL OR v_rol NOT IN ('SECRETARIA', 'TESORERIA', 'DIRECCION') THEN
    RETURN jsonb_build_object('resultado', 'NO_AUTORIZADO');
  END IF;

  SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'NO_ENCONTRADA');
  END IF;

  -- Lock del período, en el mismo orden que confirmar_vacante_manual.
  SELECT * INTO v_periodo
    FROM public.periodos_de_ingreso
   WHERE id = v_post.periodo_id
     AND institucion_id = public.institucion_actual()
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'NO_ENCONTRADA');
  END IF;

  SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id FOR UPDATE;

  IF v_post.estado NOT IN ('PAGO_PENDIENTE', 'VENCIDO') THEN
    RETURN jsonb_build_object('resultado', 'CONFLICTO');
  END IF;

  IF p_vence_el <= now() OR p_vence_el > v_periodo.cierra_el THEN
    RETURN jsonb_build_object('resultado', 'PERIODO_CERRADO');
  END IF;

  UPDATE public.postulaciones
     SET estado = 'PAGO_PENDIENTE',
         vence_el = p_vence_el,
         motivo_revision = NULL
   WHERE id = p_postulacion_id;

  RETURN jsonb_build_object('resultado', 'OK');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prorrogar_plazo_de_pago(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prorrogar_plazo_de_pago(UUID, TIMESTAMPTZ) TO authenticated;
