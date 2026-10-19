# 0004 - Migraciones al remoto por la integración de GitHub de Supabase

## Estado

Aceptado

## Contexto

Varias personas trabajan sobre la misma base de Supabase. La constitución (Principio VII) exige que el esquema
cambie **solo con migraciones** versionadas en el repo. Faltaba decidir dos cosas: contra qué base trabaja cada
uno mientras desarrolla, y quién aplica las migraciones en el proyecto remoto.

Si todos aplican cambios al remoto (`supabase db push`), todos necesitan la contraseña de la base, los cambios se
pisan y una migración sin revisar puede romper la base del equipo entero.

Hay un solo proyecto Supabase, el de desarrollo, en el plan Free. El Branching (una base por PR) es del plan Pro.

## Decisión

- **Cada integrante trabaja contra su base local** (`supabase start`, en Docker). Las migraciones se prueban con
  `supabase db reset` y viajan por PR hacia `develop`, como cualquier otro código.
- **La integración de GitHub de Supabase aplica las migraciones** en el proyecto remoto, con "Deploy to
  production" activado. Funciona en todos los planes.
- **La rama de producción de la integración es `develop`.** Con un solo proyecto, el remoto tiene que reflejar lo
  integrado. Cuando exista un proyecto de producción aparte, ese se conecta con `main`.
- **Working directory de la integración: `src`**, la carpeta que contiene `supabase/` (ver
  [ADR-0003](0003-src-como-raiz-del-workspace.md)).
- **RLS y `GRANT` van explícitos en cada migración.** Los toggles del proyecto remoto (RLS automático, no exponer
  tablas nuevas) no existen en la base local.

## Alternativas descartadas

- **Todos con la contraseña y `db push` a mano**: es lo más simple, pero cualquiera puede aplicar una migración
  sin revisar, y si alguien deja el equipo hay que rotar la contraseña.
- **Workflow propio de GitHub Actions** con `supabase db push` y la contraseña como secret: da más control (por
  ejemplo, correr tests antes de aplicar), pero suma un workflow que mantener y un secret que custodiar. La
  integración hace lo mismo sin ninguna de las dos cosas.
- **Rama de producción `main`**: lo mergeado a `develop` no llegaría al remoto hasta la próxima entrega, y el
  remoto no serviría para probar lo integrado.

## Consecuencias

- ✅ El remoto solo cambia con código revisado y mergeado.
- ✅ La contraseña de la base no se reparte y no hay secrets de Supabase en GitHub.
- ✅ Cualquiera que clone el repo recrea la base completa con `supabase start`.
- ⚠️ Docker Desktop es obligatorio para trabajar con la base.
- ⚠️ Mientras haya un solo proyecto, `develop` funciona como "producción" de la base de desarrollo: una migración
  que rompe al mergearse rompe el remoto de todos. Conviene activar el check de la integración como *required* en
  `develop`, para que una migración inválida no se pueda mergear.
- ⚠️ Una migración ya mergeada no se edita: se corrige con otra.

## Cuándo re-evaluar

Cuando se cree el proyecto de producción, o si se pasa al plan Pro y conviene usar Branching.
