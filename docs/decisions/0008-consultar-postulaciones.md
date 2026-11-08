# 0008 - Consultar Postulaciones: filtros, vencimiento perezoso y concurrencia

## Estado

Aceptado (2026-10-22, acordado por el equipo)

## Contexto

`contracts/puertos.md` (spec 001) define el puerto de Postulaciones con métodos por caso de uso:
`buscarPendientesPorDni(dni, periodoId)` (solo `PAGO_PENDIENTE` o `VENCIDO`) y `listarPorAspirante(aspiranteId)`. Al
implementar la US2 aparecieron tres necesidades que ese contrato no cubre:

1. **Buscar por DNI cualquier estado.** La Secretaría busca por DNI para ver el historial completo de una persona
   (una Postulación ya confirmada, una observada), no solo las que están pendientes de pago. Un método que filtra
   por estado obliga a la UI a encadenar llamadas y a repetir la regla de qué estados mirar.
2. **`VENCIDO` no es una columna que alguien escriba.** La máquina lo deriva de `vence_el` con `estadoEn(ahora)`. Pero
   el trigger guardián de la base solo permite `VENCIDO -> PAGO_PENDIENTE` para un reintento, así que antes de
   reintentar hay que **persistir** el `VENCIDO` derivado. No existía una transición para eso.
3. **Las transiciones que tocan cupos todavía no se pueden escribir.** `VACANTE_CONFIRMADA` y `PAGO_EN_REVISION`
   necesitan contar y ocupar cupos de forma atómica: van por las RPC `acreditar_pago` (US1) y
   `decidir_pago_excepcional` (US5), que todavía no existen. `guardarTransicion` no puede usarse para ellas.

Además, la spec pedía "un fake por puerto" con una factory simple, y los tests de contrato no podían armar estados
como `PAGO_EN_REVISION` (la máquina no deja llegar ahí sin pasar por las RPC).

## Decisión

- **Consulta con filtros.** `RepositorioDePostulaciones` expone `listar(filtros)` (`aspiranteId`, `periodoId`,
  `estado`, `motivoRevision`, todos opcionales) y `buscarPorDni(dni, periodoId?)`, que devuelve las Postulaciones de
  ese aspirante **en cualquier estado**. `listar` ordena por `numero` ascendente.
- **Vencimiento en dos pasos.** `Postulacion.estadoEn(ahora)` sigue siendo la verdad para leer (deriva `VENCIDO` con
  `ahora > venceEl`; `PAGO_EN_REVISION` no vence). `Postulacion.vencer(ahora)` es la única transición que permite
  escribir el `VENCIDO` derivado, y solo si el plazo ya pasó. `IniciarPago` la usa antes del reintento.
- **`guardarTransicion` es concurrencia optimista a nivel de fila** (`UPDATE ... WHERE id = ? AND estado = ?`) y se
  reserva para las transiciones que **no** tocan cupos: `iniciarPago` y la persistencia de `VENCIDO`. Las que tocan
  cupos van por RPC; el adaptador no las intenta.
- **La autorización vive en el caso de uso**, no en la ruta ni en el adaptador. `CrearPostulacion` e `IniciarPago`
  exigen `ASPIRANTE` y que la Postulación sea propia; `ConsultarPostulacion` deja leer la propia o cualquiera al
  personal (`ROLES_DEL_PERSONAL`). RLS sigue siendo la segunda barrera.
- **Los contratos reciben un "entorno", no una factory.** `EntornoDePostulaciones` / `EntornoDePeriodos` exponen
  `crearAspirante`, `crearPeriodo` y `sembrarPostulacion`, para armar los estados que la máquina no deja alcanzar.
  El adaptador de Supabase siembra con la clave de servicio; el contrato verifica el mapeo y las restricciones de la
  base, no RLS (eso lo cubren las migraciones y el smoke manual).

## Alternativas descartadas

- **Mantener `buscarPendientesPorDni` y agregar `buscarTodasPorDni`**: dos métodos casi iguales y la regla de qué
  estados ve la Secretaría repartida entre la UI y el repositorio.
- **Derivar `VENCIDO` solo al leer, sin persistirlo**: el trigger de la base rechaza `PAGO_PENDIENTE ->
  PAGO_PENDIENTE`, así que el reintento desde una Postulación vencida fallaría siempre.
- **Usar `guardarTransicion` para confirmar la vacante**: dos requests en paralelo podrían superar el total de cupos
  (FR-005). La ocupación se decide en una transacción en la base, no en el caso de uso.
- **Autorizar en la ruta con `ROLES_DEL_PERSONAL`**: la regla "la propia o el personal" es de negocio y quedaría
  duplicada en cada handler. La constitución (Principio VII) la ubica en los casos de uso.
- **Un fake con factory sin entorno**: no permite sembrar `PAGO_EN_REVISION` ni `VACANTE_CONFIRMADA` sin duplicar la
  lógica de las RPC en el propio fake.

## Consecuencias

- ✅ La Secretaría busca un DNI sin saber de estados y ve el historial completo.
- ✅ El reintento desde `VENCIDO` funciona con el trigger tal como está y el plazo se recalcula.
- ✅ Los tests de contrato cubren el fake y el adaptador con los mismos casos, incluidos los estados inalcanzables.
- ⚠️ Cambia el puerto que fija `contracts/puertos.md`: el PR necesita doble aprobación (constitución, flujo de
  desarrollo) y la spec queda desalineada hasta que se actualice.
- ⚠️ `vencer()` es una transición más de la máquina; hay que mantenerla en `TRANSICIONES` y en los tests del dominio.
- ⚠️ La concurrencia real (último cupo en paralelo, conflicto entre dos `guardarTransicion`) no se puede probar sin
  base; queda para los tests de integración cuando exista el entorno de Supabase de prueba.

## Cuándo re-evaluar

Cuando existan las RPC de US1 y US5: si la acreditación pasa a ser la única forma de escribir `VACANTE_CONFIRMADA`,
conviene mover también el conteo de cupos a la base y revisar si `listar` necesita paginación.
