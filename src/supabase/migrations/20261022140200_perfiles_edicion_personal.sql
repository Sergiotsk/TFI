-- ============================================================================
-- Edición de perfiles por el personal
--
-- Secretaría, Tesorería y Dirección pueden corregir los datos personales de un
-- perfil de su institución (por ejemplo, un DNI mal tipeado al registrarse).
-- El GRANT es por columna: rol, email, institución y verificado quedan fuera.
-- El alta del perfil la sigue haciendo el trigger de Auth.
-- ============================================================================

GRANT UPDATE (nombre, apellido, dni, cuil, fecha_nacimiento, sexo, telefono, direccion)
  ON public.perfiles TO authenticated;

CREATE POLICY perfiles_actualizacion ON public.perfiles
  FOR UPDATE TO authenticated
  USING (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
    AND institucion_id = public.institucion_actual()
  )
  WITH CHECK (
    public.rol_actual() IN ('SECRETARIA', 'DIRECCION', 'TESORERIA')
    AND institucion_id = public.institucion_actual()
  );
