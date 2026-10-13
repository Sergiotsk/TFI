# 0003 - `src/` como raíz del workspace, con paquetes planos

## Estado

Aceptado

## Contexto

La [arquitectura hexagonal (ADR-0001)](0001-usar-arquitectura-hexagonal.md) define capas
(`domain`, `application`, `infrastructure`, `apps/web`), pero no dónde viven físicamente en el
repositorio. El repo mezcla dos cosas de naturaleza distinta: **documentación** (`docs/`, la
constitución, entregables de la cátedra) y **código**.

El primer esqueleto de código (commit `8ccfd21`) ubicó `apps/` y `packages/` dentro de `src/`,
pero junto a carpetas del modelo en capas (`repository/`, `services/`, `schemas/`, `lib/`,
`types/`). Hacía falta decidir la ubicación del código antes de crear los `package.json`, porque
después moverla es caro.

## Decisión

- **`src/` es la raíz del workspace pnpm.** Ahí viven `package.json`, `pnpm-workspace.yaml`,
  `pnpm-lock.yaml`, las configs compartidas (TypeScript, ESLint, Vitest) y todo el código:
  `apps/`, `packages/` y `supabase/`. Los comandos de pnpm se corren desde `src/`.
- **Los paquetes y las apps son planos**: ni `packages/*` ni `apps/web` tienen un `src/` interno.
- La raíz del repositorio queda para la documentación y los archivos del repo (`README.md`,
  `AGENTS.md`, `CONTRIBUTING.md`, `.gitignore`).
- Las carpetas del modelo en capas se reubican en la capa que les corresponde (ver
  [estructura del código](../architecture/estructura-codigo.md)).

## Alternativas descartadas

- **Workspace en la raíz del repo** (`apps/` y `packages/` junto a `docs/`): es lo más común y
  las herramientas lo esperan, pero mezcla código con documentación en el primer nivel.
- **`src/` interno en cada paquete** (`packages/domain/src/...`): sirve para separar fuentes de
  configs y de `dist/`, pero sumado a `src/` como raíz da rutas como
  `src/packages/domain/src/postulacion/`. Por ahora no se planea compilar los paquetes, así que
  no habría `dist/` que separar.
- **Estructura por capas** (`repository/`, `services/`, `schemas/` sueltos en `src/`): contradice
  el ADR-0001 porque no hay puertos y los servicios dependen de implementaciones concretas.

## Consecuencias

- ✅ La raíz del repo queda limpia: quien busca documentación no tropieza con configs de build.
- ✅ Rutas cortas y una sola forma de ubicar cada archivo (`src/packages/domain/postulacion/`).
- ✅ Cada carpeta lleva un `README.md` que explica su función, así la estructura se entiende
  antes de que exista código.
- ⚠️ Algunas herramientas necesitan una línea de configuración para encontrar el workspace.
  Se verificó antes de decidir que ninguna del stack lo impide:
  - **Vercel**: Root Directory `src/apps/web`. El build busca el lockfile subiendo desde esa
    carpeta, así que encuentra `src/pnpm-lock.yaml`.
  - **GitHub Actions**: `working-directory: src`, `package_json_file: src/package.json` en
    `pnpm/action-setup` y `cache-dependency-path: src/pnpm-lock.yaml` en `setup-node`.
  - **Supabase** (integración con GitHub): Working directory `src`. El CLI se corre desde `src/`.
  - **Husky** (si se suma): no se instala en carpetas padre, así que el `prepare` hace
    `cd .. && husky src/.husky`, como indica su documentación.
- ⚠️ No puede haber lockfiles en la raíz del repo: Next.js infiere la raíz del monorepo buscando
  lockfiles hacia arriba, y uno suelto la desvía.
- ⚠️ Hay que acordarse de correr pnpm desde `src/`, no desde la raíz.

## Cuándo re-evaluar

Si alguna herramienta clave del stack no admite el workspace en una subcarpeta, o si la
configuración extra se vuelve más costosa que el beneficio de tener la raíz limpia.
