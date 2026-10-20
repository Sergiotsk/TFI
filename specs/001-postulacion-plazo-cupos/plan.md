# Implementation Plan: Postulación con plazo de pago y control de cupos

**Branch**: `fix/db-postulacion-pago` (desde `develop-db`) | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-postulacion-plazo-cupos/spec.md`

## Summary

Reemplazar el modelo de "reservas" del PR 76 por el ciclo de vida de la **Postulación**: el pago acreditado es la
única reserva de matrícula, cada aspirante tiene un plazo de pago propio con vencimiento perezoso, la ocupación de
cupos se deriva de las vacantes confirmadas, y los pagos fuera de plazo o sin cupo quedan en `PAGO_EN_REVISION`
para que Dirección decida caso por caso. Enfoque técnico: un corte vertical hexagonal (domain → application con
puertos, fakes y tests de contrato → adaptador de Supabase → route handlers delgados), migraciones incrementales
en español con RLS, y concurrencia optimista mediante una RPC que **garantiza** (con lock sobre el período) pero
**no decide**.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (`strict`), Node 24 (`engines: >=24 <25`)

**Primary Dependencies**: Next.js 16.4.1 y React 19.3.1 (`apps/web`). A agregar: `@supabase/supabase-js` (en
`infrastructure`), `@supabase/ssr` (en `web`), `zod` (en `web` e `infrastructure`; ya existe en la rama
`develop-landing`, conviene alinear la versión) y `vitest` (devDependency). Las versiones exactas se fijan al
instalar (research R3).

**Storage**: Supabase, PostgreSQL 17 (`src/supabase/config.toml`). Local con `supabase start`; remoto de
desarrollo vía la integración de GitHub desde `develop` (ADR-0004).

**Testing**: Vitest. Tests de unidad del dominio y los casos de uso con fakes (sin red ni base), y suites de
contrato (`contrato.ts`, patrón ya previsto en `eslint.config.mjs`) contra el fake (CI) y contra Supabase local
(requisito del PR del adaptador).

**Target Platform**: Vercel (app) + Supabase Cloud (datos).

**Project Type**: aplicación web, monorepo pnpm con capas hexagonales en `src/`.

**Performance Goals**: no son críticos. Entre 100 y 160 inscripciones por ciclo y un informe diario. Importar un
informe de unas 200 filas en menos de 30 s.

**Constraints**: concurrencia correcta sobre el último cupo (cero sobreventas no autorizadas); idempotencia total
de las acreditaciones; sin `pg_cron`; sin `service_role` fuera del webhook; migraciones mergeadas inmutables.

**Scale/Scope**: 1 institución, 2 ciclos por año, 4 roles. 8 tablas, 2 RPC, 3 triggers, 9 casos de uso y 4
puertos más `Reloj`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. Hexagonal con límites físicos** | Reglas, máquina de estados y `evaluarPago` en `packages/domain`. Puertos y casos de uso en `application`. Adaptador de Supabase y tipos generados en `infrastructure`. `apps/web` es la raíz de composición. Las RPC **verifican** precondiciones y no deciden (contracts/rpc.md). La regla de límites ya existe en `eslint.config.mjs`. | ✅ |
| **II. Pago acreditado = vacante; máquina explícita** | Máquina de estados en el dominio con transiciones que lanzan `TransicionInvalida`. Las excepciones (fuera de plazo, sin cupo) **no** rompen la regla: no se acreditan solas, las decide Dirección. Lenguaje ubicuo: `Procedure` pasa a `Postulacion`. | ✅ con ADR (Complexity Tracking) |
| **III. Fakes y contratos** | Cada puerto tiene `fake.ts` y `contrato.ts`; el contrato corre contra el fake y contra Supabase local; el caso del último cupo en paralelo está incluido. | ✅ (en CI corre solo contra el fake, research R4) |
| **IV. TS estricto y Zod en los bordes** | Zod en los route handlers, el formulario de registro y la lectura de las respuestas de las RPC en el adaptador. Ninguno en `domain`. Sin `any`. | ✅ |
| **V. Integración solo por archivo; Pagos360 detrás de un puerto** | `ImportarInformeDePagos` recibe filas ya validadas; el parser del archivo y el webhook quedan como adaptadores futuros (research R9). Sin acceso a SysAdmin ni a SysAcad. | ✅ |
| **VI. MVP sin overengineering** | Sin scheduler, contador ni lista de espera. Instituciones: tabla mínima, sin administración. | ⚠️ instituciones va con ADR (Complexity Tracking) |
| **VII. Seguridad** | Autorización en los casos de uso y RLS como segunda barrera (el JWT del usuario en el adaptador). Trigger de registro sin rol desde la metadata. `REVOKE` en todas las `SECURITY DEFINER`. Esquema solo por migraciones. | ✅ |
| **VIII. Identidad institucional** | Roles por función (`SECRETARIA`, `DIRECCION`); las etiquetas "Secretaría TUP" y "Director de la TUP" van en un único punto de configuración de `apps/web`. | ✅ |
| **Flujo: cambios en domain y puertos** | Cambia la máquina de estados y el puerto `RepositorioDeProcedure`: **doble aprobación + ADR**. | ⚠️ requiere 3 ADR (abajo) |

**Gate**: PASA, con las justificaciones de Complexity Tracking y los ADR como entregables de esta feature.

**Re-check después del diseño (fase 1)**: sin violaciones nuevas. El diseño agregó `numero` legible (research R6)
y `motivo_no_imputado`, que no agregan capas ni dependencias.

## Project Structure

### Documentation (this feature)

```text
specs/001-postulacion-plazo-cupos/
├── spec.md
├── plan.md              # este archivo
├── research.md          # decisiones D1–D9 + incógnitas R1–R9
├── data-model.md        # dominio, máquina de estados, esquema
├── quickstart.md        # validación de punta a punta
├── contracts/
│   ├── puertos.md       # interfaces + casos de contrato + casos de uso
│   ├── rpc.md           # RPC, triggers y policies (contrato, sin cuerpos)
│   └── api-http.md      # route handlers
├── checklists/requirements.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (`src/`)

```text
src/
├── packages/
│   ├── domain/
│   │   ├── postulacion/        postulacion.ts, estados.ts, evaluar-pago.ts, errores.ts, *.test.ts
│   │   ├── periodo/            periodo-de-ingreso.ts, *.test.ts
│   │   ├── pago/               monto.ts, pago.ts, referencia-de-pago.ts, *.test.ts
│   │   ├── perfil/             perfil.ts (reemplaza a user/, sin password)
│   │   ├── documento/          documento.ts (renombre de document/)
│   │   └── index.ts
│   ├── application/
│   │   ├── puertos/
│   │   │   ├── reloj/                          puerto.ts, fake.ts
│   │   │   ├── repositorio-de-postulaciones/   puerto.ts, fake.ts, contrato.ts (reemplaza a repositorio-de-procedure/)
│   │   │   ├── repositorio-de-periodos/        puerto.ts, fake.ts, contrato.ts
│   │   │   ├── registro-de-pagos/              puerto.ts, fake.ts, contrato.ts
│   │   │   └── registro-de-cargas/             puerto.ts, fake.ts, contrato.ts
│   │   ├── casos-de-uso/       un archivo por caso de uso + *.test.ts
│   │   └── index.ts
│   └── infrastructure/
│       └── supabase/           cliente (tipos), un adaptador por puerto, mapeadores, *.contrato.test.ts
├── apps/web/
│   ├── composition-root.ts     arma los adaptadores por request, con el cliente de la sesión
│   ├── config/institucion.ts   etiquetas de roles y marca (Principio VIII)
│   ├── http/                   schemas Zod + mapeo de errores a HTTP
│   └── app/api/                postulaciones/, periodos/, pagos/ (se elimina procedure/)
└── supabase/
    ├── migrations/             migraciones nuevas (se borra la del PR 76)
    └── seed.sql                datos locales: período de ejemplo y cuentas de personal
```

Se borran: `supabase/` en la raíz del repo, `src/supabase/migrations/20261020142058_add_instituciones_table.sql`,
`packages/domain/procedure/`, `application/puertos/repositorio-de-procedure/` y `apps/web/app/api/procedure/`.

**Structure Decision**: se respeta la estructura vigente (ADR-0003, `docs/architecture/estructura-codigo.md`).
Carpetas por concepto del dominio en español, y puertos con la terna `puerto.ts` / `fake.ts` / `contrato.ts`.

### Migraciones (orden)

Todas nuevas, incrementales sobre `init_schema` + `enable_rls`. Cada una lleva su RLS y sus `GRANT` (ADR-0004).

1. **`renombrar_a_espanol`**: tablas y columnas, enums nuevos con conversión `USING` (research R8), se elimina
   `procedure_documents` y se renombra la función de `actualizado_el`.
2. **`instituciones_y_periodos`**: `instituciones` (con `FRH`), `periodos_de_ingreso`, y en `perfiles` y
   `postulaciones` las columnas `institucion_id`, `periodo_id`, `numero`, `vence_el` y `motivo_revision`, con sus
   CHECK e índices.
3. **`registro_estricto`**: los triggers `crear_perfil_al_registrarse` y `sincronizar_email_de_perfil`; se
   elimina `handle_new_user`. Va **justo después** de la 2: si no, el `NOT NULL` de `institucion_id` rompe el
   signup con el trigger viejo.
4. **`pagos_cargas_y_decisiones`**: las tres tablas, con sus enums, `UNIQUE` y CHECK.
5. **`helpers_y_politicas_rls`**: `rol_actual`, `institucion_actual` y las policies por rol de todas las tablas.
6. **`rpc_acreditar_pago`** (con US1) y 7. **`rpc_decidir_pago_excepcional`** (con US5), con `REVOKE` y `GRANT`.

### Incrementos (PRs chicos hacia `develop`)

| # | PR | Contenido | Depende de |
|---|---|---|---|
| 0 | ADRs | ADR-0005 (excepciones de vacante: Dirección decide), ADR-0006 (instituciones, modifica la decisión del ADR-0002), ADR-0007 (renombre Procedure → Postulación). Actualizar `overview.md` con `PAGO_EN_REVISION` | — |
| 1 | Base | Las 6 migraciones + seed + borrar las del PR 76. Validación: quickstart §1 y §4 | 0 |
| 2 | Dominio | Vitest en el workspace; entidades, value objects, máquina de estados, `evaluarPago`, con tests | 0 |
| 3 | Application | Puertos, fakes, `contrato.ts`, casos de uso con tests; se borra `RepositorioDeProcedure` | 2 |
| 4 | Adaptador | `infrastructure/supabase` + los contratos contra la base local (quickstart §3) | 1, 3 |
| 5 | Web | `@supabase/ssr`, raíz de composición por request, route handlers con Zod, `config/institucion.ts`; se borra `api/procedure` | 4 |
| 6 | UI | Vista del aspirante (plazo y aviso), panel de Dirección, bandejas de Tesorería y Secretaría, ocupación | 5 |

El incremento 6 puede salir como una feature aparte (`002-...`) si el equipo prefiere separar la UI.

**Sobre el PR 76**: esta rama sale de `develop-db`. Cuando el incremento 1 esté listo, se propone cerrar el PR 76
y reemplazarlo por estos PRs, coordinándolo con su autor.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Tabla `instituciones` y `institucion_id` antes de que exista una segunda institución (Principio VI, ADR-0002) | Decisión del equipo: dejar la institución como dato de primer orden en el esquema ahora, que es barato, en lugar de migrar datos reales después. Mínimo: sin administración ni multi-tenancy en la UI | Una constante de configuración: se descartó porque obligaría a una migración de datos cuando entre otra institución. Se documenta en el ADR-0006 |
| Estado nuevo `PAGO_EN_REVISION` (modifica la máquina de estados del overview) | Sin reserva previa y con un informe diario, los pagos sin cupo o tardíos van a ocurrir. Un estado explícito evita que el aspirante vea "vencido" mientras Dirección decide | Una regla escondida en el vencimiento perezoso: se descartó porque es implícita y el aspirante seguiría viendo "pendiente". ADR-0005 |
| Lógica en SQL (dos RPC con locks) | `supabase-js` no tiene transacciones; el último cupo necesita atomicidad. La RPC solo **garantiza** precondiciones | `postgres.js` directo: dos clientes, el pooler y se saltea RLS. Contador con `CHECK`: dos fuentes de verdad (research R2) |
| Cambio de un puerto existente (`RepositorioDeProcedure`) | Alineación con el lenguaje ubicuo (Principio II). Hoy solo lo usan fakes, así que es el momento más barato | Mantener `Procedure` y traducir en el adaptador: es una traducción permanente y el modelo de estados es otro (no hay un mapeo 1 a 1). ADR-0007 |
