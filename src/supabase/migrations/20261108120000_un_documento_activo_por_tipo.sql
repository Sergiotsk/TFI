-- ============================================================================
-- Un solo documento activo por tipo en cada Postulación
--
-- Nada impedía cargar dos veces el mismo tipo: un doble envío del formulario
-- dejaba documentos repetidos que Secretaría tenía que revisar y que nadie podía
-- quitar desde la app.
--
-- Los OBSERVADO no cuentan: al corregir, el reemplazo se sube antes de borrar el
-- observado, para que la Postulación nunca se quede sin el documento.
--
-- Si esta migración falla por una clave repetida, hay duplicados previos: se
-- resuelven a mano, porque decidir cuál conservar no le corresponde al esquema.
-- ============================================================================

CREATE UNIQUE INDEX documentos_un_activo_por_tipo
  ON public.documentos (postulacion_id, tipo)
  WHERE estado <> 'OBSERVADO';
