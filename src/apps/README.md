# apps — adaptadores de entrada

Las aplicaciones que **inician** acciones sobre el núcleo (driving adapters). Hoy hay una sola: `web/`.
Si más adelante se suma una app móvil o un CLI, va acá y reusa `packages/` tal cual.

**Puede importar:** todo, porque es la raíz de composición.

**Antes (propuesta de Santi):** había `apps/web` y `apps/api` ("routes y controllers de Express").
Con Next.js no hace falta una app de API aparte: los endpoints viven en `web/app/api/`.
