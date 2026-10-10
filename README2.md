# src

Código fuente de la solución.

## Estado

🚧 **Sin código de producción todavía.** `test_frontend/` contiene maquetas HTML de las pantallas
del postulante, usadas para validar el flujo; no forman parte de la solución.

## Arquitectura

La solución sigue **arquitectura hexagonal** (puertos y adaptadores), según
[ADR-0001](../docs/decisions/0001-usar-arquitectura-hexagonal.md). El stack y la estructura ya
están definidos en la constitución (`../.specify/memory/constitution.md`, Principio I y sección
Stack): TypeScript, Next.js y Supabase, en un **monorepo pnpm** con `packages/domain`,
`packages/application`, `packages/infrastructure` y `apps/web`.

Antes de escribir código, leé la guía práctica:
[`docs/architecture/estructura-codigo.md`](../docs/architecture/estructura-codigo.md). Ahí está el
árbol de carpetas, la regla de dependencias, un caso recorrido de punta a punta y cómo agregar una
feature.

## Próximo paso

Al arrancar la primera feature se crea la estructura del monorepo en la raíz del repositorio
(`apps/` y `packages/`), y esta carpeta deja de usarse para el código de la solución.
