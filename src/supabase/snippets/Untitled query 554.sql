INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test_final@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Lucia","apellido":"Enriquez","dni":"40290828","cuil":"40290828","fecha_nacimiento":"2000-01-01","sexo":"F","telefono":"112337219","direccion":"Haedo"}'::jsonb,
  now(),
  now()
);
