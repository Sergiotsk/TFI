# 0009 - Acciones manuales del personal sobre Postulaciones y perfiles

## Estado

Aceptado (2026-10-22, acordado por el equipo)

## Contexto

El personal de la facultad (Secretaría, Tesorería y Dirección) necesita ayudar a un postulante cuando algo
sale mal: un pago que se hizo por fuera del sistema, un comprobante que llegó tarde, un DNI mal tipeado al
registrarse. Hoy no tiene forma de hacerlo: el alta del perfil la hace el trigger de Auth y el estado de la
Postulación solo lo mueve la máquina de estados. La alternativa obvia —un `PATCH` que acepte `estado`— rompe
tres invariantes a la vez: el grafo de transiciones, el trigger guardián de la base y el conteo de cupos.

Además, la US1 (Tesorería acredita el informe de pagos) y la US5 (Dirección decide excepciones) todavía no
tienen sus RPC. Las acciones manuales no pueden esperar a que existan, pero tampoco pueden inventar un camino
paralelo que después haya que desarmar.

## Decisión

- **Acciones explícitas, no edición libre.** El personal no puede escribir `estado` ni `vence_el` a mano. Cada
  ayuda es un caso de uso con nombre propio:
  - `AcreditarPagoManual` (`POST /api/postulaciones/:id/acreditar-pago`): confirma la vacante de una
    `PAGO_PENDIENTE` o `VENCIDO`. Deja un registro en `pagos` con `proveedor = 'MANUAL'`,
    `referencia_externa = 'manual:<postulacion_id>'`, el monto de la matrícula del período, `pagado_el = now()`
    y `registrado_por = auth.uid()`.
  - `ProrrogarPlazoDePago` (`POST /api/postulaciones/:id/prorrogar-plazo`, `{ dias }`): extiende el vencimiento
    o reactiva una `VENCIDO`. El nuevo vencimiento es `min(ahora + días, cierre del período)` y se rechaza si
    el período ya cerró. Reactivar una `VENCIDO` exige cupo libre.
  - `ActualizarPerfil` (`PATCH /api/perfiles/:id`): corrige solo los datos personales (nombre, apellido, DNI,
    CUIL, nacimiento, sexo, teléfono y dirección). No cambia rol, email, institución ni verificación.
- **Los tres roles del personal pueden ejecutarlas** (`SECRETARIA`, `TESORERIA`, `DIRECCION`). No son acciones
  reservadas a Dirección: la ayuda operativa es de mostrador. La decisión de una excepción de pago sigue
  siendo de Dirección (ADR-0005).
- **Puerto nuevo `AccionesDelPersonal`.** No se extiende `RepositorioDePostulaciones`: las acciones no son
  transiciones de la máquina y necesitan una transacción con lock y control de cupo. El puerto expone
  `confirmarVacante(postulacionId)` y `prorrogarPlazo(postulacionId, venceEl)`; cada uno devuelve un resultado
  discriminado (`OK` con la Postulación releída, `SIN_CUPO`, `CONFLICTO`, `NO_ENCONTRADA`, `NO_AUTORIZADO`).
  El caso de uso traduce el resultado a errores de dominio o de aplicación.
- **Las RPC son `SECURITY DEFINER` y lockean el período.** `confirmar_vacante_manual` y
  `prorrogar_plazo_de_pago` toman `FOR UPDATE` sobre `periodos_de_ingreso` y después sobre la Postulación (mismo
  orden en las dos, para no deadlockear). La confirmación cuenta los estados que ocupan cupo con el período
  lockeado: dos confirmaciones simultáneas por el último cupo no pueden pasar las dos. Las dos revalidan el rol
  adentro (segunda barrera) y el alcance por institución.
- **La edición de perfiles usa GRANT por columna.** `GRANT UPDATE (nombre, apellido, dni, cuil,
  fecha_nacimiento, sexo, telefono, direccion)` más una policy de `UPDATE` para los tres roles de la
  institución. El adaptador mapea el `23505` de DNI/CUIL duplicado a `DatosDuplicados` (HTTP 409).

## Alternativas descartadas

- **Un `PATCH /api/postulaciones/:id` con `estado`, `vence_el` y `motivo_revision`.** Rompe la máquina de
  estados y el trigger guardián, permite confirmar sin cupo y deja la auditoría sin sentido. Descartada.
- **Escribir directo con `UPDATE` desde el cliente de sesión.** Sin lock, dos requests pueden sobrevender el
  último cupo y no hay forma de revalidar el rol en la misma transacción. Descartada.
- **Extender `RepositorioDePostulaciones` con `confirmarManualmente`.** Mezcla transiciones de la máquina con
  acciones administrativas y obliga a todos los adaptadores (incluido el fake) a conocer RPCs que solo usa el
  personal. Descartada.
- **No registrar el pago manual.** La Postulación quedaría confirmada sin una fila en `pagos`, y el informe de
  Tesorería no podría conciliar el monto. Descartada.
- **Permitir la edición de cualquier campo del perfil.** `rol`, `email`, `institucion_id` y `verificado` son
  identidad y autorización; un error de tipeo ahí es un incidente de seguridad. Descartada.

## Consecuencias

- ✅ El personal puede destrabar los tres casos reales (pago fuera del sistema, plazo vencido, dato mal
  cargado) sin romper el grafo de estados ni el cupo.
- ✅ El pago manual queda conciliado en `pagos` y con quién lo acreditó (`registrado_por`).
- ✅ La autorización y el alcance por institución se verifican dos veces: caso de uso y RPC/RLS.
- ✅ Los tests de casos de uso y del puerto corren con fakes; las RPC y el lock quedan documentados para los
  tests de integración.
- ⚠️ Cambia el contrato: hay un puerto nuevo (`AccionesDelPersonal`) y tres endpoints; `contracts/puertos.md`,
  `contracts/api-http.md` y la spec quedan desalineados hasta actualizarlos.
- ⚠️ `ALTER TYPE ... ADD VALUE 'MANUAL'` va en una migración separada de las RPC que usan el valor.
- ⚠️ La concurrencia real (último cupo en paralelo, dos prórrogas simultáneas) no se puede probar sin una base
  de Supabase de prueba; queda para los tests de integración.
- ⚠️ La acreditación manual no pasa por la decisión de Dirección: cualquier rol del personal puede confirmar una
  `VENCIDO`. Es una decisión operativa aceptada; si se quiere un control más fino, se agrega un motivo y una
  aprobación en una US posterior.

## Cuándo re-evaluar

Cuando existan las RPC de US1 y US5. Si la acreditación del informe pasa a ser el único camino a
`VACANTE_CONFIRMADA`, conviene unificar `confirmar_vacante_manual` con esa RPC y mover el control de cupo a un
único lugar. También si se pide auditar cada acción del personal: hoy `pagos.registrado_por` cubre el pago
manual, pero la prórroga y la edición de perfil no registran quién las hizo.
