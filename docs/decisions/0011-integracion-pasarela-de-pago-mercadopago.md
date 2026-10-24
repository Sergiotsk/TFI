# ADR-0011: Integración de pasarela de pago con MercadoPago

- **Estado:** Propuesto
- **Fecha:** 2026-10-23
- **Autores:** Equipo TFI
- **Relacionado:** ADR-0005 (Pagos, cargas e informe), FR-011, FR-012–FR-014, arquitectura hexagonal

## Contexto

El sistema necesita permitir que el aspirante abone la matrícula online para no depender exclusivamente de que Secretaría/Tesorería/Dirección acrediten el pago de forma manual.

Hoy ya existe el flujo manual:
- `AcreditarPagoManualUseCase` crea/actualiza el registro en `public.pagos` con `proveedor = 'MANUAL'`.
- La acreditación dispara la transición hacia `VACANTE_CONFIRMADA` respetando el control de cupos.

El objetivo es agregar MercadoPago, pero **manteniendo ambos caminos vigentes**:
- **Efectivo / fuera de pasarela:** sigue por el panel de Secretaría/Tesorería/Dirección con "Acreditar pago manual".
- **Online con MercadoPago:** automático vía redirección + webhook.

## Decisión

Se integra MercadoPago **únicamente detrás del puerto `PasarelaDePago`** siguiendo la arquitectura hexagonal del proyecto.

### Principios
- **Detrás del puerto:** Toda llamada al SDK/REST de MercadoPago vive en `packages/infrastructure/pasarela/mercadopago`. Ni route handlers ni casos de uso llaman directo a MP.
- **Dos caminos, mismo resultado:** Tanto el flujo manual como el de pasarela deben terminar acreditando el pago y llevando la Postulación a `VACANTE_CONFIRMADA` respetando las reglas de cupos. No se saltean validaciones del dominio.
- **Idempotencia:** El webhook de MP puede llegar múltiples veces. Se debe identificar por `payment_id` de MercadoPago y por `webhook_event_id`. Si ya fue procesado y acreditado, se responde `200 OK` sin volver a tocar cupos.
- **Verificación obligatoria:** El webhook **no** se acredita con solo `status` desde query params. Se valida por firma (`x-signature`/`x-request-id`) o consultando `GET /v1/payments/:id` con el `MP_ACCESS_TOKEN`. Nunca confiar únicamente en los `back_urls`.
- **Feature flag:** Se agrega `PAGOS_PASARELA` (`off` | `mercadopago`). Permite desactivar el botón/flujo sin tocar código.
- **No romper lo existente:** Se conserva `IniciarPagoUseCase`, `AcreditarPagoManualUseCase`, puertos, migraciones y rutas actuales. Se agrega un camino paralelo.
- **Webhook sin sesión:** `POST /api/pagos/webhook/mercadopago` no requiere sesión de usuario. Se protege con verificación de webhook + idempotencia.
- **Rutas autenticadas para iniciar:** `POST /api/pagos/iniciar` requiere sesión, pertenencia a la Postulación y validaciones de período/cupos vigentes.

## Diseño

### Dominio
- Agregar `MERCADOPAGO` al enum `proveedor_pago`.
- Reutilizar `Pago`, `Monto`, `ReferenciaDePago` y la máquina de estados de `Postulacion`. No se modifican las reglas de transición.

### Aplicación
Se crea el puerto `PasarelaDePago`:

```ts
interface PasarelaDePago {
  crearPreferencia(preferencia: PreferenciaPago): Promise<PreferenciaCreada>
  obtenerPago(paymentId: string): Promise<DatosPagoMP>
}
```

Casos de uso:
- `IniciarPagoConPasarelaUseCase`: crea/obtiene `intencion_de_pago` PENDIENTE, crea preferencia en MP y devuelve `init_point`.
- `ProcesarWebhookMercadoPagoUseCase`: procesa notificación, consulta el pago a MP si es necesario, es idempotente, crea/actualiza registro en `pagos` con `proveedor = 'MERCADOPAGO'` y `estado = 'ACREDITADO'` cuando corresponda.

### Infraestructura
`packages/infrastructure/pasarela/mercadopago/mercadopago-adapter.ts` implementa el puerto. Usa `fetch` contra la API REST de MercadoPago. Mapeo de estados MP -> nuestro modelo.

### Web
- `apps/web/app/api/pagos/iniciar/route.ts` (autenticado)
- `apps/web/app/api/pagos/webhook/mercadopago/route.ts` (público, verificado)
- `apps/web/app/pagos/retorno/page.tsx` (UX, sin acreditar)
- Schemas Zod en `apps/web/http/esquemas/pagos.ts`

### Persistencia
Nueva tabla `public.intenciones_de_pago` para rastrear la intención, `preference_id`, `payment_id_mp`, `webhook_event_id` y estado. Índices únicos para garantizar idempotencia. RLS acorde a aspirante/personal.

## Consecuencias

### Positivas
- Permite cobrar online sin intervención manual.
- Se mantiene el flujo de efectivo/manual intacto.
- Todo aislado detrás de puerto y feature flag.
- Trazabilidad completa (intención + pago + webhook).
- Fácil de desactivar o reemplazar por otra pasarela en el futuro.

### Negativas
- Agrega complejidad (webhook, idempotencia, verificación).
- Requiere exponer un endpoint público para webhook.
- Necesita configuración de ngrok/túnel para probar en local con webhooks reales.

### Riesgos
- **Doble acreditación:** Mitigado con `UNIQUE(payment_id_mp)`, `UNIQUE(webhook_event_id)`, chequeo previo y transacciones/guards.
- **Confiar en query params:** Mitigado con verificación + consulta directa a la API de MP.
- **Falsa acreditación:** Solo se acredita cuando `status === 'approved'` tras validación.
- **Cupos:** Se respeta el mismo control que `AcreditarPagoManualUseCase` / reglas de dominio.

## Cumplimiento

- Respeta "Las dependencias apuntan siempre hacia `domain`".
- Puerto definido en `application`, implementado en `infrastructure`.
- Zod solo en bordes (`apps/web`).
- Sin reglas de negocio en route handlers.
- Secrets fuera de código.
- Feature flag para poder correr ambos modos.
