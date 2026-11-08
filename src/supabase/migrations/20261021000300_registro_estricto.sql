-- ============================================================================
-- Registro estricto y sincronización del email (spec FR-009 y FR-009b, research R7,
-- contracts/rpc.md)
--
-- Reemplaza handle_new_user, que tenía dos fallas:
-- - Tomaba el rol de raw_user_meta_data, un dato que controla el usuario: cualquiera se
--   registraba como ADMIN.
-- - Completaba los faltantes con '' y CURRENT_DATE: el segundo registro sin DNI rompía por el
--   UNIQUE, y quedaban aspirantes "nacidos hoy".
--
-- Tiene que ir justo después de 20261021000200: con perfiles.institucion_id NOT NULL, el trigger
-- viejo rompe todos los registros.
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- 1. Crear el perfil al registrarse
-- ============================================================================

CREATE FUNCTION public.crear_perfil_al_registrarse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_institucion_id UUID;
  v_cantidad_activas INTEGER;
  v_campo TEXT;
  v_fecha_nacimiento DATE;
  v_sexo public.sexo;
BEGIN
  -- Datos obligatorios: si falta alguno, el registro falla (Zod ya los valida antes en apps/web).
  FOREACH v_campo IN ARRAY ARRAY['nombre', 'apellido', 'dni', 'cuil', 'fecha_nacimiento', 'sexo'] LOOP
    IF NULLIF(btrim(v_meta ->> v_campo), '') IS NULL THEN
      RAISE EXCEPTION 'Registro incompleto: falta el dato obligatorio "%"', v_campo;
    END IF;
  END LOOP;

  BEGIN
    v_fecha_nacimiento := (v_meta ->> 'fecha_nacimiento')::date;
    v_sexo := (v_meta ->> 'sexo')::public.sexo;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR invalid_text_representation THEN
    RAISE EXCEPTION 'Registro inválido: fecha_nacimiento o sexo con formato incorrecto';
  END;

  -- La única institución activa (ADR-0006). Con cero o más de una, el registro se rediseña.
  SELECT count(*), min(id::text)::uuid
    INTO v_cantidad_activas, v_institucion_id
    FROM public.instituciones
   WHERE activa;

  IF v_cantidad_activas <> 1 THEN
    RAISE EXCEPTION 'Registro no disponible: se esperaba exactamente una institución activa y hay %',
      v_cantidad_activas;
  END IF;

  -- El rol es siempre ASPIRANTE: nunca se lee de la metadata.
  INSERT INTO public.perfiles (
    id, institucion_id, email, nombre, apellido, dni, cuil,
    fecha_nacimiento, sexo, telefono, direccion, rol
  )
  VALUES (
    NEW.id,
    v_institucion_id,
    NEW.email,
    btrim(v_meta ->> 'nombre'),
    btrim(v_meta ->> 'apellido'),
    btrim(v_meta ->> 'dni'),
    btrim(v_meta ->> 'cuil'),
    v_fecha_nacimiento,
    v_sexo,
    NULLIF(btrim(v_meta ->> 'telefono'), ''),
    NULLIF(btrim(v_meta ->> 'direccion'), ''),
    'ASPIRANTE'
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crear_perfil_al_registrarse() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER crear_perfil_al_registrarse
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.crear_perfil_al_registrarse();

-- ============================================================================
-- 2. Sincronizar el email del perfil cuando cambia en Auth
-- ============================================================================

CREATE FUNCTION public.sincronizar_email_de_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.perfiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sincronizar_email_de_perfil() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sincronizar_email_de_perfil
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sincronizar_email_de_perfil();
