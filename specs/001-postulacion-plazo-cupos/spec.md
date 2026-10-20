# Feature Specification: Postulación con plazo de pago y control de cupos

**Feature Branch**: `fix/db-postulacion-pago` (desde `develop-db`)

**Created**: 2026-10-20

**Status**: Draft (clarificaciones resueltas el 2026-10-20)

**Input**: Reemplazar el modelo de "reservas" del PR 76 por el ciclo de vida de la Postulación. Reglas del
Director: el pago acreditado es la única reserva de matrícula; cada aspirante tiene un plazo propio para pagar,
para que nadie crea que tiene un cupo reservado sin haber abonado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El pago acreditado confirma la vacante y consume el cupo (Priority: P1)

Un aspirante en `PAGO_PENDIENTE` paga la matrícula (en ventanilla o por Pagos360). Cuando el pago se acredita
(por el informe de pagos de SysAdmin que carga Tesorería, o por el aviso de Pagos360), su Postulación pasa a
`VACANTE_CONFIRMADA` y ocupa un cupo del período de ingreso.

**Why this priority**: es la regla central del negocio (Principio II). Sin esto no hay sistema.

**Independent Test**: se crea un período con N cupos y una Postulación en `PAGO_PENDIENTE`, se acredita un pago y
se verifica que la Postulación queda confirmada y que los cupos ocupados pasan a ser 1.

**Acceptance Scenarios**:

1. **Given** una Postulación en `PAGO_PENDIENTE` dentro de su plazo y un período con cupos libres, **When** se
   acredita su pago, **Then** pasa a `VACANTE_CONFIRMADA` y los cupos ocupados del período aumentan en 1.
2. **Given** un pago ya acreditado, **When** el mismo pago se informa otra vez (mismo proveedor y misma referencia
   externa, por ejemplo en un informe recargado), **Then** no se acredita de nuevo, no se ocupa otro cupo y la
   operación se informa como ya procesada, no como error.
3. **Given** una Postulación en `PREINSCRIPTO`, `VENCIDO` o `VACANTE_CONFIRMADA`, **When** se intenta acreditarle un
   pago, **Then** la transición se rechaza por inválida (ver Edge Cases sobre el pago tardío).

---

### User Story 2 - Cada aspirante tiene su propio plazo para pagar (Priority: P1)

Cuando un aspirante elige el medio de pago, su Postulación pasa a `PAGO_PENDIENTE` con una fecha de vencimiento
propia. El sistema le informa, de forma explícita, que su lugar **no está reservado** hasta que se acredite el
pago y hasta qué fecha tiene para pagar. Si el plazo pasa sin un pago acreditado, la Postulación se considera
`VENCIDO`.

**Why this priority**: el Director lo pidió para que nadie aparezca más tarde creyendo que tenía un cupo reservado.

**Independent Test**: con un reloj controlado, se lleva una Postulación a `PAGO_PENDIENTE`, se avanza el tiempo
más allá del plazo y se verifica que se informa como `VENCIDO` sin que cambie la ocupación de cupos.

**Acceptance Scenarios**:

1. **Given** una Postulación en `PREINSCRIPTO`, **When** el aspirante elige el medio de pago, **Then** pasa a
   `PAGO_PENDIENTE` con un vencimiento igual a la fecha actual más el plazo configurado.
2. **Given** una Postulación en `PAGO_PENDIENTE`, **When** se consulta después de su vencimiento sin un pago
   acreditado, **Then** se informa como `VENCIDO` (vencimiento perezoso: no hace falta un proceso periódico).
3. **Given** una Postulación que vence, **When** se consultan los cupos del período, **Then** la ocupación no
   cambia, porque nunca se retuvo un cupo.
4. **Given** una Postulación `VENCIDO`, **When** el aspirante quiere volver a intentarlo, **Then** puede volver a
   `PAGO_PENDIENTE` con un plazo nuevo, si el período sigue abierto y con cupos libres.
5. **Given** un aspirante en `PAGO_PENDIENTE`, **When** ve el estado de su Postulación, **Then** ve la fecha de
   vencimiento y un aviso de que el lugar no está reservado.

---

### User Story 3 - Secretaría define períodos de ingreso con cupos y ve la ocupación (Priority: P2)

Secretaría TUP (o el Director) da de alta un período de ingreso (por ejemplo, "Primer cuatrimestre 2027") con un
total de cupos, y en cualquier momento ve cuántos están ocupados (vacantes confirmadas), cuántos aspirantes hay en
`PAGO_PENDIENTE` vigente y cuántos cupos quedan libres.

**Why this priority**: sin períodos no hay cupos que controlar, pero se pueden cargar a mano para la demo de P1.

**Independent Test**: se crea un período, se confirman K vacantes y se dejan M postulaciones pendientes; el resumen
muestra K ocupados, M pendientes y N − K libres.

**Acceptance Scenarios**:

1. **Given** un usuario con rol Secretaría TUP o Director, **When** crea un período con un total de cupos,
   **Then** queda disponible para que los aspirantes se postulen.
2. **Given** un período con vacantes confirmadas, **When** se intenta bajar el total por debajo de las ya
   confirmadas, **Then** se rechaza.
3. **Given** un usuario con rol Alumno, **When** intenta crear o modificar un período, **Then** se le niega.

---

### User Story 4 - Alta segura de usuarios dentro de una institución (Priority: P2)

Cuando una persona se registra, se crea su perfil con el rol `ASPIRANTE` y asociado a la institución. Nadie puede
asignarse un rol propio al registrarse. Las cuentas de personal (`SECRETARIA`, `DIRECCION`, `TESORERIA`) se crean
a mano o por seed.

**Why this priority**: hoy cualquiera puede registrarse como ADMIN (falla heredada del esquema inicial), y la
migración de instituciones del PR 76 rompe el registro.

**Independent Test**: se registra un usuario que envía un rol de administrador en sus datos; el perfil queda con
rol de aspirante y con la institución asignada.

**Acceptance Scenarios**:

1. **Given** un registro nuevo, **When** se crea el perfil, **Then** el rol es siempre el de aspirante, sin importar
   los datos enviados.
2. **Given** un registro nuevo, **When** se crea el perfil, **Then** queda asociado a la institución vigente y el
   registro no falla.

---

### User Story 5 - Dirección decide los pagos excepcionales desde su panel (Priority: P1)

Cuando llega un pago que el sistema no puede acreditar solo, porque se pagó **después del vencimiento** o porque
**ya no hay cupos** en el período, el sistema no decide. La Postulación pasa a `PAGO_EN_REVISION`, el pago queda
`A_DECIDIR` con su motivo, y el caso aparece en el panel de Dirección. El Director decide en el momento, caso por
caso: **aceptar** (la vacante se confirma, aunque eso exceda el cupo) o **rechazar** (la Postulación vuelve a
`VENCIDO` y el pago queda `DEVUELTO`, para que Tesorería reintegre la matrícula).

**Why this priority**: con un informe diario y sin reserva previa, estos casos van a ocurrir en cada ciclo. Si el
sistema decidiera solo, rompería la regla "pago acreditado = vacante" o sobrevendería el cupo sin que nadie lo
autorizara. Resuelve el TODO(EXCEPCIONES_VACANTE) de la constitución.

**Independent Test**: con un período sin cupos libres, se acredita un pago de una Postulación en `PAGO_PENDIENTE`,
se verifica que aparece en el panel de Dirección con el motivo `SIN_CUPO`, y que al aceptarlo la vacante queda
confirmada y la ocupación supera el total.

**Acceptance Scenarios**:

1. **Given** una Postulación en `PAGO_PENDIENTE` y un período sin cupos libres, **When** se acredita su pago dentro
   del plazo, **Then** la Postulación pasa a `PAGO_EN_REVISION`, el pago queda `A_DECIDIR` con el motivo `SIN_CUPO`
   y el caso aparece en el panel de Dirección.
2. **Given** una Postulación cuyo plazo venció, **When** llega un pago con fecha de pago posterior al vencimiento,
   **Then** pasa a `PAGO_EN_REVISION` y el pago queda `A_DECIDIR` con el motivo `FUERA_DE_PLAZO`.
3. **Given** una Postulación en `PAGO_EN_REVISION`, **When** pasa el tiempo, **Then** no vence (el aspirante pagó,
   y la demora es de la decisión, no suya).
4. **Given** un caso en el panel, **When** el Director lo acepta, **Then** la Postulación pasa a
   `VACANTE_CONFIRMADA`, el pago a `ACREDITADO` y queda registrado quién decidió, cuándo y por qué motivo.
5. **Given** un caso en el panel, **When** el Director lo rechaza, **Then** la Postulación pasa a `VENCIDO`, el pago
   a `DEVUELTO` y el caso aparece para Tesorería como devolución pendiente.
6. **Given** un usuario sin rol `DIRECCION`, **When** intenta aceptar o rechazar un caso, **Then** se le niega.
7. **Given** un aspirante en `PAGO_EN_REVISION`, **When** ve su Postulación, **Then** ve que su pago está en
   revisión (no "vencido" ni "pendiente").

---

### Edge Cases

- **Pagó dentro del plazo, pero se informó después.** Pagó el último día en ventanilla y el informe se carga al
  día siguiente. Lo que cuenta es la **fecha de pago** que trae el informe, no la fecha de carga (ver Assumptions).
- **Pago tardío**: un pago acreditado cuya fecha de pago es posterior al vencimiento de la Postulación. Lo decide
  Dirección caso por caso (User Story 5, motivo `FUERA_DE_PLAZO`).
- **Cupos completos al acreditar**: se acredita un pago válido dentro del plazo, pero el período ya tiene todas las
  vacantes confirmadas (sucede porque `PAGO_PENDIENTE` no retiene cupo y el informe es diario). Lo decide Dirección
  caso por caso (User Story 5, motivo `SIN_CUPO`).
- **Pago tardío Y sin cupo a la vez**: se registra el motivo `FUERA_DE_PLAZO` (el primero que se evalúa), y el
  panel muestra también la ocupación actual del período para que el Director decida con toda la información.
- **Dirección acepta varios casos `SIN_CUPO`**: cada aceptación excede el cupo en uno. La ocupación informada lo
  muestra (por ejemplo, "52 / 50"); no se bloquea, porque es una decisión explícita de Dirección.
- **Período sin cupos libres**: si las vacantes confirmadas llegan al total, no se aceptan nuevos ingresos a
  `PAGO_PENDIENTE`. Esto mitiga el caso anterior, pero no lo elimina.
- **Dos acreditaciones simultáneas** del último cupo (Pagos360 y el informe al mismo tiempo): solo una puede ocupar
  el último cupo. La otra cae en el caso "cupos completos".
- **Pago que no corresponde a ninguna Postulación** (referencia desconocida en el informe): no se acredita nada y
  queda informado para que Tesorería lo revise.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El ciclo de vida de la Postulación MUST seguir la máquina de estados del overview, ampliada con
  `PAGO_EN_REVISION` (`PREINSCRIPTO → PAGO_PENDIENTE → VACANTE_CONFIRMADA | VENCIDO`;
  `PAGO_PENDIENTE | VENCIDO → PAGO_EN_REVISION → VACANTE_CONFIRMADA | VENCIDO`;
  `VACANTE_CONFIRMADA → ESPERANDO_DOCUMENTACION`), y rechazar las transiciones inválidas. Hay que actualizar el
  diagrama de `docs/architecture/overview.md`.
- **FR-002**: El sistema MUST NOT retener ni reservar cupos antes de que el pago se acredite. El pago acreditado es
  el único mecanismo de reserva.
- **FR-003**: Al pasar a `PAGO_PENDIENTE`, la Postulación MUST registrar una fecha de vencimiento propia, calculada
  con un plazo configurable.
- **FR-004**: Una Postulación en `PAGO_PENDIENTE` cuyo vencimiento ya pasó MUST tratarse como `VENCIDO` en toda
  consulta y decisión (vencimiento perezoso), y persistirse como tal cuando un caso de uso la modifique.
- **FR-005**: Los cupos ocupados de un período MUST derivarse de las Postulaciones en `VACANTE_CONFIRMADA` (o
  posterior) y MUST NOT superar el total, salvo por una aceptación explícita de Dirección (FR-012).
- **FR-006**: Acreditar el mismo pago (mismo proveedor y misma referencia externa) más de una vez MUST ser
  idempotente.
- **FR-007**: El aspirante MUST ver su fecha de vencimiento y un aviso de que el lugar no está reservado hasta que
  se acredite el pago.
- **FR-008**: Solo los roles `SECRETARIA` o `DIRECCION` MUST poder crear y modificar períodos de ingreso. Solo
  el rol `TESORERIA` y el adaptador de Pagos360 MUST poder acreditar pagos. Esto se verifica en los casos de
  uso, y la seguridad de la base es una segunda barrera.
- **FR-009**: El registro de usuarios MUST asignar siempre el rol `ASPIRANTE` y la única institución activa, y
  MUST NOT aceptar un rol enviado por el usuario. Los datos obligatorios del perfil (nombre, apellido, DNI, CUIL,
  fecha de nacimiento, sexo) se validan en el borde antes del registro. Si falta alguno, el registro falla: nunca
  se completan con valores inventados (vacíos o la fecha de hoy).
- **FR-009b**: Si el usuario cambia su email en la autenticación, el email del perfil MUST quedar sincronizado.
- **FR-010**: Perfiles, Postulaciones y períodos MUST pertenecer a una institución, directamente o a través de su
  período (se mantiene la tabla de instituciones del PR 76), justificado con un ADR que modifique la decisión del
  ADR-0002.
- **FR-011**: El sistema MUST NOT permitir entrar en `PAGO_PENDIENTE` en un período cerrado o sin cupos libres.
- **FR-012**: Un pago fuera de plazo o sin cupo MUST NOT acreditarse automáticamente: la Postulación pasa a
  `PAGO_EN_REVISION`, el pago queda `A_DECIDIR` con su motivo (`FUERA_DE_PLAZO` o `SIN_CUPO`) y el caso aparece en
  el panel de Dirección. Solo el rol `DIRECCION` MUST poder aceptarlo o rechazarlo, y cada decisión MUST registrar
  quién decidió, cuándo y qué.
- **FR-013**: Una Postulación en `PAGO_EN_REVISION` MUST NOT vencer.
- **FR-014**: Los pagos `DEVUELTO` MUST aparecerle a Tesorería como devoluciones pendientes. La devolución de la
  plata en sí ocurre fuera del sistema.

### Key Entities

- **Postulación**: el intento de ingreso de un aspirante a un período. Tiene ID de Postulación, estado, vencimiento
  del plazo de pago (cuando está pendiente), período e institución. Reemplaza a "procedure/trámite" en el lenguaje
  ubicuo.
- **Período de ingreso**: tiene nombre, total de cupos, institución y, opcionalmente, una fecha de cierre. La
  ocupación no se guarda: se deriva.
- **Pago**: nace solo cuando llega una acreditación (una fila del informe o un aviso de Pagos360). Tiene proveedor,
  referencia externa (el par proveedor + referencia es único), monto en centavos enteros, fecha de pago (evalúa el
  plazo), fecha de registro (auditoría), estado (`ACREDITADO`; `NO_IMPUTADO`, que no se sabe de quién es y lo
  resuelve Tesorería; `A_DECIDIR`, con motivo `FUERA_DE_PLAZO` o `SIN_CUPO`, que lo resuelve Dirección; `DEVUELTO`,
  que Dirección rechazó y Tesorería reintegra), la Postulación a la que se imputa (opcional) y la carga de informe
  de la que vino (opcional).
- **Decisión de Dirección**: el pago, la decisión (aceptar o rechazar), quién decidió, cuándo y un comentario
  opcional.
- **Carga de informe**: quién la subió (rol `TESORERIA`), cuándo, nombre del archivo y el resumen (cuántos pagos
  se acreditaron, cuántos quedaron no imputados, cuántos eran duplicados).
- **Período de ingreso** (detalle): además del total de cupos, la fecha de cierre y la cantidad de días de plazo
  de pago, tiene el monto de la matrícula en centavos (cambia cada ciclo).
- **Institución**: una sola hoy (UTN FRH). Es dueña de los perfiles, las Postulaciones y los períodos.
- **Perfil**: el usuario y su rol. Los roles se nombran por función, no por institución ni carrera:
  `ASPIRANTE`, `SECRETARIA`, `DIRECCION`, `TESORERIA` (el `ADMIN` actual era Tesorería; no hay superadmin en la
  app). La etiqueta visible en cada institución ("Secretaría TUP", "Director de la TUP") vive en la configuración
  de la institución (Principio VIII).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los pagos acreditados dentro del plazo con cupos libres confirman la vacante en la misma
  operación de acreditación.
- **SC-002**: Recargar un informe de pagos ya procesado no genera ninguna acreditación ni ocupación nueva (0
  duplicados).
- **SC-003**: Ninguna Postulación vencida ocupa un cupo, y la ocupación informada coincide siempre con la cantidad
  de vacantes confirmadas.
- **SC-004**: Ningún registro nuevo obtiene un rol distinto del de aspirante, y el 100 % de los registros válidos
  se completan sin error.
- **SC-005**: Todo aspirante en `PAGO_PENDIENTE` puede ver su fecha límite en una sola pantalla.
- **SC-006**: El 100 % de los pagos fuera de plazo o sin cupo aparecen en el panel de Dirección; ninguno se
  acredita ni se pierde en silencio.
- **SC-007**: Toda vacante que excede el cupo tiene registrada la decisión de Dirección que la autorizó.

## Assumptions

- La fecha que decide si un pago está dentro del plazo es la **fecha de pago** que trae el informe de SysAdmin o
  Pagos360, no la fecha en que Tesorería lo carga. Así no se castiga al aspirante por la demora interna.
- La duración del plazo de pago todavía no está definida. Es configurable **por período de ingreso** (cantidad de
  días), y el vencimiento nunca supera la fecha de cierre del período: `vence_el = min(ahora + plazo, cierre)`.
- Una Postulación `VENCIDO` puede reintentar el pago con un plazo nuevo.
- Hoy existe una sola institución (UTN FRH); no se construye la administración de instituciones (alta/baja desde
  la UI).
- El formato del informe de SysAdmin todavía no fue entregado. Esta spec asume que trae **DNI**, **ID de
  Postulación** (si el aspirante lo informó en ventanilla), monto, fecha de pago y una referencia del
  comprobante. La imputación busca primero por ID de Postulación y, si no viene, por la Postulación en
  `PAGO_PENDIENTE` de ese DNI en el período vigente. Si no hay ninguna, o hay más de una, el pago queda
  `NO_IMPUTADO`. Probablemente traiga también nombre y apellido: se agrega cuando llegue el formato real.
- Un pago por un monto menor al de la matrícula del período queda `NO_IMPUTADO`.
- En Pagos360, la referencia externa la genera el sistema a partir del ID de Postulación.
- **Restricciones técnicas** (van al plan, no a esta spec): migración incremental en `src/supabase/migrations/`
  sin editar las ya mergeadas; eliminar la migración de `supabase/` de la raíz y las tablas y funciones
  `reservations`, `create_reservation` y `expire_reservations`; RLS y `REVOKE`/`GRANT` explícitos; ninguna función
  `SECURITY DEFINER` ejecutable por `anon`, y las que se exponen a `authenticated` verifican el rol adentro; corte vertical con domain, application (puertos), fakes,
  tests de contrato con Vitest y adaptador en `packages/infrastructure/supabase`.

