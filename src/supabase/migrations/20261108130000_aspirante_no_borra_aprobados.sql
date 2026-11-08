-- ============================================================================
-- El aspirante no borra lo que Secretaría ya aprobó
--
-- 20261106120000 limitó la baja a las etapas abiertas, pero sin mirar el estado
-- del documento: con la documentación abierta, el aspirante podía quitar un
-- documento APROBADO o su archivo llamando a la API directo.
--
-- Solo cambia la parte del aspirante. Secretaría y Dirección siguen igual.
-- ============================================================================

DROP POLICY IF EXISTS documentos_baja ON public.documentos;
CREATE POLICY documentos_baja ON public.documentos
  FOR DELETE TO authenticated
  USING (
    (
      estado <> 'APROBADO'
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

DROP POLICY IF EXISTS documentos_archivos_baja ON storage.objects;
CREATE POLICY documentos_archivos_baja ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      (
        NOT EXISTS (
          SELECT 1 FROM public.documentos d
           WHERE d.ruta = name AND d.estado = 'APROBADO'
        )
        AND EXISTS (
          SELECT 1 FROM public.postulaciones po
           WHERE po.id::text = (storage.foldername(name))[2]
             AND po.aspirante_id = auth.uid()
             AND po.estado IN (
               'VACANTE_CONFIRMADA', 'ESPERANDO_DOCUMENTACION', 'DOCUMENTACION_EN_REVISION', 'OBSERVADO'
             )
        )
      )
      OR (
        public.rol_actual() IN ('SECRETARIA', 'DIRECCION')
        AND (storage.foldername(name))[1] = public.institucion_actual()::text
      )
    )
  );
