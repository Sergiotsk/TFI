-- ============================================================================
-- Circuito de documentación
--
-- - public.documentos gana los metadatos del archivo y de la revisión.
-- - Secretaría y Dirección pueden cargar, revisar, corregir y borrar documentos
--   de cualquier Postulación de su institución. El aspirante solo los propios.
-- - Las transiciones de la Postulación pasan por una RPC SECURITY DEFINER: el
--   guardián de 20261021000500 solo permite las escrituras directas de pago.
-- - El bucket `documentos` es privado; las policies de Storage validan la ruta
--   `institucion/postulacion/archivo`.
-- ============================================================================

-- ============================================================================
-- 1. Metadatos del documento
-- ============================================================================

ALTER TABLE public.documentos ADD COLUMN nombre_archivo TEXT;
ALTER TABLE public.documentos ADD COLUMN mime_type TEXT NOT NULL DEFAULT 'application/octet-stream';
ALTER TABLE public.documentos ADD COLUMN tamanio_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.documentos ADD COLUMN subido_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL;
ALTER TABLE public.documentos ADD COLUMN revisado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL;
ALTER TABLE public.documentos ADD COLUMN revisado_el TIMESTAMPTZ;
ALTER TABLE public.documentos ADD COLUMN observaciones TEXT;

-- Filas viejas: el nombre visible sale del último segmento de la ruta.
UPDATE public.documentos
   SET nombre_archivo = COALESCE(
     NULLIF(regexp_replace(ruta, '^.*/', ''), ''),
     'documento'
   )
 WHERE nombre_archivo IS NULL;

ALTER TABLE public.documentos ALTER COLUMN nombre_archivo SET NOT NULL;

-- El tipo pasa a ser obligatorio; lo que no se pueda clasificar queda en OTRO.
UPDATE public.documentos SET tipo = 'OTRO' WHERE tipo IS NULL OR btrim(tipo) = '';
ALTER TABLE public.documentos ALTER COLUMN tipo SET DEFAULT 'OTRO';
ALTER TABLE public.documentos ALTER COLUMN tipo SET NOT NULL;

-- Observar un documento exige un motivo.
UPDATE public.documentos
   SET observaciones = 'Observación pendiente de completar'
 WHERE estado = 'OBSERVADO'
   AND (observaciones IS NULL OR btrim(observaciones) = '');

ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_observados_con_motivo
  CHECK (estado <> 'OBSERVADO' OR (observaciones IS NOT NULL AND btrim(observaciones) <> ''));

CREATE INDEX idx_documentos_estado ON public.documentos (estado);

-- ============================================================================
-- 2. Privilegios (PostgREST inserta/actualiza con la lista explícita de columnas)
-- ============================================================================

GRANT INSERT (
  id, postulacion_id, tipo, ruta, nombre_archivo, mime_type, tamanio_bytes,
  vigencia, estado, subido_por, revisado_por, revisado_el, observaciones
) ON public.documentos TO authenticated;

GRANT UPDATE (
  postulacion_id, tipo, ruta, nombre_archivo, mime_type, tamanio_bytes, vigencia,
  estado, subido_por, revisado_por, revisado_el, observaciones
) ON public.documentos TO authenticated;

GRANT DELETE ON public.documentos TO authenticated;

-- ============================================================================
-- 3. Policies de public.documentos
-- ============================================================================

DROP POLICY IF EXISTS documentos_alta ON public.documentos;
CREATE POLICY documentos_alta ON public.documentos
  FOR INSERT TO authenticated
  WITH CHECK (
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

DROP POLICY IF EXISTS documentos_revision ON public.documentos;
CREATE POLICY documentos_revision ON public.documentos
  FOR UPDATE TO authenticated
  USING (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
    AND EXISTS (
      SELECT 1
        FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
       WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
    )
  )
  WITH CHECK (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
    AND EXISTS (
      SELECT 1
        FROM public.postulaciones po
        JOIN public.periodos_de_ingreso p ON p.id = po.periodo_id
       WHERE po.id = postulacion_id AND p.institucion_id = public.institucion_actual()
    )
  );

DROP POLICY IF EXISTS documentos_baja ON public.documentos;
CREATE POLICY documentos_baja ON public.documentos
  FOR DELETE TO authenticated
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

-- ============================================================================
-- 4. Bucket privado y policies de Storage
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- La ruta es `institucion_id/postulacion_id/<id>-<archivo>`.
DROP POLICY IF EXISTS documentos_archivos_lectura ON storage.objects;
CREATE POLICY documentos_archivos_lectura ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      EXISTS (
        SELECT 1 FROM public.postulaciones po
         WHERE po.id::text = (storage.foldername(name))[2]
           AND po.aspirante_id = auth.uid()
      )
      OR (
        public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
        AND (storage.foldername(name))[1] = public.institucion_actual()::text
      )
    )
  );

DROP POLICY IF EXISTS documentos_archivos_alta ON storage.objects;
CREATE POLICY documentos_archivos_alta ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND (
      EXISTS (
        SELECT 1 FROM public.postulaciones po
         WHERE po.id::text = (storage.foldername(name))[2]
           AND po.aspirante_id = auth.uid()
      )
      OR (
        public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
        AND (storage.foldername(name))[1] = public.institucion_actual()::text
      )
    )
  );

DROP POLICY IF EXISTS documentos_archivos_baja ON storage.objects;
CREATE POLICY documentos_archivos_baja ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      EXISTS (
        SELECT 1 FROM public.postulaciones po
         WHERE po.id::text = (storage.foldername(name))[2]
           AND po.aspirante_id = auth.uid()
      )
      OR (
        public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
        AND (storage.foldername(name))[1] = public.institucion_actual()::text
      )
    )
  );

-- ============================================================================
-- 5. RPC de transición de documentación
-- ============================================================================

CREATE FUNCTION public.cambiar_estado_de_documentacion(
  p_postulacion_id UUID,
  p_estado public.estado_postulacion
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rol public.rol_usuario;
  v_post public.postulaciones%ROWTYPE;
  v_actual public.estado_postulacion;
BEGIN
  v_rol := public.rol_actual();
  IF v_rol IS NULL THEN
    RETURN 'NO_AUTORIZADO';
  END IF;

  -- El aspirante solo mueve su propia Postulación, y solo al iniciar la carga.
  IF v_rol = 'ASPIRANTE' THEN
    SELECT * INTO v_post FROM public.postulaciones
     WHERE id = p_postulacion_id AND aspirante_id = auth.uid();
    IF NOT FOUND THEN
      RETURN 'NO_ENCONTRADA';
    END IF;
    IF p_estado <> 'ESPERANDO_DOCUMENTACION' THEN
      RETURN 'NO_AUTORIZADO';
    END IF;
  ELSIF v_rol NOT IN ('SECRETARIA', 'DIRECCION') THEN
    RETURN 'NO_AUTORIZADO';
  ELSE
    SELECT * INTO v_post FROM public.postulaciones WHERE id = p_postulacion_id;
    IF NOT FOUND THEN
      RETURN 'NO_ENCONTRADA';
    END IF;

    -- La Postulación tiene que ser de la institución del actor.
    PERFORM 1
      FROM public.periodos_de_ingreso
     WHERE id = v_post.periodo_id
       AND institucion_id = public.institucion_actual();
    IF NOT FOUND THEN
      RETURN 'NO_ENCONTRADA';
    END IF;
  END IF;

  SELECT * INTO v_post FROM public.postulaciones
   WHERE id = p_postulacion_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'NO_ENCONTRADA';
  END IF;

  v_actual := v_post.estado;

  IF NOT (
    (v_actual = 'VACANTE_CONFIRMADA' AND p_estado = 'ESPERANDO_DOCUMENTACION')
    OR (v_actual = 'ESPERANDO_DOCUMENTACION' AND p_estado = 'DOCUMENTACION_EN_REVISION')
    OR (v_actual = 'DOCUMENTACION_EN_REVISION' AND p_estado = 'OBSERVADO')
    OR (v_actual = 'DOCUMENTACION_EN_REVISION' AND p_estado = 'DOCUMENTACION_VALIDADA')
    OR (v_actual = 'OBSERVADO' AND p_estado = 'DOCUMENTACION_EN_REVISION')
    OR (v_actual = 'DOCUMENTACION_VALIDADA' AND p_estado = 'CONFIRMADO_PARA_EXPORTAR')
  ) THEN
    RETURN 'TRANSICION_INVALIDA';
  END IF;

  UPDATE public.postulaciones
     SET estado = p_estado,
         vence_el = NULL,
         motivo_revision = NULL
   WHERE id = p_postulacion_id;

  RETURN 'OK';
EXCEPTION
  WHEN check_violation OR invalid_text_representation THEN
    RETURN 'TRANSICION_INVALIDA';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cambiar_estado_de_documentacion(UUID, public.estado_postulacion)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_de_documentacion(UUID, public.estado_postulacion)
  TO authenticated;
