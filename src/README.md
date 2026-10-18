# src — raíz del código

Raíz del **workspace pnpm**. Acá viven `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`,
`.nvmrc` y `eslint.config.mjs`. Todo el código está dentro de `src/`, y la
documentación queda afuera. Los comandos de pnpm se corren desde acá.

Requisitos: **Node 24** (lo lee fnm del `.nvmrc`; con otra versión, `pnpm install` falla) y **pnpm**
(la versión exacta la fija `packageManager` en `package.json`).

```bash
cd src
pnpm install      # instala todo el workspace
pnpm typecheck    # chequea los tipos de todos los paquetes
pnpm lint         # ESLint: sin `any` y con los límites entre capas
```

En el editor, los errores de lint aparecen con la extensión **ESLint** (`dbaeumer.vscode-eslint`), que el repo
recomienda al abrirlo. `.vscode/settings.json` le indica que la config está en `src/`: sin eso, abriendo la raíz
del repo, la extensión no la encuentra.

| Carpeta | Función |
|---|---|
| `apps/` | Adaptadores de **entrada**: lo que usan las personas (hoy, la web en Next.js) |
| `packages/` | El **núcleo** (`domain`, `application`) y los adaptadores de **salida** (`infrastructure`) |
| `supabase/` | Migraciones del esquema de la base |

Regla: las dependencias apuntan siempre hacia `packages/domain`. `pnpm lint` la hace cumplir con dos barreras:
cada paquete solo importa lo que declara en **su** `package.json`, y una regla por capa (`domain` no importa
ningún `@tfi/*`, `application` solo `domain`, `infrastructure` no importa `web`) que falla aunque se agregue la
dependencia. Entre paquetes se importa como `@tfi/*`, nunca con rutas relativas (`../../packages/...`).
Guía completa: [estructura del código](../docs/architecture/estructura-codigo.md).

**Antes (propuesta de Santi):** en `src/` convivían el hexágono (`apps/`, `packages/`) y carpetas del
modelo en capas (`repository/`, `services/`, `schemas/`, `lib/`, `components/`, `types/`, `public/`,
`middleware.ts`). Cada una se reubicó en su capa; la nota de cada carpeta cuenta adónde fue.
