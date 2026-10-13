# apps/web/http — bordes HTTP

Schemas **Zod** que validan requests, formularios y variables de entorno, y el mapeo de errores del
dominio a respuestas HTTP. Zod vive en los bordes, nunca en `domain` (Principio IV).

**Antes (propuesta de Santi):** `src/schemas/` ("validaciones Zod"). La idea se mantiene y cambia el lugar,
porque validar es tarea del borde. Los schemas del informe de pagos van en
`infrastructure/informe-de-pagos/`, junto al lector.
