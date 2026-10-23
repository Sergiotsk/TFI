---

description: "Lista de tareas de la feature 001-postulacion-plazo-cupos"
---

# Tasks: Postulación con plazo de pago y control de cupos

**Input**: Design documents from `specs/001-postulacion-plazo-cupos/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **obligatorios**. El Principio III de la constitución exige un fake y una suite de contrato por puerto, y
tests con Vitest para el dominio y los casos de uso. Se trabaja con TDD: cada test se escribe primero y tiene que
**fallar** antes de implementar.

**Organization**: tareas agrupadas por historia de usuario. Orden de las fases: US1 → US2 → US5 (las tres P1) →
US3 → US4 (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec (US1 a US5)

## Path Conventions

Rutas relativas a la raíz del repo. El código vive en `src/` (ADR-0003), y los comandos de pnpm y de Supabase se
corren desde `src/`. Los paquetes son planos (sin un `src/` interno). Cada puerto lleva la terna `puerto.ts` /
`fake.ts` / `contrato.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: limpiar lo que dejó el PR 76, registrar las decisiones de arquitectura y preparar las herramientas.

- [X] T001 Confirmar con el autor del PR 76 que ninguna de sus migraciones se aplicó al remoto. La contraseña de la base no se reparte (ADR-0004), así que lo verifica quien administra el proyecto (dashboard de Supabase → Database → Migrations, o una consulta de solo lectura a `supabase_migrations.schema_migrations`). Registrar el resultado bajo R1 en specs/001-postulacion-plazo-cupos/research.md
- [X] T002 Relevar, por el mismo medio que T001, cuántas filas hay en `profiles`, `procedures` y `documents` del remoto y si son solo datos de prueba, y qué perfiles tienen un rol distinto de `INTERESADO`: el trigger viejo tomaba el rol de la metadata, así que un `ADMIN` autoasignado pasaría a `TESORERIA` con la migración. Corregirlos antes de aplicarla. Registrar bajo R8 en specs/001-postulacion-plazo-cupos/research.md si la migración crea el período "Migración de datos de prueba" (no se vacían tablas sin acuerdo del equipo)
> **T003 a T005 cambiaron de forma**: la rama de las migraciones (`feature/t30-migraciones-postulacion`) sale de
> `develop` apilada sobre el PR de diseño, no de `develop-db`. Los archivos del PR 76 (supabase/ en la raíz, la línea
> `/supabase/.temp` del .gitignore y src/supabase/migrations/20261020142058_add_instituciones_table.sql) **nunca
> llegaron a `develop`**, así que no hay nada que borrar: se descartan cerrando el PR 76 sin mergear.

- [ ] T003 Coordinar con el autor del PR 76 que lo pase a borrador ahora y lo cierre sin mergear antes de mergear el PR B (si se mergea, la integración aplica en el remoto la migración rota de instituciones). Registrar el cierre en specs/001-postulacion-plazo-cupos/research.md bajo R1
- [x] T004 Verificar que el PR B no contenga la carpeta `supabase/` de la raíz ni la línea `/supabase/.temp` en .gitignore (verificado al crear la rama: no existen en `develop`)
- [x] T005 Verificar que src/supabase/migrations/ solo tenga las migraciones mergeadas (`init_schema` y `enable_rls`) antes de agregar las nuevas (verificado al crear la rama)
- [x] T006 [P] Escribir docs/decisions/0005-excepciones-de-vacante-decide-direccion.md: el mecanismo `PAGO_EN_REVISION` y la decisión caso por caso de Dirección; cierra el TODO(EXCEPCIONES_VACANTE) de la constitución (Principio II). Formato igual al de docs/decisions/0004-migraciones-por-integracion-github.md
- [x] T007 [P] Escribir docs/decisions/0006-instituciones-en-el-esquema.md: modifica la decisión del ADR-0002 (tabla `instituciones` mínima e `institucion_id` solo en las raíces, sin administración ni multi-tenancy en la UI). Incluir una sección de datos personales: `pagos.dni_informado` queda atado al `TODO(RETENCION_DATOS)` de la constitución (Ley 25.326)
- [x] T008 [P] Escribir docs/decisions/0007-renombrar-procedure-a-postulacion.md: lenguaje ubicuo y cambio del puerto `RepositorioDeProcedure` (requiere doble aprobación). Incluir el renombre de los roles (`INTERESADO`/`SECRETARIO`/`DIRECTOR`/`ADMIN` → `ASPIRANTE`/`SECRETARIA`/`DIRECCION`/`TESORERIA`): se nombran por función, y las etiquetas de la constitución ("Alumno", "Secretaría TUP", "Director", "Administración/Tesorería") pasan a `apps/web/config/institucion.ts` (Principio VIII)
- [x] T009 Agregar los ADR 0005 a 0007 al índice de docs/decisions/README.md
- [x] T010 [P] Agregar `PAGO_EN_REVISION` y sus transiciones, más `VENCIDO → VACANTE_CONFIRMADA` (pagó a tiempo y se informó tarde), al diagrama de la sección 4 de docs/architecture/overview.md (según data-model.md)

> **T011 y T012 salieron de esta feature** (opción A del análisis): la configuración de Vitest (`src/vitest.config.ts`,
> scripts `test` y `test:contratos`, proyectos `unidad` y `contratos`) y el workflow de CI los aporta la tarjeta
> **"Config de Vitest y CI"**, que se mergea **antes** de la fase 2 de dominio (T023 en adelante). Los requisitos que
> esta feature le pide a la tarjeta están en research.md, R4.

- [x] T013 [P] Agregar `zod` (misma versión que en la rama `develop-landing`, hoy `^4.6.7`, pero fijada exacta como el resto del repo) a src/apps/web/package.json y src/packages/infrastructure/package.json
- [x] T014 [P] Agregar `@supabase/supabase-js` a src/packages/infrastructure/package.json, y `@supabase/ssr` más `@supabase/supabase-js` a src/apps/web/package.json (versiones exactas)
- [x] T015 [P] Documentar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_TEST_URL` con valores falsos en src/apps/web/.env.example (crearlo si no existe; Principio VII)
> La clave pública se llama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: es el nombre nuevo de Supabase para lo que era la clave `anon`. Las de la base de prueba son `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y `SUPABASE_TEST_SERVICE_ROLE_KEY`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el esquema renombrado, el dominio base (máquina de estados, value objects, período) y los puertos de
Postulaciones y Períodos con sus adaptadores. Todas las historias dependen de esto.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

### Base de datos

- [x] T016 Crear src/supabase/migrations/20261021000100_renombrar_a_espanol.sql: renombra `profiles`→`perfiles`, `procedures`→`postulaciones` (`user_id`→`aspirante_id`) y `documents`→`documentos` (`procedure_id`→`postulacion_id`, `rute`→`ruta`, `validity`→`vigencia`, más `tipo` y `estado estado_documento`). Crea los enums `estado_postulacion`, `rol_usuario`, `sexo` y `estado_documento`, convierte las columnas con `USING` según el mapeo de research R8 y elimina `procedure_state`, `user_role` y `user_sex`. Elimina `procedure_documents` y reemplaza `handle_updated_at()` por `actualizar_actualizado_el()` (con `SET search_path = ''`) y sus triggers
- [x] T017 Crear src/supabase/migrations/20261021000200_instituciones_y_periodos.sql: `instituciones` (inserta `FRH` / `UTN FRH`); `periodos_de_ingreso` con sus CHECK y `UNIQUE (institucion_id, nombre)`; `perfiles.institucion_id` (con backfill a `FRH` y después `NOT NULL`); en `postulaciones`, `periodo_id` (con backfill según T002 y después `NOT NULL`), `numero` (`GENERATED ALWAYS AS IDENTITY UNIQUE`), `vence_el` y `motivo_revision` (crea el enum). Agrega los CHECK de data-model.md, el índice único parcial por `(aspirante_id, periodo_id)` y el índice `(periodo_id, estado)`. `ENABLE ROW LEVEL SECURITY` en las tablas nuevas
- [x] T018 Crear src/supabase/migrations/20261021000300_registro_estricto.sql: el trigger `crear_perfil_al_registrarse` (contracts/rpc.md: rol fijo `ASPIRANTE`, la única institución activa, `RAISE` si falta un dato, sin `COALESCE`), `sincronizar_email_de_perfil` (`AFTER UPDATE OF email ON auth.users`), y elimina el trigger `on_auth_user_created` y la función `handle_new_user`. Tiene que ir **justo después** de T017, porque si no el signup queda roto por el `NOT NULL` de `institucion_id`
- [x] T019 Crear src/supabase/migrations/20261021000400_pagos_cargas_y_decisiones.sql: los enums `estado_pago`, `motivo_no_imputado`, `proveedor_pago` y `decision_direccion`; las tablas `cargas_de_informe`, `pagos` (con `UNIQUE (proveedor, referencia_externa)` y los CHECK por estado) y `decisiones_de_direccion` (`UNIQUE (pago_id)`); índices; `ENABLE ROW LEVEL SECURITY`
- [x] T020 Crear src/supabase/migrations/20261021000500_helpers_y_politicas_rls.sql: `rol_actual()` e `institucion_actual()` (`SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, `REVOKE ... FROM PUBLIC, anon`, `GRANT` a `authenticated`) y las policies de todas las tablas según la matriz de spec.md (FR-008) y contracts/rpc.md. Sin `INSERT` ni `UPDATE` directo sobre `pagos` y `decisiones_de_direccion`, y con el `UPDATE` de `postulaciones` acotado a `iniciarPago` y a la persistencia de `VENCIDO`
- [x] T021 Crear src/supabase/seed.sql: un período abierto de ejemplo (50 cupos, 3 días de plazo, matrícula de 9.400.000 centavos) y una cuenta por rol de personal (`SECRETARIA`, `DIRECCION`, `TESORERIA`) con contraseñas de desarrollo **obviamente falsas** y un comentario que aclare que el seed solo corre en la base local (nunca en el remoto; Principio VII)
- [x] T022 Correr `pnpm dlx supabase db reset` desde `src/` y verificar la sección 1 de specs/001-postulacion-plazo-cupos/quickstart.md (tablas, RLS en todas, `anon` sin `EXECUTE`, sin enums viejos)

### Dominio (tests primero)

- [x] T023 [P] Escribir src/packages/domain/pago/monto.test.ts y src/packages/domain/pago/referencia-de-pago.test.ts (centavos enteros, rechazo de negativos y decimales, `cubre`, igualdad de referencia)
- [x] T024 [P] Escribir src/packages/domain/postulacion/numero-de-postulacion.test.ts y src/packages/domain/perfil/dni.test.ts (`formatear` con 6 dígitos, validación del DNI)
- [x] T025 [P] Escribir src/packages/domain/periodo/periodo-de-ingreso.test.ts (`estaAbierto`, y `calcularVencimiento` con el tope en `cierraEl`)
- [x] T026 Escribir src/packages/domain/postulacion/postulacion.test.ts: todas las transiciones válidas e inválidas de la máquina de data-model.md (incluidas `PAGO_EN_REVISION`, `aceptarExcepcion`, `rechazarExcepcion` y `confirmar` desde `VENCIDO` cuando `pagadoEl <= venceEl`), `estadoEn(ahora)` perezoso y que `PAGO_EN_REVISION` no vence
- [x] T027 [P] Implementar src/packages/domain/pago/monto.ts y src/packages/domain/pago/referencia-de-pago.ts (hasta que pase T023)
- [x] T028 [P] Implementar src/packages/domain/postulacion/numero-de-postulacion.ts y src/packages/domain/perfil/dni.ts (hasta que pase T024)
- [x] T029 [P] Implementar src/packages/domain/periodo/periodo-de-ingreso.ts (hasta que pase T025)
- [x] T030 Implementar src/packages/domain/postulacion/estados.ts, src/packages/domain/postulacion/errores.ts (`TransicionInvalida`, `PeriodoCerrado`, `SinCuposParaIniciar`, `CuposPorDebajoDeConfirmadas`) y src/packages/domain/postulacion/postulacion.ts (inmutable; hasta que pase T026)
- [x] T031 [P] Reemplazar src/packages/domain/user/user.ts por src/packages/domain/perfil/perfil.ts (sin `password`, con `rol` = `ASPIRANTE` | `SECRETARIA` | `DIRECCION` | `TESORERIA` e `institucionId`)
- [x] T032 [P] Mover src/packages/domain/document/document.ts a src/packages/domain/documento/documento.ts, con nombres en español (`postulacionId`, `ruta`, `vigencia`, `estado`)
- [x] T033 Actualizar los exports de src/packages/domain/index.ts y borrar src/packages/domain/procedure/

### Application: puertos base (contrato primero)

- [ ] T034 [P] Crear src/packages/application/puertos/reloj/puerto.ts, contrato.ts (casos de contracts/puertos.md), fake.ts (`RelojFijo` con `avanzar(ms)`) y fake.test.ts, que corre el contrato contra el fake
- [ ] T034b [P] Crear src/packages/infrastructure/reloj/reloj-de-sistema.ts y src/packages/infrastructure/reloj/reloj-de-sistema.test.ts, que corre el contrato de T034 contra el reloj real
- [ ] T035 [P] Escribir src/packages/application/puertos/repositorio-de-postulaciones/contrato.ts con la función `probarContratoDeRepositorioDePostulaciones(crear)` y los casos de contracts/puertos.md
- [ ] T036 [P] Escribir src/packages/application/puertos/repositorio-de-periodos/contrato.ts con los casos de contracts/puertos.md (`contarOcupados` y `contarPendientesVigentes` con vencimiento perezoso)
- [ ] T037 Crear src/packages/application/puertos/repositorio-de-postulaciones/puerto.ts, fake.ts y fake.test.ts (este último corre el contrato de T035 contra el fake)
- [ ] T038 Crear src/packages/application/puertos/repositorio-de-periodos/puerto.ts, fake.ts y fake.test.ts (corre el contrato de T036)
- [x] T039 Renombrar src/packages/application/puertos/repositorio-de-document/ a repositorio-de-documentos/ y repositorio-de-usuarios/ a repositorio-de-perfiles/ (adaptados a `Documento` y `Perfil`), borrar src/packages/application/puertos/repositorio-de-procedure/ y actualizar src/packages/application/index.ts
- [x] T039b [P] Escribir src/packages/application/puertos/repositorio-de-documentos/contrato.ts y fake.test.ts (guardar y obtener; obtener uno inexistente da `null`; listar por postulación). Hoy no tienen contrato: es deuda anterior que esta feature salda porque toca el puerto (Principio III)
- [x] T039c [P] Escribir src/packages/application/puertos/repositorio-de-perfiles/contrato.ts y fake.test.ts, con los métodos que existen hoy en el puerto (`obtenerTodos`, `obtenerPorId`, `obtenerPorRol`, `guardar`; inexistente da `null`). La búsqueda por DNI no va acá: es `RepositorioDePostulaciones.buscarPendientesPorDni`
> La suite acepta `escritura: false` para el adaptador real: el alta del perfil la hace el trigger y RLS no deja escribir la fila desde la app.
- [x] T040 Crear src/packages/application/casos-de-uso/actor.ts (`Actor` con `perfilId`, `rol` e `institucionId`, más `exigirRol(actor, ...roles)`) y el error `NoAutorizado` en src/packages/application/casos-de-uso/errores.ts

### Infrastructure: adaptadores base

- [ ] T041 Generar src/packages/infrastructure/supabase/tipos.ts con `pnpm dlx supabase gen types typescript --local` (desde `src/`). Estos tipos no se exportan fuera del paquete (Principio I)
- [ ] T042 Crear src/packages/infrastructure/supabase/prueba/entorno.ts: crea clientes logueados por rol contra `SUPABASE_TEST_URL` y fabrica datos únicos por test (institución, período, aspirantes), según research R4
- [ ] T043 [P] Crear src/packages/infrastructure/supabase/mapeadores/postulacion.ts y src/packages/infrastructure/supabase/mapeadores/periodo.ts (fila a entidad, validando cada fila con Zod)
- [ ] T044 Implementar src/packages/infrastructure/supabase/repositorio-de-postulaciones.ts (recibe un `SupabaseClient` por constructor; `guardarTransicion` es un `update` condicionado a `.eq('estado', antes.estado)`, y si actualiza 0 filas devuelve `conflicto`)
- [ ] T045 Implementar src/packages/infrastructure/supabase/repositorio-de-periodos.ts
- [x] T045b Implementar src/packages/infrastructure/supabase/repositorio-de-perfiles.ts con al menos `obtenerPorId` y `obtenerPorRol` (lectura; el alta la hace el trigger de T018). Lo usa T051 para armar el `Actor`: la autorización de los casos de uso **no** puede correr contra un fake (Principio VII, primera barrera)
- [x] T046 Crear src/packages/infrastructure/supabase/repositorio-de-postulaciones.contrato.test.ts, src/packages/infrastructure/supabase/repositorio-de-periodos.contrato.test.ts y src/packages/infrastructure/supabase/repositorio-de-perfiles.contrato.test.ts (corren los contratos de T035, T036 y T039c contra los adaptadores, con `describe.skipIf(!process.env.SUPABASE_TEST_URL)`)
> Hechos los tres, más `repositorio-de-documentos.contrato.test.ts` y `almacen-de-archivos.contrato.test.ts`. Los fixtures generan DNI, CUIL, períodos e instituciones únicos por corrida; los documentos se asocian a Postulaciones reales.
- [ ] T047 Actualizar los exports de src/packages/infrastructure/index.ts (incluido `RelojDeSistema`)
> Los exports actuales están al día. Falta `RelojDeSistema`, que viene con T034b (el reloj sale de esta feature).

### Web: raíz de composición

- [x] T047b Crear src/apps/web/config/entorno.ts: schema Zod de `NEXT_PUBLIC_SUPABASE_URL` (URL), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (string no vacío) y `SUPABASE_SERVICE_ROLE_KEY` (opcional, salvo en la ruta del webhook). Falla al arrancar si falta una variable o es inválida (Principio IV). Nadie más en `apps/web` lee `process.env` directamente
- [x] T048 Crear src/apps/web/lib/supabase/servidor.ts (`createServerClient` de `@supabase/ssr` con las cookies de Next y las variables de T047b, research R3)
- [x] T049 Reescribir src/apps/web/composition-root.ts como `crearDependencias()` por request: adaptadores de Supabase con el cliente de la sesión, `RelojDeSistema` (T034b), el adaptador de perfiles (T045b) y el fake que se mantiene solo para documentos
> Hecho salvo `RelojDeSistema` (T034b). La raíz de composición arma por request los adaptadores de Supabase, el de perfiles y el fake de documentos.
- [x] T050 [P] Crear src/apps/web/http/respuesta.ts (respuesta uniforme `{ success, data | error }` y mapeo de los errores del dominio a HTTP según contracts/api-http.md)
- [x] T051 [P] Crear src/apps/web/http/actor.ts (arma el `Actor` desde la sesión y el perfil **real**, con el adaptador de T045b; si no hay sesión, 401; si no hay perfil, 403)
- [x] T052 [P] Crear src/apps/web/config/institucion.ts (etiquetas visibles por rol, "Secretaría TUP" y "Director de la TUP", y marca de la institución; Principio VIII)
- [x] T053 Borrar src/apps/web/app/api/procedure/ y adaptar src/apps/web/app/api/document/ y src/apps/web/app/api/users/ a los puertos renombrados, sin cambiar su comportamiento. Abrir un issue de deuda: esas rutas llaman a los repositorios sin caso de uso ni autorización (Principio VII; hoy no exponen datos reales porque usan fakes), y referenciarlo en un comentario de cada route.ts
> Hecho: `app/api/procedure/` borrado, `app/api/document/` adaptado y protegido con sesión y rol, y `app/api/users/` ya era `app/api/perfiles/`. La deuda que queda (el puerto se usa sin caso de uso) está documentada en `apps/web/app/api/README.md` y en el comentario de cada route.ts: el issue en GitHub no se pudo abrir desde esta máquina.

**Checkpoint**: la base se reconstruye con `db reset`, `pnpm test` pasa (dominio y contratos contra los fakes) y los
contratos de Postulaciones y Períodos pasan contra Supabase local.

---

## Phase 3: User Story 1 - El pago acreditado confirma la vacante y consume el cupo (Priority: P1) 🎯 MVP

**Goal**: Tesorería importa pagos; los que están en plazo y con cupo confirman la vacante de forma idempotente y sin
sobreventa, y los que no se pueden imputar quedan en su bandeja.

**Independent Test**: un período con N cupos y una Postulación en `PAGO_PENDIENTE` (sembrada en el fake o en la
base); al acreditar su pago queda `VACANTE_CONFIRMADA` y la ocupación da 1; si se reimporta, da `DUPLICADO`.

### Tests for User Story 1 ⚠️

> Se escriben PRIMERO y tienen que FALLAR antes de implementar.

- [x] T054 [P] [US1] Escribir src/packages/domain/postulacion/evaluar-pago.test.ts: las 8 reglas de la tabla de data-model.md, en orden (incluidos "tardío y sin cupo" → `FUERA_DE_PLAZO`, y "pagó a tiempo pero se informó después del vencimiento" → `CONFIRMAR` con `estadoEsperado` igual al estado **persistido**)
- [ ] T055 [P] [US1] Escribir src/packages/application/puertos/registro-de-pagos/contrato.ts: idempotencia, duplicado en paralelo, **último cupo en paralelo** (`Promise.all`: exactamente un `REGISTRADO` y un `CONFLICTO`), precondición de estado, **estado persistido vs. efectivo** y **confirmar desde `VENCIDO`** (los dos casos de contracts/puertos.md), y `REVISION` y `NO_IMPUTAR` sin efectos sobre la Postulación
- [ ] T056 [P] [US1] Escribir src/packages/application/puertos/registro-de-cargas/contrato.ts (`cerrar` persiste el resumen, `listar` ordena por fecha y no mezcla instituciones)
- [ ] T057 [P] [US1] Escribir src/packages/application/casos-de-uso/acreditar-pago.test.ts: `CONFIRMAR`; `DUPLICADO`; `CONFLICTO` → reintento → `REVISION(SIN_CUPO)`; 3 conflictos → error; un rol distinto de `TESORERIA` → `NoAutorizado`; imputación por número con DNI que no coincide; DNI ambiguo
- [ ] T058 [P] [US1] Escribir src/packages/application/casos-de-uso/importar-informe-de-pagos.test.ts (resumen por categoría; reimportar da todo `duplicados`, SC-002)
- [ ] T059 [P] [US1] Escribir src/packages/application/casos-de-uso/listar-bandeja.test.ts (`NO_IMPUTADO` y `DEVUELTO` para `TESORERIA` y `SECRETARIA`; `A_DECIDIR` solo para `DIRECCION`)

### Implementation for User Story 1

- [x] T060 [P] [US1] Implementar src/packages/domain/pago/pago.ts (estados y motivos) y src/packages/domain/pago/carga-de-informe.ts, y exportarlos en src/packages/domain/index.ts
- [x] T061 [US1] Implementar src/packages/domain/postulacion/evaluar-pago.ts (hasta que pase T054)
- [ ] T062 [P] [US1] Crear src/packages/application/puertos/registro-de-pagos/puerto.ts, fake.ts y fake.test.ts. El fake verifica las precondiciones y escribe **sin ningún `await` en el medio**, así es atómico dentro del event loop
- [ ] T063 [P] [US1] Crear src/packages/application/puertos/registro-de-cargas/puerto.ts, fake.ts y fake.test.ts
- [ ] T064 [US1] Implementar src/packages/application/casos-de-uso/acreditar-pago.ts (imputación por número y luego por DNI, `evaluarPago` y hasta 3 reintentos; hasta que pase T057)
- [ ] T065 [US1] Implementar src/packages/application/casos-de-uso/importar-informe-de-pagos.ts (abre la carga, acredita cada fila y cierra con el resumen; hasta que pase T058)
- [ ] T066 [US1] Implementar src/packages/application/casos-de-uso/listar-bandeja.ts (hasta que pase T059)
- [ ] T067 [US1] Crear src/supabase/migrations/20261021000600_rpc_acreditar_pago.sql: `acreditar_pago` según contracts/rpc.md (`ON CONFLICT DO NOTHING`, `FOR UPDATE` sobre el período, precondiciones, devuelve `jsonb`, exige `rol_actual() = 'TESORERIA'` o `service_role`), con `REVOKE` y `GRANT`
- [ ] T068 [US1] Implementar src/packages/infrastructure/supabase/registro-de-pagos.ts (llama a `rpc('acreditar_pago')` y valida el `jsonb` con Zod)
- [ ] T069 [P] [US1] Implementar src/packages/infrastructure/supabase/registro-de-cargas.ts
- [ ] T070 [US1] Crear src/packages/infrastructure/supabase/registro-de-pagos.contrato.test.ts y src/packages/infrastructure/supabase/registro-de-cargas.contrato.test.ts (corren los contratos de T055 y T056 contra Supabase local)
- [ ] T071 [US1] Crear src/apps/web/http/esquemas/pagos.ts (Zod de `PagoInformado[]`: DNI, número, monto en centavos, fecha de pago y referencia)
- [ ] T072 [US1] Crear src/apps/web/app/api/pagos/acreditaciones/route.ts (POST) y src/apps/web/app/api/pagos/route.ts (GET `?estado=`), según contracts/api-http.md
- [ ] T073 [US1] Crear la bandeja de pagos de Tesorería y Secretaría en src/apps/web/app/(paneles)/(personal)/personal/pagos/page.tsx (listados `NO_IMPUTADO` con su motivo y `DEVUELTO`, más las cargas de informe)

**Checkpoint**: US1 funciona sola: importar, acreditar, idempotencia y bandeja.

---

## Phase 4: User Story 2 - Cada aspirante tiene su propio plazo para pagar (Priority: P1)

**Goal**: el aspirante crea su Postulación e inicia el pago con un vencimiento propio; ve la fecha límite y el aviso
de que su lugar no está reservado; al vencer, la Postulación se informa como `VENCIDO` sin tocar los cupos.

**Independent Test**: con un `RelojFijo`, se inicia el pago, se avanza el reloj más allá de `vence_el` y la
consulta da `VENCIDO` con la misma ocupación; el reintento da un `vence_el` nuevo.

### Tests for User Story 2 ⚠️

- [x] T074 [P] [US2] Escribir src/packages/application/casos-de-uso/crear-postulacion.test.ts (solo `ASPIRANTE` y para sí mismo; período cerrado → `PeriodoCerrado`; duplicada activa → error)
- [x] T075 [P] [US2] Escribir src/packages/application/casos-de-uso/iniciar-pago.test.ts (`vence_el = min(ahora + plazo, cierre)`; sin cupos → `SinCuposParaIniciar`, FR-011; reintento desde `VENCIDO`; `conflicto` en `guardarTransicion`)
- [x] T076 [P] [US2] Escribir src/packages/application/casos-de-uso/consultar-postulacion.test.ts (estado efectivo perezoso, aviso "tu lugar no está reservado" en `PAGO_PENDIENTE`, "tu pago está en revisión" en `PAGO_EN_REVISION`, número formateado, solo la propia o el personal)

### Implementation for User Story 2

- [x] T077 [US2] Implementar src/packages/application/casos-de-uso/crear-postulacion.ts (hasta que pase T074)
- [x] T078 [US2] Implementar src/packages/application/casos-de-uso/iniciar-pago.ts (persiste `VENCIDO` si corresponde antes del reintento; hasta que pase T075)
- [x] T079 [US2] Implementar src/packages/application/casos-de-uso/consultar-postulacion.ts (devuelve un DTO con el estado efectivo, `venceEl`, el número y el aviso; hasta que pase T076)
- [x] T080 [US2] Crear src/apps/web/http/esquemas/postulaciones.ts (Zod de `{ periodoId }` y de los parámetros de ruta)
- [x] T081 [US2] Crear src/apps/web/app/api/postulaciones/route.ts (POST), src/apps/web/app/api/postulaciones/mias/route.ts, src/apps/web/app/api/postulaciones/[id]/route.ts y src/apps/web/app/api/postulaciones/[id]/iniciar-pago/route.ts, según contracts/api-http.md
- [ ] T082 [US2] Crear la vista del aspirante en src/apps/web/app/aspirante/postulacion/page.tsx (número de Postulación, estado, fecha límite y aviso; FR-007 y SC-005)

**Checkpoint**: US1 y US2 funcionan juntas: el recorrido "crear → iniciar pago → acreditar" de punta a punta.

---

## Phase 5: User Story 5 - Dirección decide los pagos excepcionales desde su panel (Priority: P1)

**Goal**: los pagos fuera de plazo o sin cupo quedan `A_DECIDIR` y aparecen en el panel de Dirección, que acepta
(confirma, aunque exceda el cupo) o rechaza (`VENCIDO` y pago `DEVUELTO`), con trazabilidad.

**Independent Test**: un período sin cupos libres; un pago en plazo queda `A_DECIDIR` con `SIN_CUPO`; si Dirección
lo acepta, la ocupación supera el total y queda la decisión registrada; una segunda decisión devuelve `conflicto`.

### Tests for User Story 5 ⚠️

- [ ] T083 [P] [US5] Escribir src/packages/application/casos-de-uso/decidir-pago-excepcional.test.ts (aceptar `SIN_CUPO` excede el cupo; rechazar deja `VENCIDO` y `DEVUELTO`; un rol distinto de `DIRECCION` → `NoAutorizado`; doble decisión → `conflicto`)
- [ ] T084 [P] [US5] Agregar a src/packages/application/puertos/registro-de-pagos/contrato.ts los casos de `registrarDecision` de contracts/puertos.md (aceptar sin cupo, rechazar, doble decisión)

### Implementation for User Story 5

- [x] T085 [P] [US5] Implementar src/packages/domain/pago/decision-de-direccion.ts y exportarlo en src/packages/domain/index.ts
- [ ] T086 [US5] Implementar `registrarDecision` en src/packages/application/puertos/registro-de-pagos/fake.ts (hasta que pase el contrato de T084 contra el fake)
- [ ] T087 [US5] Implementar src/packages/application/casos-de-uso/decidir-pago-excepcional.ts (hasta que pase T083)
- [ ] T088 [US5] Crear src/supabase/migrations/20261021000700_rpc_decidir_pago_excepcional.sql según contracts/rpc.md (`FOR UPDATE` sobre el pago y la Postulación, exige `rol_actual() = 'DIRECCION'`, inserta en `decisiones_de_direccion`, sin comparar contra el total al aceptar), con `REVOKE` y `GRANT`
- [ ] T089 [US5] Implementar `registrarDecision` en src/packages/infrastructure/supabase/registro-de-pagos.ts y verificar que src/packages/infrastructure/supabase/registro-de-pagos.contrato.test.ts pasa con los casos nuevos
- [ ] T090 [US5] Crear src/apps/web/app/api/pagos/[id]/decision/route.ts, con su Zod en src/apps/web/http/esquemas/pagos.ts
- [ ] T091 [US5] Crear el panel de Dirección en src/apps/web/app/(paneles)/(personal)/direccion/casos/page.tsx (casos `A_DECIDIR` con motivo, fecha de pago, vencimiento y ocupación actual del período, más los botones aceptar y rechazar con comentario)

**Checkpoint**: las tres historias P1 funcionan; se puede recorrer la sección 5 de quickstart.md hasta el paso 7.

---

## Phase 6: User Story 3 - Secretaría define períodos de ingreso con cupos y ve la ocupación (Priority: P2)

**Goal**: `SECRETARIA` y `DIRECCION` crean y modifican períodos, y el personal ve ocupados, pendientes vigentes y
libres.

**Independent Test**: se crea un período, se confirman K vacantes y quedan M pendientes vigentes; el resumen da K,
M y N − K; bajar el total por debajo de K falla.

### Tests for User Story 3 ⚠️

- [x] T092 [P] [US3] Escribir src/packages/application/casos-de-uso/crear-periodo.test.ts y src/packages/application/casos-de-uso/modificar-periodo.test.ts (roles; `CuposPorDebajoDeConfirmadas`)
- [x] T093 [P] [US3] Escribir src/packages/application/casos-de-uso/periodos-consulta.test.ts (ocupados, pendientes vigentes sin las vencidas, libres y exceso con libres negativos)
- [x] T093b [P] [US3] Escribir src/packages/application/casos-de-uso/listar-periodos-abiertos.test.ts (solo los de la institución del actor y abiertos según el reloj; sin actor → `NoAutorizado`)

### Implementation for User Story 3

- [x] T094 [US3] Implementar src/packages/application/casos-de-uso/crear-periodo.ts y src/packages/application/casos-de-uso/modificar-periodo.ts (hasta que pase T092)
- [x] T095 [US3] Implementar src/packages/application/casos-de-uso/consultar-ocupacion.ts (hasta que pase T093)
- [x] T095b [US3] Implementar src/packages/application/casos-de-uso/listar-periodos-abiertos.ts (hasta que pase T093b)
- [x] T096 [US3] Crear src/apps/web/http/esquemas/periodos.ts, src/apps/web/app/api/periodos/route.ts (GET con `ListarPeriodosAbiertos` y POST), src/apps/web/app/api/periodos/[id]/route.ts (PATCH) y src/apps/web/app/api/periodos/[id]/ocupacion/route.ts
- [ ] T097 [US3] Crear la gestión de períodos en src/apps/web/app/personal/periodos/page.tsx (alta y edición, más la ocupación por período)

**Checkpoint**: los períodos se gestionan desde la app y ya no dependen del seed.

---

## Phase 7: User Story 4 - Alta segura de usuarios dentro de una institución (Priority: P2)

**Goal**: el registro siempre crea un `ASPIRANTE` de la institución activa, nunca acepta un rol de la metadata y
falla si faltan datos. El trigger ya existe por T018; esta fase lo prueba y agrega el borde con Zod.

**Independent Test**: un `signUp` con `role: 'TESORERIA'` en la metadata termina en un perfil `ASPIRANTE` de `FRH`;
un `signUp` sin DNI falla.

### Tests for User Story 4 ⚠️

- [x] T098 [P] [US4] Escribir src/packages/infrastructure/supabase/registro.contrato.test.ts, que cubre la tabla de la sección 4 de quickstart.md: el rol de la metadata se ignora, sin DNI falla, dos registros sin DNI fallan los dos sin dejar un perfil con `dni = ''`, y el cambio de email se sincroniza
> Los cuatro casos que leen `public.perfiles` necesitan `SUPABASE_TEST_SERVICE_ROLE_KEY`: sin esa clave se saltan (el rol `anon` no tiene SELECT sobre esa tabla).

### Implementation for User Story 4

- [x] T099 [US4] Crear src/apps/web/http/esquemas/registro.ts (Zod con los campos obligatorios del perfil; sin campo de rol)
- [x] T100 [US4] Crear el registro del aspirante en src/apps/web/app/registro/page.tsx, con una server action que valida con T099 y llama a `signUp` solo con los datos personales en la metadata

**Checkpoint**: las cinco historias están completas.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T101 [P] Actualizar src/supabase/README.md (las migraciones nuevas, cómo correr `pnpm test:contratos` contra la base local, y el seed con las cuentas de personal)
- [ ] T102 [P] Actualizar src/packages/domain/postulacion/README.md, src/packages/domain/pago/README.md y src/packages/infrastructure/supabase/README.md con el modelo final
- [ ] T103 Verificar que las puertas de calidad de la CI (las de la tarjeta "Config de Vitest y CI") pasan en el PR: `pnpm lint`, `pnpm typecheck` y `pnpm test` (Principio IV: sin `any`; la regla de límites entre capas)
- [ ] T104 Recorrer specs/001-postulacion-plazo-cupos/quickstart.md completo (secciones 1 a 5), medir que importar un informe de unas 200 filas tarda menos de 30 s (meta de plan.md) y adjuntar la salida de la sección 3 (contratos contra Supabase local) al PR del adaptador
- [ ] T105 Coordinar con el autor del PR 76 su cierre en favor de los PRs de esta feature (comentario en el PR que enlace a specs/001-postulacion-plazo-cupos/spec.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (fase 1)**: T001 y T002 bloquean T017 (el backfill de períodos). Las tareas de ADR (T006 a T010) son
  independientes del código.
- **Foundational (fase 2)**: depende de T003 a T005 y T013 a T015. Las tareas de base de datos (T016 a T022) no
  necesitan Vitest. **Desde T023 (dominio) en adelante, depende de la tarjeta "Config de Vitest y CI" mergeada.**
  Bloquea todas las historias.
- **US1 (fase 3)**: depende de la fase 2. Es el MVP.
- **US2 (fase 4)**: depende de la fase 2. No depende de US1 para probarse (los tests usan fakes sembrados), pero el
  recorrido de punta a punta las combina.
- **US5 (fase 5)**: depende de US1 (extiende `RegistroDePagos`, `evaluarPago` ya produce `REVISION` y usa la RPC
  de acreditación).
- **US3 (fase 6)**: depende de la fase 2. Es independiente de las demás.
- **US4 (fase 7)**: depende de T018 (el trigger). Es independiente de las demás.
- **Polish (fase 8)**: al final.

### Within Each User Story

- Los tests (incluido el `contrato.ts`) se escriben primero y tienen que fallar.
- Dominio → puerto y fake → caso de uso → migración y RPC → adaptador → route handler → UI.
- El orden de las migraciones es el de sus timestamps: 0100 a 0500 en la fundación, 0600 en US1 y 0700 en US5.
  Difiere del orden escrito en plan.md porque el registro estricto tiene que ir justo después de `NOT NULL
  institucion_id`, y cada RPC va con la historia que la usa.

### Parallel Opportunities

- Fase 1: T006, T007, T008 y T010 (ADRs y docs); T013, T014 y T015 (dependencias).
- Fase 2: los tests del dominio T023 a T025 entre sí, y las implementaciones T027 a T029, T031 y T032; T034 y
  T034b; los contratos T035, T036, T039b y T039c; T050 a T052.
- Una vez terminada la fase 2: **US1, US3 y US4 se pueden hacer en paralelo** entre distintos integrantes. US2
  también, en paralelo con US1. US5 espera a US1.

---

## Parallel Example: User Story 1

```text
# Tests (todos juntos, archivos distintos):
T054 evaluar-pago.test.ts
T055 registro-de-pagos/contrato.ts
T056 registro-de-cargas/contrato.ts
T057 acreditar-pago.test.ts
T058 importar-informe-de-pagos.test.ts
T059 listar-bandeja.test.ts

# Después, en paralelo:
T060 pago.ts + carga-de-informe.ts
T062 registro-de-pagos (puerto + fake)
T063 registro-de-cargas (puerto + fake)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 (Setup) y fase 2 (Foundational).
2. Fase 3 (US1). **Parar y validar**: importar un informe de prueba, idempotencia y último cupo en paralelo.
3. Demo: Tesorería carga los pagos y las vacantes se confirman solas.

### Correspondencia con PRs chicos (Constitución: PRs chicos hacia `develop`)

| PR | Tareas | Aprobación |
|---|---|---|
| A. ADRs y docs | T006 a T010 | **doble** (cambian la máquina de estados y un puerto) |
| B. Base | T001 a T005, T016 a T022 | uno |
| — | **Tarjeta "Config de Vitest y CI"** (fuera de esta feature) | según la tarjeta |
| C. Dependencias + dominio base | T013 a T015, T023 a T033 | **doble** (domain) |
| D. Puertos base + adaptadores + web base | T034 a T053 (incluye T034b, T039b, T039c y T047b) | **doble** (puertos) |
| E. US1 | T054 a T073 | **doble** (puerto nuevo) |
| F. US2 | T074 a T082 | uno |
| G. US5 | T083 a T091 | **doble** (cambia un puerto) |
| H. US3 | T092 a T097 | uno |
| I. US4 | T098 a T100 | uno |
| J. Cierre | T101 a T105 | uno |

El PR B se puede mergear antes que el C: el esquema nuevo no rompe nada porque la app todavía usa fakes. Entre el
B y el C va la tarjeta de Vitest y CI, así que desde el primer test del dominio la CI ya bloquea.

---

## Notes

- [P] = archivos distintos y sin dependencias pendientes.
- Un commit por tarea o por grupo lógico, con conventional commits.
- Una migración ya mergeada no se edita: se corrige con otra (ADR-0004).
- Los contratos contra Supabase local no corren en la CI (research R4): son requisito de los PR E y G.
