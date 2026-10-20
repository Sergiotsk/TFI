# Research: Postulación con plazo de pago y control de cupos

**Fecha**: 2026-10-20 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Las decisiones D1 a D9 se tomaron con el usuario durante la revisión del PR 76 y no se vuelven a discutir acá: se
listan para trazabilidad. Las R1 en adelante son las incógnitas técnicas que se resolvieron al planificar.

## Decisiones tomadas (resumen)

| # | Decisión | Detalle en |
|---|---|---|
| D1 | `Procedure` pasa a **Postulación** en todas las capas | [data-model.md](data-model.md) |
| D2 | Esquema 100 % en español, en `snake_case` y sin ñ ni tildes | [data-model.md](data-model.md) |
| D3 | Enums `estado_postulacion` (con `PAGO_EN_REVISION`), `estado_pago`, `motivo_revision`, `sexo`, `rol_usuario` | [data-model.md](data-model.md) |
| D4 | Cupos derivados + concurrencia optimista con lock sobre el período | R2 |
| D5 | Plazo por Postulación (`vence_el`), con vencimiento perezoso y tope en la fecha de cierre | R5 |
| D6 | Pagos en centavos, idempotencia por `(proveedor, referencia_externa)`, `NO_IMPUTADO` como bandeja | [data-model.md](data-model.md) |
| D7 | `institucion_id` solo en las raíces (períodos, perfiles, cargas) | [data-model.md](data-model.md) |
| D8 | Trigger de registro estricto y sincronización del email | R7 |
| D9 | JWT del usuario en el adaptador, `service_role` solo en el webhook, RPC como única vía para acreditar, matriz RLS | R3, [contracts/rpc.md](contracts/rpc.md) |

---

## R1. Qué hacer con las migraciones del PR 76

**Decision**: borrar las dos migraciones del PR 76 (`supabase/migrations/20261020125916_new_schema.sql` en la raíz y
`src/supabase/migrations/20261020142058_add_instituciones_table.sql`) y la línea `/supabase/.temp` del `.gitignore`
de la raíz. Escribir migraciones nuevas, incrementales sobre las dos que **sí** están mergeadas en `develop`
(`init_schema` y `enable_rls`).

**Rationale**: el ADR-0004 prohíbe editar migraciones **mergeadas**. Las del PR 76 no lo están: la integración de
GitHub aplica solo lo que entra a `develop`, así que ninguna llegó al remoto. Borrarlas evita una cadena
"crear → renombrar → borrar" que deja en el historial objetos que nunca existieron (`reservations`,
`institutions` en inglés). La de la raíz, además, nunca se aplicaría.

**Alternatives considered**: mantenerlas y corregirlas con migraciones nuevas. Se descartó porque arrastra
objetos inútiles y una migración (`new_schema`) que falla al aplicarse.

**Verificación previa a implementar**: confirmar con el autor del PR 76 que nadie aplicó esas migraciones con
`db push` al remoto. Como la contraseña de la base no se reparte (ADR-0004), lo verifica quien administra el
proyecto en el dashboard de Supabase (Database → Migrations), o con una consulta de solo lectura a
`supabase_migrations.schema_migrations`.

## R2. Concurrencia por el último cupo

**Decision**: concurrencia optimista. El caso de uso lee, el dominio decide y el adaptador persiste la decisión
con una RPC (`acreditar_pago`) que, en una sola transacción: (1) inserta el pago con
`ON CONFLICT (proveedor, referencia_externa) DO NOTHING` (idempotencia), (2) toma `SELECT ... FOR UPDATE` sobre
la fila del período, (3) verifica las **precondiciones** que asumió el dominio (estado de la Postulación y, si la
decisión es confirmar, `ocupados < total`) y (4) aplica la transición. Si una precondición no se cumple, devuelve
`conflicto` sin escribir. El caso de uso reintenta hasta 3 veces: relee y el dominio vuelve a decidir (por
ejemplo, pasa de "confirmar" a "revisión `SIN_CUPO`").

**Rationale**: `supabase-js` no tiene transacciones entre llamadas, porque cada request a PostgREST es una
transacción. Un `UPDATE ... WHERE (SELECT count(*)) < total` no alcanza en `READ COMMITTED`: dos transacciones
sobre filas distintas no se bloquean (write skew). El lock sobre la fila del período serializa justo lo que
comparten. La RPC **verifica**, no **decide**: el resultado (confirmar, revisión o no imputado) lo trae como
parámetro.

**Alternatives considered**: contador con `CHECK` (dos fuentes de verdad, y bloquearía las aceptaciones de
Dirección); `postgres.js` directo con transacciones (dos clientes, pooler en Vercel y se saltea RLS);
`SERIALIZABLE` (los reintentos por error de serialización son más difíciles de distinguir de los errores reales).

**Contención**: entre 100 y 160 inscripciones por ciclo, con un informe diario. El lock es una red de seguridad,
no un cuello de botella.

## R3. Cliente de Supabase en Next.js 16 con el JWT del usuario

**Decision**: `@supabase/ssr` en `apps/web`, que crea el cliente con la sesión del usuario (cookies) en los route
handlers. El cliente se construye en la **raíz de composición** por request y se inyecta en los adaptadores de
`packages/infrastructure/supabase`, que reciben un `SupabaseClient` (de `@supabase/supabase-js`) y no saben de
cookies ni de Next.

**Rationale**: así RLS se aplica con la identidad real (doble barrera, Principio VII), y `infrastructure` no
depende de Next (el código específico de Supabase vive en `infrastructure`, el de Next en `apps/web`). Como el
adaptador recibe el cliente por constructor, la suite de contrato le puede pasar un cliente logueado con cada rol.

**Alternatives considered**: un cliente singleton con `service_role` (anula RLS); `@supabase/auth-helpers-nextjs`
(reemplazado por `@supabase/ssr`).

**Pendiente de versión**: fijar versiones exactas de `@supabase/supabase-js` y `@supabase/ssr` al instalar
(`engines` y lockfile, como el resto del repo).

## R4. Tests de contrato contra Supabase local

**Decision**: Vitest en el workspace (`vitest` como devDependency en la raíz `src/` y config por proyecto). Cada
puerto tiene un `contrato.ts` que exporta una función `probarContratoDe<Puerto>(crear: () => Promise<Puerto>)`. Esa
función se invoca dos veces: con el fake (siempre, en CI) y con el adaptador de Supabase (solo si
`SUPABASE_TEST_URL` está definida; local, contra `supabase start`). El aislamiento entre tests se hace creando
datos únicos por test (institución y período propios), no con `db reset` entre tests.

**Rationale**: el patrón `contrato.ts` ya está previsto en `eslint.config.mjs` (puede usar devDependencies). Crear
datos únicos es mucho más rápido que resetear la base, y permite correr tests en paralelo.

**Alternatives considered**: `db reset` antes de cada archivo (lento, entre 10 y 20 s); pgTAP para las RPC (es otro
lenguaje de tests y la regla del Principio III es la suite de contrato del puerto, no tests del SQL aislado).

**CI**: hoy el repo **no tiene CI** en ninguna rama (verificado en `develop`, `main` y `develop-landing`). La
configuración de Vitest y el workflow (lint, typecheck, test) los aporta la tarjeta **"Config de Vitest y CI"**, que
se mergea antes del incremento de dominio. Esta feature le pide a esa tarjeta: el script `test` (proyecto
`unidad`: `packages/**/*.test.ts` sin los `*.contrato.test.ts`) y el script `test:contratos` (proyecto
`contratos`: `packages/infrastructure/**/*.contrato.test.ts`).

**Riesgo**: aun con CI, la CI no levanta Supabase. La suite contra Supabase corre local y es requisito del PR del
adaptador (el reviewer la corre o se adjunta la salida). Habilitar Supabase en CI queda como mejora.

## R5. Vencimiento perezoso y consultas

**Decision**: la Postulación expone `estadoEn(ahora)`, que devuelve `VENCIDO` si el estado persistido es
`PAGO_PENDIENTE` y `ahora > vence_el`. Los casos de uso siempre usan `estadoEn(reloj.ahora())`. El estado
`VENCIDO` se **persiste** solo cuando un caso de uso toca esa Postulación (por ejemplo, un reintento o un pago).
Las consultas de ocupación no se ven afectadas, porque solo cuentan `VACANTE_CONFIRMADA` y posteriores.

**Rationale**: vencer no libera nada, así que no hace falta un proceso que corra a horario. El reloj se inyecta
como puerto (`Reloj`), para probar los vencimientos sin esperar.

**Consecuencia conocida**: una consulta SQL cruda ve `PAGO_PENDIENTE` en postulaciones ya vencidas. Los listados de
la app pasan por el dominio, y para reportes SQL se documenta la condición `vence_el < now()`.

## R6. ID de Postulación legible para la ventanilla

**Decision**: además del `id` (UUID, clave técnica), la Postulación tiene un **`numero`** (`bigint`, `GENERATED
ALWAYS AS IDENTITY`), que se muestra al aspirante con ceros a la izquierda (por ejemplo, `004217`) para que lo
informe en ventanilla. En la imputación por número, **si el informe trae DNI, tiene que coincidir** con el del
aspirante; si no coincide, el pago queda `NO_IMPUTADO`.

**Rationale**: un UUID no se puede dictar en una ventanilla. Un número corto sí, pero un error de tipeo puede
apuntar a otra Postulación válida: el cruce con el DNI lo detecta.

**Alternatives considered**: un código aleatorio en base32 (no revela el volumen, pero es más difícil de dictar y
necesita un generador inyectado); usar solo el DNI (es ambiguo si hay más de una Postulación).

## R7. Trigger de registro y datos obligatorios

**Decision**: `handle_new_user` lee de `raw_user_meta_data` solo los datos personales (`nombre`, `apellido`,
`dni`, `cuil`, `fecha_nacimiento`, `sexo`). Si falta alguno, o no se puede convertir, hace `RAISE EXCEPTION`
(el `signUp` falla). El rol siempre es `ASPIRANTE`, y la institución es la única con `activa = true` (si hay cero o
más de una, falla). Un segundo trigger `AFTER UPDATE OF email ON auth.users` actualiza `perfiles.email`. Zod valida
el formulario en `apps/web` antes de llamar a `signUp`, así que el `RAISE` es la segunda barrera.

**Rationale**: el `COALESCE(..., '')` actual rompe en el segundo registro sin DNI (por el `UNIQUE`) y esconde datos
faltantes. El rol desde la metadata es una escalada de privilegios.

**Alternatives considered**: crear el perfil desde un caso de uso después del `signUp` (no es atómico: puede
quedar un usuario de Auth sin perfil).

## R8. Conversión de los enums y de los datos existentes

**Decision**: crear los enums nuevos, convertir las columnas con `ALTER COLUMN ... TYPE ... USING (CASE ...)` y
eliminar los viejos. Mapeo de estados: `INICIADO → PREINSCRIPTO`, `EN PROCESO → PAGO_PENDIENTE`,
`APROBADO → VACANTE_CONFIRMADA`, `RECHAZADO → VENCIDO`. Roles: `INTERESADO → ASPIRANTE`,
`SECRETARIO → SECRETARIA`, `DIRECTOR → DIRECCION`, `ADMIN → TESORERIA`.

**Pendiente de verificar antes de implementar**: `postulaciones.periodo_id` es `NOT NULL`, y las filas existentes
del remoto (datos de prueba) no tienen período. Si el remoto tiene solo datos de prueba, la migración crea un
período "Migración de datos de prueba" para asignárselo. Vaciar tablas en el remoto **no** se hace sin acuerdo del
equipo.

**Rationale**: Postgres no permite eliminar valores de un enum (`ALTER TYPE ... DROP VALUE` no existe).

## R9. Alcance que queda fuera de esta feature

**Decision**: quedan fuera, cada uno como feature propia:

- **Adaptador del informe de SysAdmin** (el parser del archivo): el formato no fue entregado. Esta feature expone
  el caso de uso `ImportarInformeDePagos`, que recibe filas ya validadas (`PagoInformado[]`).
- **Adaptador y webhook de Pagos360**: esta feature deja el caso de uso `AcreditarPago` listo para que el webhook
  lo invoque con `proveedor = PAGOS360`.
- **Flujo de documentación** (`ESPERANDO_DOCUMENTACION` en adelante): el enum incluye esos estados, pero sus
  transiciones son de otra feature.

**Rationale**: Principio VI (MVP) y PRs chicos. Cada una de estas piezas tiene sus propias incógnitas externas.
