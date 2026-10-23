# apps/web/app/api — endpoints HTTP

Route handlers (`route.ts`) para lo que llega de afuera: autenticación, postulaciones, períodos,
perfiles y documentación. Validan con Zod, arman el actor desde la sesión, llaman **un** caso de uso
y devuelven la respuesta uniforme `{ success, data | error }`.

**Antes (propuesta de Santi):** `apps/api/auth` y `apps/api/users`, pensados como "routes y controllers
de Express". El route handler cumple el rol de route y de controller, y la lógica queda en el caso de uso.
La autenticación la resuelve Supabase Auth, no un endpoint propio.

## Qué hay hoy

- `api/auth/**`: API programática de autenticación (registro, inicio y cierre de sesión, y el perfil
  de la sesión). Delega en los casos de uso de `@tfi/application`; no implementa reglas de negocio.
  La **UI** (`/login`, `/registro`, `/panel`) usa Server Actions, no estos endpoints: son la misma
  lógica de aplicación, no dos implementaciones.
- `api/perfiles/**`: lectura y edición de perfiles. Exige sesión; el aspirante solo puede leer y
  editar el suyo, y el personal accede según su rol e institución.
- `api/periodos/**` y `api/postulaciones/**`: alta y consulta de períodos, postulaciones propias o
  de la institución, acreditación manual de pagos, prórrogas y búsquedas por DNI.
- `api/documentos/**`: circuito de documentación de la Postulación.
  - `GET /api/documentos`: listado paginado con filtros. Secretaría y Dirección ven su institución;
    el aspirante solo ve los documentos de sus Postulaciones.
  - `POST /api/documentos` (`multipart/form-data`): subida de PDF, JPG o PNG de hasta 10 MB. El
    archivo va al bucket privado y la fila guarda solo la ruta y los metadatos.
  - `GET /api/documentos/:id`: devuelve el documento y una URL firmada de cinco minutos.
  - `PATCH /api/documentos/:id`: revisión (aprobar u observar) o corrección de metadatos, solo
    Secretaría y Dirección y antes de la validación.
  - `DELETE /api/documentos/:id`: borra el archivo del Storage y la fila. El aspirante puede borrar
    los propios; Secretaría y Dirección, los de su institución.

Cada route handler es un **adaptador de entrada**: valida con Zod, arma el caso de uso desde la raíz
de composición (`@/composition-root`) y devuelve la respuesta con `jsonOk` / `jsonError`. La
autorización por rol se verifica en los casos de uso; RLS es la segunda barrera.

## Rutas que se fueron

- `api/procedure/**`: eliminadas. Modelaban un trámite de aprobación con cuatro estados
  (`INICIADO`, `EN PROCESO`, `APROBADO`, `RECHAZADO`) que no existen en el negocio: el ciclo de vida
  real es el de la Postulación (`docs/architecture/overview.md`). La API de postulaciones llega con
  la feature 001, en `/api/postulaciones` (tarea T081 del spec).
- `api/document/**`: reemplazada por `api/documentos/**` cuando la documentación dejó de usar el
  fake y pasó a Supabase Storage (ADR 0010).
