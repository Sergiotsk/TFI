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
| `POST /api/pagos/acreditaciones` `{ pagos: PagoInformado[] }` | `ImportarInformeDePagos` | `TESORERIA` | — (el resumen informa por fila) |
| `GET /api/pagos?estado=A_DECIDIR\|NO_IMPUTADO\|DEVUELTO` | `ListarBandeja` | según el estado (ver puertos.md) | `NoAutorizado` → 403 |
| `POST /api/pagos/:id/decision` `{ decision, comentario? }` | `DecidirPagoExcepcional` | `DIRECCION` | `conflicto` → 409 |

`ConsultarPostulacion` devuelve el estado **efectivo** (perezoso), `vence_el`, el número formateado y, si el estado
es `PAGO_PENDIENTE`, el aviso "tu lugar no está reservado hasta que se acredite el pago" (FR-007). Si el estado es
`PAGO_EN_REVISION`, devuelve "tu pago está en revisión".

`POST /api/pagos/acreditaciones` recibe filas ya parseadas (JSON). El adaptador que lee el archivo de SysAdmin queda
fuera de esta feature (research R9). Cuando llegue el formato, ese adaptador produce `PagoInformado[]` y llama al
mismo caso de uso.

Se eliminan `app/api/procedure/**`. `app/api/document/**` y `app/api/users/**` se adaptan a los nombres nuevos sin
cambiar su comportamiento, porque no son parte de esta feature.
