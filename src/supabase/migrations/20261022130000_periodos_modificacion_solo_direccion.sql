-- Los períodos de ingreso los gestiona únicamente el Director (DIRECCION):
-- puede crearlos y modificarlos. Secretaría y Tesorería solo los consultan.
-- El caso de uso exige lo mismo; RLS es la segunda barrera.

DROP POLICY IF EXISTS periodos_modificacion ON public.periodos_de_ingreso;

CREATE POLICY periodos_modificacion ON public.periodos_de_ingreso
  FOR UPDATE TO authenticated
  USING (
    public.rol_actual() = 'DIRECCION'
    AND institucion_id = public.institucion_actual()
  )
  WITH CHECK (
    public.rol_actual() = 'DIRECCION'
    AND institucion_id = public.institucion_actual()
  );
