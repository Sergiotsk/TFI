# supabase

Configuración de Supabase CLI y migraciones de la base. El esquema se cambia **solo con migraciones** de este
directorio: nada de cambios manuales desde el Dashboard (Principio VII). La decisión está en el
[ADR 0004](../../docs/decisions/0004-migraciones-por-integracion-github.md).

## Cómo trabajamos

- Cada integrante trabaja contra **su base local** (`supabase start`).
- Las migraciones viajan por PR hacia `develop`, como cualquier otro código.
- Al mergear a `develop`, la **integración de GitHub de Supabase** aplica las migraciones nuevas en el proyecto
  remoto de desarrollo. Nadie hace `supabase link` ni `supabase db push` a mano, y la contraseña de la base no
  se reparte.

## Una sola vez

1. Aceptar la invitación a la organización de Supabase (llega por mail).
2. Instalar [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) y
   [Docker Desktop](https://www.docker.com/products/docker-desktop/). Conviene que todos usemos la misma versión
   del CLI: `supabase --version`.
3. Iniciar sesión con tu cuenta. El token es personal y no se comparte:

   ```bash
   supabase login
   ```

4. Con Docker Desktop abierto, levantar la base local desde `src/`:

   ```bash
   cd src
   supabase start      # la primera vez baja las imágenes y tarda unos minutos
   ```

   Al terminar muestra las URLs y las keys locales. Para verlas de nuevo: `supabase status`.

5. Para la app: copiar `apps/web/.env.example` a `apps/web/.env.local` y completarlo con los valores de
   `supabase status`. `.env.local` no se versiona.

Si `supabase start` falla con `port is already allocated`, tenés otro proyecto de Supabase levantado. Frenalo con
`supabase stop --project-id <nombre>`.

## Día a día

```bash
supabase migration new agregar_tabla_x   # crea migrations/<timestamp>_agregar_tabla_x.sql
# escribir el SQL en ese archivo
supabase db reset                        # recrea la base local y aplica todas las migraciones
```

Después: commit, push y PR hacia `develop`. Al terminar el día: `supabase stop` (los datos locales se conservan).

## Reglas para las migraciones

- **Siempre con `supabase migration new`**, nunca creando el archivo a mano. El CLI solo aplica archivos con el
  formato `<timestamp>_<nombre>.sql` (timestamp en UTC); los demás los saltea con un aviso.
- **Cada tabla nueva lleva RLS y `GRANT` explícitos** en la misma migración. Los toggles del proyecto remoto (RLS
  automático, no exponer tablas nuevas) no existen en la base local: si no está en SQL, local y remoto se
  comportan distinto.

  ```sql
  alter table public.tabla_x enable row level security;
  grant select on public.tabla_x to authenticated;   -- solo lo que haga falta, nunca a anon por defecto
  ```

- **No editar una migración ya mergeada.** Si hay que corregir algo, se crea una migración nueva.
- **Si otra persona mergeó una migración antes que la tuya**, la tuya tiene que quedar después: creá una nueva con
  `supabase migration new`, pasale tu SQL, borrá la vieja y corré `supabase db reset`.
- **Sin datos personales reales** en migraciones ni en seeds (Ley 25.326).
