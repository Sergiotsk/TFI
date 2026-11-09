-- ============================================================================
-- Filas ignoradas en la carga del informe de pagos (ADR 0011)
--
-- El informe de SysAdmin trae también las cuotas de quienes ya cursan. La
-- admisión ignora esas filas (DNI sin Postulaciones o con todas admitidas):
-- no se guardan como pago, pero la carga cuenta cuántas fueron.
--
-- Tesorería cierra la carga con un UPDATE limitado por columna: la columna
-- nueva se suma al GRANT para que el cierre la pueda escribir.
-- ============================================================================

ALTER TABLE public.cargas_de_informe
  ADD COLUMN ignorados INTEGER NOT NULL DEFAULT 0 CHECK (ignorados >= 0);

GRANT UPDATE (ignorados) ON public.cargas_de_informe TO authenticated;
