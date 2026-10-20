# Contrato: funciones de base (RPC) y triggers

Regla que las gobierna: **el dominio decide, la base garantiza**. Ninguna función elige un resultado de negocio:
reciben la decisión ya tomada y verifican que sus precondiciones sigan valiendo al escribir (research R2). Sin
cuerpos acá: esto es el contrato que la suite de `RegistroDePagos` verifica.

Reglas comunes a todas las `SECURITY DEFINER`:
- `SET search_path = ''` y nombres calificados (`public.tabla`).
- `REVOKE EXECUTE ... FROM PUBLIC, anon`. `GRANT` explícito solo a quien corresponde.
- Las expuestas a `authenticated` verifican el rol **adentro** con `public.rol_actual()` (segunda barrera).

## `public.rol_actual() → rol_usuario`

- `SECURITY DEFINER`, `STABLE`. Devuelve el rol del perfil de `auth.uid()`, o `NULL`.
- Existe para que las policies de RLS no consulten `perfiles` desde `perfiles` (recursión infinita).
- `GRANT` a `authenticated`.
- Lo mismo para `public.institucion_actual() → uuid`.

## `public.acreditar_pago(...) → jsonb`

**Parámetros**: los datos del pago (`proveedor`, `referencia_externa`, `monto_centavos`, `pagado_el`,
`dni_informado?`, `numero_informado?`, `carga_id?`) más la decisión del dominio (`decision`: `CONFIRMAR` |
`REVISION` | `NO_IMPUTAR`, `postulacion_id?`, `estado_esperado?`, `motivo?`).

**Garantías, en una transacción**:
1. Inserta el pago con `ON CONFLICT (proveedor, referencia_externa) DO NOTHING`. Si ya existía, devuelve
   `{"resultado": "DUPLICADO", "pago_id": ...}` y no hace nada más.
2. Si `decision` es `CONFIRMAR` o `REVISION`: `SELECT ... FOR UPDATE` sobre el período de la Postulación, y después
   sobre la Postulación.
3. Precondiciones: el estado de la Postulación es `estado_esperado`. Si `CONFIRMAR`, `ocupados < total_cupos`.
   Si alguna falla, `RAISE` interno con rollback, y devuelve `{"resultado": "CONFLICTO"}`.
4. Aplica: `CONFIRMAR` → Postulación `VACANTE_CONFIRMADA` y pago `ACREDITADO`; `REVISION` → Postulación
   `PAGO_EN_REVISION` con el motivo y pago `A_DECIDIR`; `NO_IMPUTAR` → pago `NO_IMPUTADO` con el motivo.
5. Devuelve `{"resultado": "REGISTRADO", "pago_id": ...}`.

**Permisos**: `GRANT` a `authenticated` (adentro exige `rol_actual() = 'TESORERIA'`) y a `service_role` (el
webhook; sin `auth.uid()`).

**No hace**: decidir si corresponde confirmar, revisar o no imputar; ni buscar la Postulación por DNI o número.
Eso lo hace el dominio antes de llamar.

## `public.decidir_pago_excepcional(p_pago_id uuid, p_decision decision_direccion, p_comentario text) → jsonb`

**Garantías, en una transacción**:
1. `SELECT ... FOR UPDATE` sobre el pago, y verifica que esté `A_DECIDIR`. Si no lo está, devuelve `CONFLICTO`
   (cubre la doble decisión).
2. Lock sobre el período y la Postulación, y verifica que esté `PAGO_EN_REVISION`.
3. `ACEPTAR` → Postulación `VACANTE_CONFIRMADA` y pago `ACREDITADO` (**sin** comparar contra el total: la
   decisión de Dirección autoriza el exceso). `RECHAZAR` → Postulación `VENCIDO` y pago `DEVUELTO`.
4. Inserta en `decisiones_de_direccion` con `decidida_por = auth.uid()`.

**Permisos**: `GRANT` a `authenticated`, y adentro exige `rol_actual() = 'DIRECCION'`.

## Triggers

| Trigger | Tabla y evento | Contrato |
|---|---|---|
| `crear_perfil_al_registrarse` | `auth.users AFTER INSERT` | Rol `ASPIRANTE`, la única institución activa, y los datos obligatorios desde la metadata (`nombre`, `apellido`, `dni`, `cuil`, `fecha_nacimiento`, `sexo`). Si falta uno, si no se puede convertir o si la institución no es única: `RAISE` (falla el `signUp`). Nunca lee `role` de la metadata. |
| `sincronizar_email_de_perfil` | `auth.users AFTER UPDATE OF email` | `perfiles.email = NEW.email` |
| `actualizar_actualizado_el` | todas las tablas con `actualizado_el`, `BEFORE UPDATE` | `NEW.actualizado_el = now()` |

## Lo que se elimina

`public.create_reservation`, `public.expire_reservations` y `public.handle_new_user` (reemplazada por
`crear_perfil_al_registrarse`), además de las tablas `reservations`, `ingresos`, `payments` e `institutions`. Ninguno
de estos objetos llega a existir en el remoto si se borran las migraciones del PR 76 (research R1).

## Policies de RLS (resumen; la matriz completa está en la spec, FR-008)

- `SELECT` en las tablas de personal: filtrado por `institucion_actual()` (a través del período, en las tablas que
  derivan la institución).
- **Ningún** `INSERT` ni `UPDATE` directo sobre `pagos`, `decisiones_de_direccion` ni sobre
  `postulaciones.estado` hacia `VACANTE_CONFIRMADA`, `PAGO_EN_REVISION` o `VENCIDO` por rechazo: solo a través de
  las dos RPC.
- `postulaciones`: `INSERT` del propio aspirante (estado `PREINSCRIPTO`); `UPDATE` del propio aspirante solo de
  `PREINSCRIPTO`/`VENCIDO` a `PAGO_PENDIENTE` (`iniciarPago`), y la persistencia perezosa de
  `PAGO_PENDIENTE → VENCIDO`.
