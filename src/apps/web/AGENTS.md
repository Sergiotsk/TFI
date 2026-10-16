# AGENTS.md — apps/web

Primero leé el [AGENTS.md de la raíz](../../../AGENTS.md): sus reglas valen también acá. Ante una
contradicción, rige la constitución (`.specify/memory/constitution.md`).

Recordatorios para esta carpeta:

- `apps/web` es un **adaptador de entrada** y la **raíz de composición** (`composition-root.ts`): sin reglas de negocio.
- Route handlers y Server Actions: validan con **Zod** en el borde y llaman a un **caso de uso** de
  `@tfi/application`. Nunca a Supabase directo ni a un repositorio sin pasar por un caso de uso.
- Componentes: solo **tokens semánticos** de Tailwind (`bg-primary`, `text-foreground`), nunca colores fijos.
- Importar los paquetes como `@tfi/domain`, `@tfi/application`, etc., no con rutas relativas.

El bloque de abajo lo escribe `next dev` y lo vuelve a crear si se borra: no editarlo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
