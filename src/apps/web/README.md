# apps/web — Next.js

Adaptador de entrada **y raíz de composición**. Recibe pedidos (páginas, Server Actions, route handlers),
valida los datos en el borde, llama a los casos de uso y traduce la respuesta.
Es el único lugar donde se eligen los adaptadores concretos (`composition-root.ts`).

| Carpeta | Función |
|---|---|
| `app/` | Páginas y layouts por portal, y `app/api/` para los endpoints |
| `components/` | UI (shadcn/ui), sin reglas de negocio |
| `http/` | Schemas Zod de requests y mapeo de errores a respuestas |
| `lib/` | Utilidades de UI (`cn`); sin lógica de negocio |
| `public/` | Archivos estáticos |

El `middleware.ts` / `proxy.ts` de Next (protege las rutas según la sesión) también va acá, en la raíz de `web/`.

**No va:** reglas de negocio ni consultas directas a Supabase.

**Antes (propuesta de Santi):** "todo el código del front con React y TS en el monolito de Next.js".
Eso se mantiene, con una diferencia: Next es **un adaptador**, no el contenedor de toda la lógica.

## Cómo levantarlo

Requisitos: Node 24 y pnpm (la versión la fija `packageManager` en `src/package.json`).

```bash
cd src
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck    # en apps/web corre next typegen + tsc
```

Para probar la API: `http://localhost:3000/api/health`.

## Stack de UI

- **Next.js 16** (App Router) y **React 19**.
- **Tailwind CSS 4**: no hay `tailwind.config.js`; el tema vive en `app/globals.css` (`@theme inline`).
- **shadcn/ui sobre Base UI** (`components.json`). Los componentes se copian a `components/ui/`:
  `pnpm dlx shadcn add <nombre>` desde `apps/web`.
- **Tokens semánticos**: los componentes usan `bg-primary`, `text-foreground`, etc. Los valores reales
  (`:root` y `.dark` en `globals.css`) los define `DESIGN.md` (T17); hoy son provisorios.

`next-env.d.ts` y `AGENTS.md` los genera Next: el primero no se versiona; del segundo, Next solo maneja el
bloque marcado y el resto es nuestro.
