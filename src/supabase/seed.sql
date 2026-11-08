-- ============================================================================
-- Seed de la base LOCAL (supabase db reset). Nunca corre en el remoto (ADR-0004).
--
-- Las contraseñas son valores falsos de desarrollo, solo para la base local
-- (constitución, Principio VII). No reutilizarlas en ningún otro lado.
--
-- Crea:
-- - Un período de ingreso abierto de ejemplo.
-- - Una cuenta por cada rol de personal. El trigger de registro crea el perfil como
--   ASPIRANTE (nunca toma el rol de la metadata) y acá se le asigna el rol real, igual
--   que se haría a mano con el personal en el remoto.
-- ============================================================================

-- ============================================================================
-- 1. Período de ejemplo: 50 cupos, 3 días de plazo, matrícula de ARS 94.000
-- ============================================================================

INSERT INTO public.periodos_de_ingreso
  (institucion_id, nombre, total_cupos, cierra_el, dias_plazo_pago, monto_matricula_centavos)
VALUES (
  (SELECT id FROM public.instituciones WHERE codigo = 'FRH'),
  'Primer cuatrimestre (ejemplo local)',
  50,
  now() + INTERVAL '30 days',
  3,
  9400000
);

-- ============================================================================
-- 2. Cuentas de personal (una por rol)
-- ============================================================================

DO $$
DECLARE
  v_cuenta RECORD;
BEGIN
  FOR v_cuenta IN
    SELECT *
      FROM (VALUES
        ('11111111-1111-4111-8111-111111111111'::uuid, 'secretaria@local.test', 'Sofía', 'Secretaria',
         '30000001', '27300000011', 'SECRETARIA'::public.rol_usuario),
        ('22222222-2222-4222-8222-222222222222'::uuid, 'direccion@local.test', 'Diego', 'Director',
         '30000002', '20300000022', 'DIRECCION'::public.rol_usuario),
        ('33333333-3333-4333-8333-333333333333'::uuid, 'tesoreria@local.test', 'Tamara', 'Tesorera',
         '30000003', '27300000033', 'TESORERIA'::public.rol_usuario)
      ) AS c(id, email, nombre, apellido, dni, cuil, rol)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_cuenta.id,
      'authenticated',
      'authenticated',
      v_cuenta.email,
      extensions.crypt('solo-local-123', extensions.gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object(
        'nombre', v_cuenta.nombre,
        'apellido', v_cuenta.apellido,
        'dni', v_cuenta.dni,
        'cuil', v_cuenta.cuil,
        'fecha_nacimiento', '1990-01-01',
        'sexo', 'O'
      ),
      now(),
      now(),
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_cuenta.id,
      v_cuenta.id::text,
      jsonb_build_object('sub', v_cuenta.id::text, 'email', v_cuenta.email, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );

    -- El trigger creó el perfil como ASPIRANTE: se le asigna el rol de personal.
    UPDATE public.perfiles SET rol = v_cuenta.rol, verificado = TRUE WHERE id = v_cuenta.id;
  END LOOP;
END;
$$;
