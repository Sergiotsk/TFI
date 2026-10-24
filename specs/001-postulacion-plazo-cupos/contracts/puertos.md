# Contrato: puertos de `packages/application`

Cada puerto tiene (a) un fake en memoria (`fake.ts`) y (b) una suite de contrato (`contrato.ts`), que corre contra
el fake y contra el adaptador de Supabase (Principio III, research R4). Las firmas son el **contrato**; los nombres
exactos de los archivos se fijan en `tasks.md`.

Convenciones: los métodos son `async`. Los resultados esperables (conflicto, duplicado) se devuelven como valores
de una unión discriminada, no como excepciones. Las excepciones quedan para los errores inesperados.

## Reloj

```ts
interface Reloj { ahora(): Date }
```

Fake: `RelojFijo` con `avanzar(ms)`. Real: `RelojDeSistema` en `packages/infrastructure/reloj/`.

**Casos de contrato** (corren contra `RelojFijo` y `RelojDeSistema`): `ahora()` devuelve un `Date` válido; dos
llamadas seguidas no retroceden. Solo para el fake: `avanzar(ms)` mueve `ahora()` exactamente `ms`.

## RepositorioDePostulaciones (reemplaza a `RepositorioDeProcedure`)

```ts
interface RepositorioDePostulaciones {
  obtenerPorId(id: string): Promise<Postulacion | null>
  obtenerPorNumero(numero: NumeroDePostulacion): Promise<Postulacion | null>
  buscarPendientesPorDni(dni: Dni, periodoId: string): Promise<Postulacion[]>   // PAGO_PENDIENTE o VENCIDO
  listarPorAspirante(aspiranteId: string): Promise<Postulacion[]>
  crear(aspiranteId: string, periodoId: string): Promise<Postulacion>           // asigna id y numero
  guardarTransicion(antes: Postulacion, despues: Postulacion): Promise<'ok' | 'conflicto'>
}
```

`guardarTransicion` es concurrencia optimista a nivel de fila: escribe solo si el estado persistido sigue siendo
`antes.estado`. Se usa para las transiciones que **no** tocan cupos (`iniciarPago` y la persistencia de
`VENCIDO`). Las que tocan cupos van por `RegistroDePagos`.

**Casos de contrato**:
- `crear` asigna un `numero` único y creciente, y el estado `PREINSCRIPTO`.
- `crear` dos veces para el mismo aspirante y período, con la primera activa, falla (índice único parcial).
- `guardarTransicion` con un `antes` desactualizado devuelve `conflicto` y no escribe.
- `buscarPendientesPorDni` no devuelve postulaciones de otro período ni en otros estados.

## RepositorioDePeriodos

```ts
interface RepositorioDePeriodos {
  obtenerPorId(id: string): Promise<PeriodoDeIngreso | null>
  listarAbiertos(institucionId: string, ahora: Date): Promise<PeriodoDeIngreso[]>
  contarOcupados(periodoId: string): Promise<number>
  contarPendientesVigentes(periodoId: string, ahora: Date): Promise<number>
  guardar(periodo: PeriodoDeIngreso): Promise<void>
}
```

**Casos de contrato**:
- `contarOcupados` cuenta `VACANTE_CONFIRMADA` y los estados posteriores, y no cuenta `PAGO_PENDIENTE`,
  `PAGO_EN_REVISION` ni `VENCIDO`.
- `contarPendientesVigentes` excluye las pendientes con `vence_el < ahora` (vencimiento perezoso).

## RepositorioDeDocumentos

```ts
interface FiltrosDeDocumento {
  postulacionId?: string
  estado?: EstadoDocumento
  tipo?: TipoDeDocumento
}

interface RepositorioDeDocumentos {
  listar(filtros: FiltrosDeDocumento, paginacion: Paginacion): Promise<Pagina<Documento>>
  obtenerPorId(id: string): Promise<Documento | null>
  obtenerPorPostulacion(postulacionId: string): Promise<Documento[]>
  guardar(documento: Documento): Promise<void>
  eliminar(id: string): Promise<void>
}
```

**Casos de contrato**:
- `guardar` y `obtenerPorId` devuelven los mismos metadatos (ruta, nombre, MIME, tamaño, vigencia y estado).
- `obtenerPorId` de un id inexistente devuelve `null`.
- `obtenerPorPostulacion` solo devuelve los documentos de esa Postulación.
- `listar` filtra por Postulación, estado y tipo, y respeta el paginado.
- `eliminar` borra la fila y deja de aparecer en las consultas.

## AlmacenDeArchivos

```ts
interface ArchivoParaSubir {
  contenido: ArrayBuffer
  nombreArchivo: string
  mimeType: string
}

interface AlmacenDeArchivos {
  subir(ruta: string, archivo: ArchivoParaSubir): Promise<void>
  eliminar(ruta: string): Promise<void>
  urlFirmada(ruta: string, segundos: number): Promise<string>
}
```

**Casos de contrato**:
- `subir` guarda el archivo y `urlFirmada` devuelve una URL temporal.
- `eliminar` borra el archivo y luego `urlFirmada` falla.
- `urlFirmada` falla si el archivo nunca se subió.

## AccionesDeDocumentacion

```ts
type ResultadoDeDocumentacion =
  | 'OK'
  | 'CONFLICTO'
  | 'NO_ENCONTRADA'
  | 'NO_AUTORIZADO'
  | 'TRANSICION_INVALIDA'

interface AccionesDeDocumentacion {
  transicionar(postulacionId: string, hacia: EstadoPostulacion): Promise<ResultadoDeDocumentacion>
}
```

**Casos de contrato**:
- `ESPERANDO_DOCUMENTACION` pasa a `DOCUMENTACION_EN_REVISION`.
- Desde `DOCUMENTACION_EN_REVISION` se puede pasar a `OBSERVADO` o a `DOCUMENTACION_VALIDADA`.
- Una transición fuera del grafo devuelve `TRANSICION_INVALIDA` y no cambia el estado.
- Una Postulación inexistente devuelve `NO_ENCONTRADA`.

## RegistroDePagos

```ts
type DecisionDeAcreditacion =
  | { tipo: 'CONFIRMAR'; postulacionId: string; estadoEsperado: 'PAGO_PENDIENTE' | 'VENCIDO' }
  | { tipo: 'REVISION'; postulacionId: string; estadoEsperado: 'PAGO_PENDIENTE' | 'VENCIDO'; motivo: MotivoRevision }
  | { tipo: 'NO_IMPUTAR'; motivo: MotivoNoImputado; postulacionId?: string }

type ResultadoDeAcreditacion =
  | { tipo: 'REGISTRADO'; pago: Pago }
  | { tipo: 'DUPLICADO'; pagoExistente: Pago }
  | { tipo: 'CONFLICTO' }   // una precondición ya no vale: releer y volver a decidir

interface RegistroDePagos {
  registrarAcreditacion(pago: PagoInformado, decision: DecisionDeAcreditacion, cargaId?: string)
    : Promise<ResultadoDeAcreditacion>
  existe(referencia: ReferenciaDePago): Promise<Pago | null>
  listarPorEstado(institucionId: string, estado: EstadoPago): Promise<Pago[]>
  registrarDecision(pagoId: string, decision: 'ACEPTAR' | 'RECHAZAR', decididaPor: string, comentario?: string)
    : Promise<{ tipo: 'REGISTRADA'; pago: Pago } | { tipo: 'CONFLICTO' }>
}
```

`estadoEsperado` es el estado **persistido** de la Postulación (el que leyó el repositorio), **no** el efectivo
calculado con `estadoEn(ahora)`. La RPC compara contra lo que está en la base: si recibiera el estado efectivo, una
Postulación vencida pero todavía guardada como `PAGO_PENDIENTE` daría `CONFLICTO` en todos los reintentos.
`CONFIRMAR` con `estadoEsperado: 'VENCIDO'` solo corresponde cuando `pagadoEl <= venceEl` (la regla 6 de
data-model.md).

**Casos de contrato** (los críticos):
- **Estado persistido vs. efectivo**: Postulación con `vence_el` pasado pero persistida como `PAGO_PENDIENTE`;
  `REVISION` con `estadoEsperado: 'PAGO_PENDIENTE'` da `REGISTRADO`, no `CONFLICTO`.
- **Confirmar desde `VENCIDO`**: Postulación persistida como `VENCIDO` y pago con `pagadoEl <= venceEl`;
  `CONFIRMAR` con `estadoEsperado: 'VENCIDO'` da `REGISTRADO` y la deja `VACANTE_CONFIRMADA`.
- **Último cupo en paralelo**: período con 1 cupo libre y dos postulaciones pendientes. Dos
  `registrarAcreditacion(CONFIRMAR)` en `Promise.all`. Exactamente una devuelve `REGISTRADO` y la otra
  `CONFLICTO`, y `contarOcupados` da el total.
- **Idempotencia**: la misma `ReferenciaDePago` dos veces. La segunda devuelve `DUPLICADO` y no hay efectos.
- **Duplicado en paralelo**: la misma referencia en `Promise.all`. Una sola fila.
- **Precondición de estado**: `CONFIRMAR` sobre una Postulación que ya no está `PAGO_PENDIENTE` devuelve
  `CONFLICTO`.
- `REVISION` deja la Postulación en `PAGO_EN_REVISION` con el motivo, y el pago en `A_DECIDIR`.
- `NO_IMPUTAR` no modifica ninguna Postulación.
- `registrarDecision(ACEPTAR)` con `SIN_CUPO` confirma aunque `ocupados >= total`.
- `registrarDecision(RECHAZAR)` deja la Postulación en `VENCIDO` y el pago en `DEVUELTO`.
- `registrarDecision` dos veces sobre el mismo pago: la segunda devuelve `CONFLICTO`.
- `registrarDecision` en paralelo sobre el mismo pago: una sola devuelve `REGISTRADA`.

## RegistroDeCargas

```ts
interface RegistroDeCargas {
  iniciar(institucionId: string, cargadaPor: string, nombreArchivo: string): Promise<CargaDeInforme>
  cerrar(cargaId: string, resumen: ResumenDeCarga): Promise<void>
  listar(institucionId: string): Promise<CargaDeInforme[]>
}
```

**Casos de contrato**: `cerrar` persiste el resumen; `listar` ordena de la más reciente a la más vieja y no
mezcla instituciones.

## Casos de uso (consumen los puertos)

| Caso de uso | Rol (verificado en el caso de uso, FR-008) | Puertos |
|---|---|---|
| `CrearPostulacion` | `ASPIRANTE` (la propia) | Postulaciones, Periodos, Reloj |
| `IniciarPago` | `ASPIRANTE` (la propia) | Postulaciones, Periodos, Reloj |
| `ConsultarPostulacion` | `ASPIRANTE` (la propia) o el personal | Postulaciones, Periodos, Reloj |
| `AcreditarPago` | `TESORERIA` o el sistema (webhook de Pagos360) | Postulaciones, Periodos, Pagos, Reloj |
| `ImportarInformeDePagos` | `TESORERIA` | Cargas y `AcreditarPago` por fila |
| `CrearPeriodo` / `ModificarPeriodo` | `SECRETARIA`, `DIRECCION` | Periodos |
| `ListarPeriodosAbiertos` | cualquier usuario autenticado (de su institución) | Periodos, Reloj |
| `ConsultarOcupacion` | el personal | Periodos, Reloj |
| `ListarBandeja(estado)` | `A_DECIDIR`: `DIRECCION`; `NO_IMPUTADO` y `DEVUELTO`: `TESORERIA` y `SECRETARIA` (lectura) | Pagos |
| `DecidirPagoExcepcional` | `DIRECCION` | Pagos |
| `SubirDocumento` | `ASPIRANTE` (la propia) o `SECRETARIA` / `DIRECCION` (su institución) | Documentos, Almacén, Acciones, Postulaciones, Periodos, Reloj, Ids |
| `ListarDocumentos` / `ConsultarDocumento` | personal de la institución; el aspirante solo los propios | Documentos, Almacén, Postulaciones, Periodos |
| `RevisarDocumento` / `ActualizarDocumento` | `SECRETARIA` o `DIRECCION` | Documentos, Acciones, Postulaciones, Periodos, Reloj |
| `EliminarDocumento` | el aspirante dueño o `SECRETARIA` / `DIRECCION` | Documentos, Almacén, Postulaciones, Periodos |

`AcreditarPago` reintenta hasta 3 veces ante un `CONFLICTO` (research R2). Si se agotan los intentos, falla con un
error inesperado y el informe marca esa fila para reprocesar (la idempotencia hace seguro el reproceso).
