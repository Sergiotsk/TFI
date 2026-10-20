# 0005 - Los pagos excepcionales los decide Dirección, caso por caso

## Estado

Aceptado (2026-10-20, acordado por el equipo)

## Contexto

La regla central del negocio (constitución, Principio II) es **pago acreditado = vacante confirmada**, y el
Director definió que el pago acreditado es **la única reserva de matrícula**: mientras el aspirante está en
`PAGO_PENDIENTE` no retiene ningún cupo. Cada aspirante tiene un plazo propio para pagar, para que nadie crea que
tiene un lugar reservado sin haber abonado.

Esa combinación hace inevitables dos casos:

- **Sin cupo**: el aspirante paga dentro del plazo, pero el período ya completó sus vacantes. Pasa porque nada se
  retiene y porque Tesorería carga el informe de pagos una vez por día, así que varios pagos del mismo día se
  enteran juntos de que no hay lugar.
- **Fuera de plazo**: el aspirante paga **después** de su vencimiento.

El Principio II exige que *"cualquier excepción a esta regla requiere un ADR aprobado"*, y la constitución deja
abierto el `TODO(EXCEPCIONES_VACANTE)`. Si el sistema decidiera solo, o rompería la regla (rechaza un pago
acreditado) o sobrevendería el cupo sin que nadie lo autorice.

## Decisión

- El sistema **no decide** las excepciones: las **detecta y las frena**. El pago queda `A_DECIDIR` con su motivo
  (`SIN_CUPO` o `FUERA_DE_PLAZO`) y la Postulación pasa a un estado nuevo, **`PAGO_EN_REVISION`**, que **no vence**.
- El caso aparece en el **panel de Dirección**. El Director decide caso por caso:
  - **Aceptar**: la vacante se confirma aunque exceda el cupo, y el pago queda `ACREDITADO`.
  - **Rechazar**: la Postulación vuelve a `VENCIDO` y el pago queda `DEVUELTO`, para que Tesorería reintegre la
    matrícula (la devolución de la plata ocurre fuera del sistema).
- Cada decisión registra **quién, cuándo y qué**. Toda vacante que exceda el cupo tiene detrás una decisión de
  Dirección.
- El plazo se evalúa con la **fecha de pago** que trae el informe o Pagos360, no con la fecha en que se carga. Un
  aspirante que pagó el último día y se informó al día siguiente **no** es un caso excepcional: se confirma.
- La notificación es un aviso en el panel, no un mail (los mails automáticos están fuera del MVP, Principio VI).

Este ADR aprueba el **mecanismo**, no cada caso: cada aceptación o rechazo es una decisión operativa de Dirección.

Detalle: [spec 001, User Story 5](../../specs/001-postulacion-plazo-cupos/spec.md) y
[modelo de datos](../../specs/001-postulacion-plazo-cupos/data-model.md).

## Alternativas descartadas

- **Rechazar siempre** los pagos excepcionales y devolver la plata: es simple, pero viola el Principio II y
  castiga al aspirante por una carrera contra un informe diario.
- **Aceptar siempre** excediendo el cupo: sobrevende sin que nadie lo autorice.
- **Lista de espera automática**: suma reglas (orden, liberación de lugares) que nadie pidió. Es complejidad
  fuera del MVP.
- **Reservar el cupo durante el plazo**: es el modelo del PR 76, descartado por el Director (el pago acreditado
  es la única reserva).
- **Sin estado nuevo**, con una regla escondida en el vencimiento ("si tiene un pago esperando, no vence"): no
  modifica la máquina de estados, pero es implícita y el aspirante seguiría viendo "pendiente" en lugar de "en
  revisión".

## Consecuencias

- ✅ La regla del Director se respeta sin excepciones silenciosas: ningún pago se acredita ni se pierde solo.
- ✅ El aspirante ve "tu pago está en revisión" y no "vencido" mientras se decide.
- ✅ Resuelve el `TODO(EXCEPCIONES_VACANTE)`. La constitución se actualiza en un PR aparte (enmienda PATCH) para
  quitar el TODO y referenciar este ADR.
- ⚠️ Modifica la máquina de estados del dominio (`PAGO_EN_REVISION` y la transición
  `VENCIDO → VACANTE_CONFIRMADA`): los PRs de código que lo implementen requieren doble aprobación (constitución), y hay que actualizar el diagrama de
  `docs/architecture/overview.md`.
- ⚠️ La ocupación de un período puede superar el total ("52 / 50"). Los reportes tienen que mostrarlo, no
  esconderlo.
- ⚠️ Dirección tiene una tarea nueva, aunque acotada: solo ve los casos excepcionales, no todos los pagos.

## Cuándo re-evaluar

Si el volumen de casos excepcionales por ciclo hace que el panel sea una carga, o si el Director define una regla
general (por ejemplo, "siempre aceptar hasta un 5 % de exceso").
