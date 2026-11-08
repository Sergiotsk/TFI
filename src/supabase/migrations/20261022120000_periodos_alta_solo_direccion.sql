-- Los períodos de ingreso los da de alta únicamente el Director (DIRECCION).
-- Secretaría puede consultarlos y modificarlos, pero no crear períodos nuevos.
-- El caso de uso exige lo mismo; RLS es la segunda barrera.

DROP POLICY IF EXISTS periodos_alta ON public.periodos_de_ingreso;

CREATE POLICY periodos_alta ON public.periodos_de_ingreso
  FOR INSERT TO authenticated
  WITH CHECK (
    public.rol_actual() = 'DIRECCION'
    AND institucion_id = public.institucion_actual()
  );
