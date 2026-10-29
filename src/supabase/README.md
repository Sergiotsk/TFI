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

La CI hace cumplir las reglas de formato, edición y orden en cada PR: falla si una migración nueva tiene un nombre
que el CLI no aplicaría, repite la versión de otra o queda antes de la última de la base, y también si se edita o
borra una que ya está en la base. Para chequearlo antes de abrir el PR, desde `src/`:

```bash
git fetch origin
pnpm migraciones:verificar            # contra origin/develop; para otra base: pnpm migraciones:verificar origin/main
```

## Tests de contrato contra Supabase

`pnpm test` corre solo la suite de unidad, sin red ni base de datos. Los contratos de los adaptadores
de Supabase se ejecutan aparte contra un proyecto **descartable** de staging o una base local:

```bash
# Desde src/. Las claves salen de `supabase status` (local) o del proyecto de prueba.
export SUPABASE_TEST_URL="https://<proyecto-de-prueba>.supabase.co"
export SUPABASE_TEST_PUBLISHABLE_KEY="<publishable-key>"
export SUPABASE_TEST_SERVICE_ROLE_KEY="<service-role-key>"

pnpm test:contratos
```

En PowerShell se usa `$env:SUPABASE_TEST_URL = "..."`, etc. Si faltan las variables, las suites de
contrato se saltan solas: nunca apuntan a producción por defecto.

Antes de correrlos conviene dejar la base de prueba en un estado conocido:

```bash
# Desde src/, solo si el proyecto enlazado es el de prueba.
npx supabase db reset --linked --yes
```

Ese comando aplica todas las migraciones y el `seed.sql`. El seed usa la institución `FRH` que crean
las migraciones, agrega un período abierto de ejemplo y una cuenta por rol de personal con contraseña
`solo-local-123`; no crea postulaciones ni documentos. Los contratos generan sus propios datos con DNI,
CUIL, períodos e instituciones únicos por corrida y, para documentación, crean Postulaciones reales
porque la tabla tiene claves foráneas.

El bucket `documentos` es privado. La subida y la URL firmada se prueban con la clave de servicio;
las policies de Storage por rol se verifican a mano desde `/pruebas` o con el smoke de la API.

## Un toggle que no es una migración

En el proyecto remoto hay que **desactivar "Confirm email"** (Authentication → Sign In / Providers →
Email). Local ya viene desactivado (`enable_confirmations = false` en `config.toml`).

Si queda activado, cada registro dispara un email de confirmación: con el SMTP incluido en el plan
gratuito el límite de envío se agota enseguida y **el registro empieza a fallar con 429**, y además
el usuario queda sin sesión hasta confirmar. Es el mismo error que vería un compañero con la base
local si no se aplica la migración: por eso el "te enviamos un email" del registro solo aparece con
la confirmación desactivada.

