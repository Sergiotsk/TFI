-- ============================================================================
-- Permisos y Row Level Security por rol (constitución Principio VII, ADR-0004,
-- spec FR-008, contracts/rpc.md)
--
-- RLS es la SEGUNDA barrera: la primera es la autorización en los casos de uso.
-- El adaptador usa el JWT del usuario, así que estas policies se aplican de verdad.
--
-- - anon no tiene acceso a ninguna tabla.
-- - pagos y decisiones_de_direccion no se escriben directo: solo por las RPC
--   (20261021000600 y 20261021000700), que corren como SECURITY DEFINER.
-- - postulaciones: el aspirante solo puede iniciar el pago y persistir el vencimiento.
--   Como RLS no ve el estado anterior, un trigger guardián verifica la transición.
-- ============================================================================

-- ============================================================================
-- 1. Helpers para las policies (evitan la recursión de RLS sobre perfiles)
-- ============================================================================

CREATE FUNCTION public.rol_actual()
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$;

CREATE FUNCTION public.institucion_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT institucion_id FROM public.perfiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.rol_actual() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institucion_actual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rol_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.institucion_actual() TO authenticated;

-- ============================================================================
-- 2. Privilegios de tabla (explícitos: la base local no tiene los toggles del remoto)
-- ============================================================================

REVOKE ALL ON
  public.instituciones, public.perfiles, public.periodos_de_ingreso, public.postulaciones,
  public.documentos, public.cargas_de_informe, public.pagos, public.decisiones_de_direccion
FROM anon, authenticated;

GRANT ALL ON
  public.instituciones, public.perfiles, public.periodos_de_ingreso, public.postulaciones,
  public.documentos, public.cargas_de_informe, public.pagos, public.decisiones_de_direccion
TO service_role;

GRANT SELECT ON
  public.instituciones, public.perfiles, public.periodos_de_ingreso, public.postulaciones,
  public.documentos, public.cargas_de_informe, public.pagos, public.decisiones_de_direccion
TO authenticated;

GRANT INSERT, UPDATE ON public.periodos_de_ingreso TO authenticated;
GRANT INSERT (aspirante_id, periodo_id) ON public.postulaciones TO authenticated;
GRANT UPDATE (estado, vence_el) ON public.postulaciones TO authenticated;
GRANT INSERT (postulacion_id, ruta, vigencia, tipo) ON public.documentos TO authenticated;
GRANT UPDATE (estado) ON public.documentos TO authenticated;
GRANT INSERT (institucion_id, cargada_por, nombre_archivo) ON public.cargas_de_informe TO authenticated;
GRANT UPDATE (acreditados, a_decidir, no_imputados, duplicados) ON public.cargas_de_informe TO authenticated;
-- pagos y decisiones_de_direccion: sin INSERT ni UPDATE para authenticated.

-- ============================================================================
-- 3. Policies
-- ============================================================================

-- instituciones: lectura para cualquier usuario autenticado.
CREATE POLICY instituciones_lectura ON public.instituciones
  FOR SELECT TO authenticated
  USING (true);

-- perfiles: el propio; el personal ve los de su institución.
CREATE POLICY perfiles_lectura ON public.perfiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
      AND institucion_id = public.institucion_actual()
    )
  );

-- periodos_de_ingreso: lectura dentro de la institución; escritura de Secretaría y Dirección.
CREATE POLICY periodos_lectura ON public.periodos_de_ingreso
  FOR SELECT TO authenticated
  USING (institucion_id = public.institucion_actual());

CREATE POLICY periodos_alta ON public.periodos_de_ingreso
  FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
    AND institucion_id = public.institucion_actual()
  );

CREATE POLICY periodos_modificacion ON public.periodos_de_ingreso
  FOR UPDATE TO authenticated
  USING (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
    AND institucion_id = public.institucion_actual()
  )
  WITH CHECK (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
    AND institucion_id = public.institucion_actual()
  );

-- postulaciones: las propias; el personal, las de los períodos de su institución.
CREATE POLICY postulaciones_lectura ON public.postulaciones
  FOR SELECT TO authenticated
  USING (
    aspirante_id = auth.uid()
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
      AND EXISTS (
        SELECT 1 FROM public.periodos_de_ingreso p
         WHERE p.id = periodo_id AND p.institucion_id = public.institucion_actual()
      )
    )
  );

-- El aspirante crea su propia Postulación, en PREINSCRIPTO y en un período de su institución.
CREATE POLICY postulaciones_alta ON public.postulaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_actual() = 'ASPIRANTE'
    AND aspirante_id = auth.uid()
    AND estado = 'PREINSCRIPTO'
    AND vence_el IS NULL
    AND EXISTS (
      SELECT 1 FROM public.periodos_de_ingreso p
       WHERE p.id = periodo_id AND p.institucion_id = public.institucion_actual()
    )
  );

-- El aspirante modifica solo las propias. Qué transición puede hacer lo verifica el trigger guardián.
-- Los cambios de estado de documentación (Secretaría) son de otra feature.
CREATE POLICY postulaciones_modificacion ON public.postulaciones
  FOR UPDATE TO authenticated
  USING (public.rol_actual() = 'ASPIRANTE' AND aspirante_id = auth.uid())
  WITH CHECK (aspirante_id = auth.uid());

-- documentos: los propios; Secretaría y Dirección, los de su institución. Tesorería, nada.
CREATE POLICY documentos_lectura ON public.documentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
      AND EXISTS (
        SELECT 1
          FROM public.postulaciones po
          JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
         WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
      )
    )
  );

CREATE POLICY documentos_alta ON public.documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_actual() = 'ASPIRANTE'
    AND EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
  );

CREATE POLICY documentos_revision ON public.documentos
  FOR UPDATE TO authenticated
  USING (
    public.rol_actual() = 'SECRETARIA'
    AND EXISTS (
      SELECT 1
        FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
       WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
    )
  )
  WITH CHECK (public.rol_actual() = 'SECRETARIA');

-- cargas_de_informe: las lee el personal de la institución; las escribe Tesorería.
CREATE POLICY cargas_lectura ON public.cargas_de_informe
  FOR SELECT TO authenticated
  USING (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
    AND institucion_id = public.institucion_actual()
  );

CREATE POLICY cargas_alta ON public.cargas_de_informe
  FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_actual() = 'TESORERIA'
    AND institucion_id = public.institucion_actual()
    AND cargada_por = auth.uid()
  );

CREATE POLICY cargas_cierre ON public.cargas_de_informe
  FOR UPDATE TO authenticated
  USING (public.rol_actual() = 'TESORERIA' AND institucion_id = public.institucion_actual())
  WITH CHECK (public.rol_actual() = 'TESORERIA' AND institucion_id = public.institucion_actual());

-- pagos: el aspirante, los propios; el personal, los de su institución (por la Postulación o por la carga).
CREATE POLICY pagos_lectura ON public.pagos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id AND po.aspirante_id = auth.uid()
    )
    OR (
      public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
      AND (
        EXISTS (
          SELECT 1
            FROM public.postulaciones po
            JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
           WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
        )
        OR EXISTS (
          SELECT 1 FROM public.cargas_de_informe c
           WHERE c.id = carga_id AND c.institucion_id = public.institucion_actual()
        )
      )
    )
  );

-- decisiones_de_direccion: el personal, sobre los pagos que puede ver.
CREATE POLICY decisiones_lectura ON public.decisiones_de_direccion
  FOR SELECT TO authenticated
  USING (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
    AND EXISTS (SELECT 1 FROM public.pagos pg WHERE pg.id = pago_id)
  );

-- ============================================================================
-- 4. Guardián de las transiciones que el aspirante hace directo
--
-- RLS solo ve la fila nueva, no la anterior: sin esto, un aspirante podría pasar de
-- PAGO_PENDIENTE a PAGO_PENDIENTE con un vence_el más lejano (estirarse el plazo) o
-- confirmarse una vacante. El guardián GARANTIZA que la escritura directa sea una de las dos
-- transiciones permitidas; la DECISIÓN de hacerla sigue en el dominio (IniciarPago y la
-- persistencia perezosa de VENCIDO). Las RPC corren como SECURITY DEFINER (otro usuario de
-- base), así que el guardián no las afecta.
-- ============================================================================

CREATE FUNCTION public.proteger_transiciones_de_postulacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_periodo public.periodos_de_ingreso%ROWTYPE;
  -- Margen para la diferencia de reloj entre la app y la base.
  v_tolerancia CONSTANT INTERVAL := INTERVAL '5 minutes';
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF NEW.estado = 'PAGO_PENDIENTE' AND OLD.estado IN ('PREINSCRIPTO', 'VENCIDO') THEN
    -- iniciarPago: vence_el no puede pasarse del plazo del período ni de su cierre.
    SELECT * INTO v_periodo FROM public.periodos_de_ingreso WHERE id = NEW.periodo_id;

    IF NEW.vence_el IS NULL
       OR NEW.vence_el <= now()
       OR NEW.vence_el > LEAST(now() + make_interval(days => v_periodo.dias_plazo_pago), v_periodo.cierra_el)
                         + v_tolerancia THEN
      RAISE EXCEPTION 'Vencimiento inválido para iniciar el pago';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.estado = 'VENCIDO' AND OLD.estado = 'PAGO_PENDIENTE' THEN
    -- Persistencia perezosa: solo si de verdad venció, y sin tocar el vencimiento.
    IF OLD.vence_el >= now() OR NEW.vence_el IS DISTINCT FROM OLD.vence_el THEN
      RAISE EXCEPTION 'La postulación todavía no venció';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Transición de % a % no permitida por escritura directa', OLD.estado, NEW.estado;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proteger_transiciones_de_postulacion() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER proteger_transiciones_de_postulacion
  BEFORE UPDATE ON public.postulaciones
  FOR EACH ROW EXECUTE FUNCTION public.proteger_transiciones_de_postulacion();
