# apps/web/app/api — endpoints HTTP

Route handlers (`route.ts`) para lo que llega de afuera: la subida del informe de pagos y el
webhook de Pagos360 (por confirmar). Validan con Zod, llaman al caso de uso y devuelven la respuesta.

**Antes (propuesta de Santi):** `apps/api/auth` y `apps/api/users`, pensados como "routes y controllers
de Express". El route handler cumple el rol de route y de controller, y la lógica queda en el caso de uso.
La autenticación la resuelve Supabase Auth, no un endpoint propio.

## Qué hay hoy

- `api/auth/**`: API programática de autenticación (registro, inicio y cierre de sesión, y el perfil
  de la sesión). Delega en los casos de uso de `@tfi/application`; no implementa reglas de negocio.
  La **UI** (`/login`, `/registro`, `/panel`) usa Server Actions, no estos endpoints: son la misma
  lógica de aplicación, no dos implementaciones.
- `api/perfiles/**`: lectura de perfiles. Exige sesión y, para listar, un rol del personal
  (secretaría, dirección, tesorería). Un aspirante solo puede leer el suyo.
- `api/procedure/**` y `api/document/**`: todavía usan los fakes del composition root. Es deuda
  conocida (T053): no exponen datos reales, pero no tienen autorización.

Cada route handler es un **adaptador de entrada**: valida con Zod, arma el caso de uso desde la raíz
de composición (`@/composition-root`) y devuelve la respuesta con `jsonOk` / `jsonError`.
