-- ============================================================================
-- Pagos manuales del personal
--
-- La acreditación manual (pago verificado fuera del sistema) deja un registro
-- en public.pagos, igual que el informe de SysAdmin o Pagos360. El proveedor
-- MANUAL distingue ese origen y `registrado_por` guarda quién lo acreditó.
-- ============================================================================

ALTER TYPE public.proveedor_pago ADD VALUE IF NOT EXISTS 'MANUAL';

ALTER TABLE public.pagos
  ADD COLUMN registrado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL;
