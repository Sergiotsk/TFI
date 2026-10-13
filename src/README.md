# src — raíz del código

Raíz del **workspace pnpm**. Acá viven `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
y `.nvmrc` (y más adelante, la config de ESLint). Todo el código está dentro de `src/`, y la
documentación queda afuera. Los comandos de pnpm se corren desde acá.

Requisitos: **Node 24** (lo lee fnm del `.nvmrc`; con otra versión, `pnpm install` falla) y **pnpm**
(la versión exacta la fija `packageManager` en `package.json`).

```bash
cd src
pnpm install      # instala todo el workspace
pnpm typecheck    # chequea los tipos de todos los paquetes
```

| Carpeta | Función |
|---|---|
| `apps/` | Adaptadores de **entrada**: lo que usan las personas (hoy, la web en Next.js) |
| `packages/` | El **núcleo** (`domain`, `application`) y los adaptadores de **salida** (`infrastructure`) |
| `supabase/` | Migraciones del esquema de la base |

Regla: las dependencias apuntan siempre hacia `packages/domain`.
Guía completa: [estructura del código](../docs/architecture/estructura-codigo.md).

**Antes (propuesta de Santi):** en `src/` convivían el hexágono (`apps/`, `packages/`) y carpetas del
modelo en capas (`repository/`, `services/`, `schemas/`, `lib/`, `components/`, `types/`, `public/`,
`middleware.ts`). Cada una se reubicó en su capa; la nota de cada carpeta cuenta adónde fue.
