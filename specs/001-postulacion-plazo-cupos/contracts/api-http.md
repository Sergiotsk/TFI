# Contrato: API HTTP de `apps/web` (adaptador de entrada)

Los route handlers son **delgados**: validan con Zod (Principio IV), arman el actor desde la sesión, llaman **un**
caso de uso y mapean el resultado a HTTP. No llaman repositorios directamente: hoy
`app/api/procedure/route.ts` lo hace, y además permite fijar `state` desde el body, lo que saltea la máquina de
estados. Se reemplaza.

Respuesta uniforme: `{ success: true, data }` o `{ success: false, error: { codigo, mensaje } }`, igual que las rutas
actuales, con el error tipado.

| Método y ruta | Caso de uso | Rol | Errores del dominio → HTTP |
|---|---|---|---|
| `POST /api/postulaciones` `{ periodoId }` | `CrearPostulacion` | `ASPIRANTE` | `PeriodoCerrado` → 409 |
| `GET /api/postulaciones/mias` | `ConsultarPostulacion` | `ASPIRANTE` | — |
| `GET /api/postulaciones/:id` | `ConsultarPostulacion` | la propia o el personal | `NoAutorizado` → 403 |
| `POST /api/postulaciones/:id/iniciar-pago` | `IniciarPago` | `ASPIRANTE` | `TransicionInvalida` → 409, `SinCuposParaIniciar` → 409 |
| `GET /api/periodos` | `ListarPeriodosAbiertos` | cualquier usuario autenticado | — |
| `POST /api/periodos` / `PATCH /api/periodos/:id` | `CrearPeriodo` / `ModificarPeriodo` | `SECRETARIA`, `DIRECCION` | `CuposPorDebajoDeConfirmadas` → 409 |
| `GET /api/periodos/:id/ocupacion` | `ConsultarOcupacion` | el personal | — |
| `GET /api/documentos?postulacionId=&estado=&tipo=&pagina=&porPagina=` | `ListarDocumentos` | personal de la institución; el aspirante solo los propios | `NoAutorizado` → 403 |
| `POST /api/documentos` (`multipart/form-data`: `postulacionId`, `tipo`, `vigencia?`, `archivo`) | `SubirDocumento` | el aspirante dueño o `SECRETARIA` / `DIRECCION` | `SolicitudInvalida` → 400, `NoAutorizado` → 403, `ConflictoDeEstado` → 409 |
| `GET /api/documentos/:id` | `ConsultarDocumento` | el dueño o `SECRETARIA` / `DIRECCION` de su institución | `NoAutorizado` → 403, `NoEncontrado` → 404 |
| `GET /api/documentos/:id/url` | `ConsultarDocumento` | el dueño o `SECRETARIA` / `DIRECCION` de su institución | `NoAutorizado` → 403, `NoEncontrado` → 404 |
| `PATCH /api/documentos/:id` `{ estado, observaciones? }` o `{ tipo?, vigencia?, nombreArchivo? }` | `RevisarDocumento` / `ActualizarDocumento` | `SECRETARIA`, `DIRECCION` | `ConflictoDeEstado` → 409 |
| `DELETE /api/documentos/:id` | `EliminarDocumento` | el aspirante dueño o `SECRETARIA` / `DIRECCION` | `ConflictoDeEstado` → 409 |
| `POST /api/perfiles/:id/contrasena` | `RestablecerContrasena` | `SECRETARIA`, `DIRECCION` (Dirección también a sus pares) | `NoAutorizado` → 403, `NoEncontrado` → 404 |
| `POST /api/auth/recuperar-contrasena` `{ email }` | `SolicitarRecuperacionDeContrasena` | público (no revela si el email existe) | `ENVIO_FALLIDO` → 503 |
| `GET /auth/confirmar?code=` o `?token_hash=&type=&destino=` | `ConfirmarEnlaceDeEmail` | público (canjea el enlace del email) | redirige a `/login?error=enlace` o `/recuperar-contrasena?error=enlace` |
| `POST /api/auth/cambiar-contrasena` `{ contrasena, confirmacion }` | `CambiarContrasena` | con sesión (solo la cuenta propia) | `NoAutorizado` → 401, `SolicitudInvalida` → 400 |
| `POST /api/pagos/acreditaciones` `{ pagos: PagoInformado[] }` | `ImportarInformeDePagos` | `TESORERIA` | — (el resumen informa por fila) |
| `GET /api/pagos?estado=A_DECIDIR\|NO_IMPUTADO\|DEVUELTO` | `ListarBandeja` | según el estado (ver puertos.md) | `NoAutorizado` → 403 |
| `POST /api/pagos/:id/decision` `{ decision, comentario? }` | `DecidirPagoExcepcional` | `DIRECCION` | `conflicto` → 409 |

`ConsultarPostulacion` devuelve el estado **efectivo** (perezoso), `vence_el`, el número formateado y, si el estado
es `PAGO_PENDIENTE`, el aviso "tu lugar no está reservado hasta que se acredite el pago" (FR-007). Si el estado es
`PAGO_EN_REVISION`, devuelve "tu pago está en revisión".

`GET /api/documentos/:id` devuelve el documento con una URL firmada de **60 segundos**. El archivo vive en el
bucket privado `documentos`; la fila de `public.documentos` guarda solo la ruta y los metadatos. La autorización se
valida en el caso de uso antes de firmar la URL (ADR 0010). `GET /api/documentos/:id/url` devuelve solo
`{ documentoId, urlFirmada, expiraEnSegundos }` para refrescar el enlace sin volver a traer los metadatos; usa el
mismo caso de uso y por eso el permiso es idéntico. Tesorería y cualquier otro aspirante reciben 403.

`POST /api/perfiles/:id/contrasena` es la recuperación asistida: deja la contraseña de la cuenta en la inicial
(`nombre` + `dni`, sin acentos, espacios ni puntos) y devuelve `{ perfilId, contrasenaTemporal }` para dictarla. No
pide la contraseña anterior ni envía email, y necesita la service role key de Supabase Auth. Una `SECRETARIA` no
puede restablecer la contraseña de `DIRECCION` ni de otra `SECRETARIA`: solo `DIRECCION` lo hace.

La recuperación por email es el camino que usa la persona sin pasar por la mesa de entrada:
`POST /api/auth/recuperar-contrasena` manda un enlace de Supabase Auth (SMTP del proyecto, por ejemplo Resend) y
responde **siempre** lo mismo, exista o no la cuenta, para no filtrar qué emails están registrados. El enlace vuelve
a `GET /auth/confirmar` con `?code=` (flujo PKCE de `@supabase/ssr`) o con `?token_hash=&type=` si la plantilla del
email usa `{{ .TokenHash }}`; el endpoint canjea el enlace por una sesión y redirige a `/recuperar-contrasena/nueva`
(cuando `destino=recuperar`) o a `/panel`. Ahí `POST /api/auth/cambiar-contrasena` recibe la contraseña dos veces y
la cambia en la cuenta de la sesión: nunca acepta un email ni un id, así que no puede tocar otra cuenta. La misma
pantalla sirve para que alguien con sesión abierta cambie su contraseña, y al terminar cierra las demás sesiones de
esa cuenta.

`POST /api/pagos/acreditaciones` recibe filas ya parseadas (JSON). El adaptador que lee el archivo de SysAdmin queda
fuera de esta feature (research R9). Cuando llegue el formato, ese adaptador produce `PagoInformado[]` y llama al
mismo caso de uso.

Se eliminan `app/api/procedure/**` y `app/api/document/**` (reemplazado por `app/api/documentos/**`). `app/api/users/**`
pasó a `app/api/perfiles/**`.
