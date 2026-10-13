# apps/web/app/api — endpoints HTTP

Route handlers (`route.ts`) para lo que llega de afuera: la subida del informe de pagos y el
webhook de Pagos360 (por confirmar). Validan con Zod, llaman al caso de uso y devuelven la respuesta.

**Antes (propuesta de Santi):** `apps/api/auth` y `apps/api/users`, pensados como "routes y controllers
de Express". El route handler cumple el rol de route y de controller, y la lógica queda en el caso de uso.
La autenticación la resuelve Supabase Auth, no un endpoint propio.
