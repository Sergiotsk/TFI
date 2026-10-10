<!--
Sync Impact Report
- Version change: 0.1.0 (borrador) -> 1.0.0 (RATIFICADA el 2026-10-10 al aprobarse el PR #19)
- Historial: (plantilla sin completar) -> 0.1.0 (borrador) -> 1.0.0 (ratificación, sin cambios de
  contenido respecto del borrador aprobado)
- Principios agregados: I a VIII
- Ajuste previo a la ratificación (2026-10-05): Principio V pasa de "exportación diaria" a
  importación del informe de pagos de SysAdmin por Tesorería (ver docs/architecture/overview.md).
  Alineados también el Principio II (acreditación por informe, no confirmación manual), el IV
  (el informe se valida con Zod) y el VI (lo excluido es la integración directa con SysAcad).
- Ajuste previo a la ratificación (2026-10-09): el Principio I explicita la regla de dependencias
  (todo apunta a `domain`; puertos ≠ tipos). La revisión de cambios en `domain` y puertos deja de
  depender de un rol individual y pasa a exigir doble aprobación + ADR si cambia un contrato.
  Redacción de la sección Stack corregida (MUST NOT).
- Secciones agregadas: Stack y restricciones técnicas; Flujo de desarrollo y calidad
- Secciones eliminadas: ninguna
- Pendientes diferidos (TODO):
  - TODO(DESIGN_MD): el DESIGN.md de UTN FRH todavía no existe (Principio VIII); definir ubicación.
  - TODO(RETENCION_DATOS): política de conservación de documentos de aspirantes sin respuesta.
  - TODO(EXCEPCIONES_VACANTE): confirmar con el Director si hay excepciones a "pago = vacante".
  - TODO(COMMITS): el equipo debe decidir si se exige un formato de commits verificable.
-->
# TFI — Sistema de Ingreso TUP (UTN FRH) Constitution

## Core Principles

### I. Arquitectura hexagonal con límites físicos (NON-NEGOTIABLE)

El núcleo del negocio MUST estar aislado de frameworks, base de datos y servicios externos
(ADR-0001). La estructura objetivo es un monorepo pnpm con estas capas y dependencias permitidas:

- `packages/domain`: entidades, reglas y máquina de estados. MUST NOT declarar dependencias de
  runtime externas.
- `packages/application`: casos de uso y **puertos** (interfaces). MUST depender solo de `domain`.
- `packages/infrastructure`: **adaptadores** (Supabase, lector de informes, exportador, Pagos360,
  mail). Implementa los puertos. Los tipos generados por Supabase MUST quedarse acá y mapearse a
  entidades del dominio.
- `apps/web`: Next.js. Es adaptador de entrada y raíz de composición (conecta puertos con
  adaptadores).

Las dependencias MUST apuntar siempre hacia `domain`. Los puertos son contratos que define
`application` y que implementa `infrastructure`; MUST NOT confundirse con simples definiciones de
tipos o DTOs.

El límite se hace cumplir con dos barreras: (1) un paquete no puede importar lo que no declara en
su `package.json`; (2) una regla de lint de límites entre capas que MUST fallar en CI.
Rationale: el valor de la hexagonal es poder cambiar Pagos360, Supabase o la UI sin tocar el
negocio; sin enforcement automático, la disciplina se pierde.

### II. Pago acreditado = vacante confirmada

Es la regla central del negocio (definida por el Director). Un pago acreditado, ya sea informado por
Pagos360 o acreditado por el informe de pagos de SysAdmin que carga Administración/Tesorería, MUST
convertir la Postulación en `VACANTE_CONFIRMADA`. El ciclo de vida de la Postulación MUST modelarse como una máquina de estados
explícita en `domain`, y las transiciones inválidas MUST ser imposibles de representar o rechazadas.
Cualquier excepción a esta regla requiere un ADR aprobado.
Lenguaje ubicuo: la entidad es **Postulación** (`ID de Postulación`). "Legajo" es un concepto de
SysAcad y MUST NOT usarse para nombrar entidades propias.

### III. Contratos primero: fakes y tests de contrato

Cada puerto MUST tener (a) un fake en memoria y (b) una suite de tests de contrato. Todo adaptador
real MUST pasar la suite de contrato de su puerto antes de integrarse. Los casos de uso y el dominio
MUST probarse con Vitest usando los fakes, sin red ni base de datos.
Rationale: permite que el equipo trabaje en paralelo contra contratos estables y valida adaptadores
sin revisión línea por línea.

### IV. TypeScript estricto y validación en los bordes

`strict: true` es obligatorio y `any` está prohibido (regla de ESLint que falla en CI). Todo dato
que cruce un borde del sistema MUST validarse en runtime con Zod: el informe de pagos de SysAdmin,
webhooks y archivos de Pagos360, formularios, variables de entorno. Los esquemas Zod MUST vivir en
los bordes (`apps/web`, `infrastructure`), nunca en `packages/domain`.
Rationale: los tipos se borran en runtime; un payload de pagos sin validar es una falsa seguridad.

### V. Integración con la facultad solo por archivo

El sistema MUST NOT leer ni escribir directamente en las bases de SysAdmin ni SysAcad (reglas
viven en la aplicación, no en la base; el proveedor puede romper la estructura sin aviso). La
integración es por **archivo**: Administración/Tesorería baja el informe de pagos de SysAdmin y lo
carga en el sistema con su login y su rol (una carga diaria, al final del día, según lo confirmado
por Administración; el formato del informe todavía no fue entregado). El formato del informe MUST validarse en el borde y estar desacoplado del dominio (un adaptador de importación).
La entrega de la lista de confirmados al sistema académico no está definida; si es por archivo,
va en un adaptador de exportación.
Además: no generar tareas manuales nuevas a los sectores, no duplicar información de sus sistemas,
y Mercado Pago MUST NOT usarse (prohibido por la institución). El cobro digital va por Pagos360
detrás del puerto `PasarelaDePago`, de modo que cambiar de pasarela sea cambiar un adaptador.

### VI. Simplicidad y MVP (anti-overengineering)

Se construye primero lo que valida la hipótesis del negocio. Quedan FUERA del MVP: OCR de
analíticos, LLM para feedback, conciliación de transferencias con OCR, agente Go contra SQL Server,
mails automáticos al pagador e integración directa con SysAcad (la lista de confirmados, si se
acuerda, va por archivo según el Principio V). Sumar complejidad fuera de esa lista MUST
justificarse con un ADR. El dominio MUST ser agnóstico de UTN (la "institución" es un concepto de
primer orden, ADR-0002), pero MUST NOT construirse multi-tenancy hasta que exista una segunda
institución real.

### VII. Seguridad y datos personales

Secretos, tokens y archivos `.env` MUST NOT subirse al repositorio; se usa `.env.example` con
valores falsos. Cada entorno MUST usar su propio proyecto Supabase. La autorización por rol
(Alumno, Secretaría TUP, Director, Administración/Tesorería) MUST verificarse en los casos de uso;
Row Level Security es una segunda barrera y MUST NOT ser la única. El tratamiento de datos
personales (DNI, analíticos, fotos) MUST respetar la Ley 25.326. El esquema de base MUST versionarse
como migraciones de Supabase CLI en el repo; no se permiten cambios manuales de esquema.

### VIII. Identidad visual institucional (propuesto, a confirmar por el equipo)

La identidad visual de la institución (colores, tipografía, tono) MUST documentarse en un
`DESIGN.md`, de modo que el sistema se perciba como parte del sitio de la institución aunque se
sirva desde otro dominio. Hoy existe una sola institución (UTN FRH); el soporte de varias se
anticipa en el diseño y no se construye hasta que exista una segunda (ADR-0002, Principio VI).

- Los tokens del `DESIGN.md` MUST implementarse como variables CSS del tema de Tailwind/shadcn.
- Los componentes de UI MUST usar tokens semánticos (`primary`, `background`, etc.) y MUST NOT
  hardcodear colores, nombres ni logos de una institución.
- El nombre y la marca de la institución MUST concentrarse en un único punto de configuración.
- Los componentes de UI MUST NOT contener reglas de negocio.
- Antes de usar logos o marca institucional se MUST contar con autorización de la facultad.

## Stack y restricciones técnicas

- **Lenguaje:** TypeScript (strict). **Framework:** Next.js. **Estilos:** Tailwind CSS + shadcn/ui
  (se agregan solo los componentes que se usen).
- **Datos:** Supabase (PostgreSQL, Auth, Storage). **Validación:** Zod. **Tests:** Vitest.
- **Calidad:** ESLint + Prettier + regla de límites entre capas. **Gestor:** pnpm, con versión de
  Node fijada (`engines` y `.nvmrc`). **Estructura:** monorepo con pnpm workspaces.
- **Hosting:** Vercel (aplicación) + Supabase Cloud (datos), para desarrollo y demo. Es una decisión
  del equipo basada en la inferencia de que un despliegue on-premise sería inviable (rechazo del
  agente de sincronización y acceso restringido a los sistemas de la facultad); **no fue consultado
  directamente con Sistemas**. La puesta en producción MUST contar con autorización institucional
  sobre el alojamiento de datos personales. El código específico de Vercel o Supabase MUST NOT
  usarse fuera de `packages/infrastructure` y `apps/web`.

## Flujo de desarrollo y calidad

- **Ramas:** `main` (entrega, solo PR desde `develop`), `develop` (integración), y ramas de trabajo
  `feature/*`, `fix/*`, `test/*` creadas desde `develop`. Nadie hace commit directo a `main` ni a
  `develop`.
- **Pull Requests:** chicos, hacia `develop`, con descripción de qué cambia y cómo probarlo, y
  merge con Squash. Al menos un compañero revisa.
- **Puertas de calidad en CI** (un PR no se mergea si falla alguna): `tsc --noEmit`, ESLint
  (incluida la regla de límites y la prohibición de `any`) y Vitest.
- **Cambios en `packages/domain` o en puertos** MUST contar con la aprobación de al menos dos
  integrantes del equipo (no solo uno, como el resto de los PR) y, si modifican un contrato
  existente, MUST registrarse en un ADR. El núcleo no se toca de pasada.
- **Decisiones de arquitectura** se registran como ADR en `docs/decisions/`.

## Governance

Esta constitución prevalece sobre otras prácticas del proyecto. Las enmiendas se proponen por Pull
Request revisado por el equipo y MUST incluir su justificación y, si corresponde, un plan de
migración del código existente. El versionado es semántico: MAJOR por remover o redefinir un
principio de forma incompatible, MINOR por agregar un principio o ampliar materialmente una guía,
PATCH por aclaraciones. Toda revisión de PR MUST verificar el cumplimiento de estos principios;
la complejidad adicional MUST justificarse. Spec Kit es una herramienta de apoyo; la constitución es
un artefacto del repositorio y rige para todo el equipo por igual.

**Version**: 1.0.0 | **Ratified**: 2026-10-10 | **Last Amended**: 2026-10-10
