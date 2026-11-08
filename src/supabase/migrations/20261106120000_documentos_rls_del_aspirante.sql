-- ============================================================================
-- RLS de documentos: la base exige las reglas del aspirante
--
-- 20261022160000 le dio al aspirante INSERT y DELETE sobre sus documentos y sus
-- archivos con una sola condición: que la Postulación sea suya. Las reglas de
-- SubirDocumento y EliminarDocumento vivían solo en la app, así que con su
-- sesión y la clave pública podía, llamando a la API directo:
--
-- - cargar un documento ya APROBADO, con revisor y fecha de revisión;
-- - cargar o borrar documentos en cualquier etapa, incluso después de la
--   validación (la Postulación quedaba lista para exportar sin respaldo).
--
-- Ahora la parte del aspirante de cada policy exige lo mismo que la app:
-- - la Postulación está en una etapa que admite documentos
--   (ESTADOS_QUE_ADMITEN_DOCUMENTOS en application/casos-de-uso/documentos/comun.ts);
-- - el alta es PENDIENTE, sin datos de revisión y a su nombre.
--
-- Esas etapas no vencen solas, así que el estado persistido es el efectivo.
-- Secretaría y Dirección no cambian.
-- ============================================================================

-- ============================================================================
-- 1. public.documentos
-- ============================================================================

DROP POLICY IF EXISTS documentos_alta ON public.documentos;
CREATE POLICY documentos_alta ON public.documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      estado = 'PENDIENTE'
      AND revisado_por IS NULL
      AND revisado_el IS NULL
      AND observaciones IS NULL
      AND subido_por = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.postulaciones po
         WHERE po.id = postulacion_id
           AND po.aspirante_id = auth.uid()
           AND po.estado IN (
             'VACANTE_CONFIRMADA', 'ESPERANDO_DOCUMENTACION', 'DOCUMENTACION_EN_REVISION', 'OBSERVADO'
           )
      )
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

DROP POLICY IF EXISTS documentos_baja ON public.documentos;
CREATE POLICY documentos_baja ON public.documentos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.postulaciones po
       WHERE po.id = postulacion_id
         AND po.aspirante_id = auth.uid()
         AND po.estado IN (
           'VACANTE_CONFIRMADA', 'ESPERANDO_DOCUMENTACION', 'DOCUMENTACION_EN_REVISION', 'OBSERVADO'
         )
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
-- 2. Archivos del bucket `documentos` (ruta `institucion/postulacion/archivo`)
-- ============================================================================

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
           AND po.estado IN (
             'VACANTE_CONFIRMADA', 'ESPERANDO_DOCUMENTACION', 'DOCUMENTACION_EN_REVISION', 'OBSERVADO'
           )
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
           AND po.estado IN (
             'VACANTE_CONFIRMADA', 'ESPERANDO_DOCUMENTACION', 'DOCUMENTACION_EN_REVISION', 'OBSERVADO'
           )
      )
      OR (
        public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
        AND (storage.foldername(name))[1] = public.institucion_actual()::text
      )
    )
  );
