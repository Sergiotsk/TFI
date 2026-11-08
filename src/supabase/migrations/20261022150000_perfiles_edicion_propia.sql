-- ============================================================================
-- Edición del perfil propio
--
-- Cualquier persona autenticada puede corregir sus datos personales, pero no
-- el DNI (lo identifica y lo corrige el personal), ni el rol, el email, la
-- institución o la verificación. El GRANT por columna de 20261022140200 ya
-- limita las columnas; esta policy habilita la fila propia y el trigger cierra
-- el único campo sensible que el grant sí permite: el DNI.
-- ============================================================================

CREATE POLICY perfiles_actualizacion_propia ON public.perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE FUNCTION public.proteger_campos_de_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- RLS y los grants ya impiden tocar rol, email, institución y verificación.
  -- Acá se cubre el DNI, que el grant del personal sí permite escribir.
  IF current_user = 'authenticated'
     AND public.rol_actual() = 'ASPIRANTE'
     AND NEW.dni IS DISTINCT FROM OLD.dni THEN
    RAISE EXCEPTION 'El DNI solo lo puede corregir el personal de la facultad';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proteger_campos_de_perfil() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER proteger_campos_de_perfil
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_de_perfil();
