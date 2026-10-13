# apps/web — Next.js

Adaptador de entrada **y raíz de composición**. Recibe pedidos (páginas, Server Actions, route handlers),
valida los datos en el borde, llama a los casos de uso y traduce la respuesta.
Es el único lugar donde se eligen los adaptadores concretos (`composition-root.ts`).

| Carpeta | Función |
|---|---|
| `app/` | Páginas y layouts por portal, y `app/api/` para los endpoints |
| `components/` | UI (shadcn/ui), sin reglas de negocio |
| `http/` | Schemas Zod de requests y mapeo de errores a respuestas |
| `public/` | Archivos estáticos |

El `middleware.ts` / `proxy.ts` de Next (protege las rutas según la sesión) también va acá, en la raíz de `web/`.

**No va:** reglas de negocio ni consultas directas a Supabase.

**Antes (propuesta de Santi):** "todo el código del front con React y TS en el monolito de Next.js".
Eso se mantiene, con una diferencia: Next es **un adaptador**, no el contenedor de toda la lógica.
