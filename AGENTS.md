# AGENTS.md

Instrucciones para agentes de código (Claude Code, Codex, Cursor, Copilot, etc.) que trabajen en
este repositorio. Es un resumen: la fuente de verdad es la constitución.

## Leer antes de tocar código

1. [`.specify/memory/constitution.md`](.specify/memory/constitution.md): principios del proyecto.
   Ante cualquier duda o contradicción con este archivo, **rige la constitución**.
2. [`docs/architecture/estructura-codigo.md`](docs/architecture/estructura-codigo.md): dónde va
   cada cosa, la regla de dependencias y el orden para agregar una feature.
3. [`docs/architecture/overview.md`](docs/architecture/overview.md): diagramas de la arquitectura,
   paquetes, estados de la Postulación e integración con la facultad.
4. [`docs/decisions/`](docs/decisions/): ADRs (decisiones de arquitectura con su contexto).

## Proyecto

Sistema de ingreso a la Tecnicatura Universitaria en Programación (UTN FRH). Regla central del
negocio: **pago acreditado = vacante confirmada**; la documentación se revisa después.

## Reglas no negociables

- **Arquitectura hexagonal** en un monorepo pnpm:
  - `packages/domain`: entidades, reglas y máquina de estados. Sin dependencias externas.
  - `packages/application`: casos de uso y puertos (interfaces). Solo depende de `domain`.
  - `packages/infrastructure`: adaptadores (Supabase, lector del informe de pagos, exportador,
    Pagos360, mail). Implementa los puertos.
  - `apps/web`: Next.js, adaptador de entrada y raíz de composición.
- **Las dependencias apuntan siempre hacia `domain`.** Un puerto es un contrato que define
  `application` e implementa `infrastructure`; no es una definición de tipos ni un DTO.
- **No poner reglas de negocio** en route handlers, controllers, componentes de UI ni adaptadores.
  Las reglas viven en `domain`; la orquestación, en los casos de uso.
- **TypeScript estricto**; `any` está prohibido.
- **Zod solo en los bordes** (`apps/web`, `infrastructure`), nunca en `packages/domain`.
- **Tipos generados por Supabase** solo en `infrastructure`, mapeados a entidades del dominio.
- **Cada puerto** tiene un fake en memoria y una suite de tests de contrato (Vitest). Dominio y
  casos de uso se testean con fakes, sin red ni base de datos.
- **Lenguaje ubicuo**: la entidad es `Postulación`. No usar "Legajo" (es un concepto de SysAcad).
- **Integración con la facultad solo por archivo**: nunca leer ni escribir en las bases de SysAdmin
  o SysAcad.
- **Mercado Pago está prohibido** por la institución. El cobro digital va detrás del puerto
  `PasarelaDePago`.
- **Fuera del MVP**: OCR, LLM para feedback, integración directa con SysAcad, mails automáticos al
  pagador. No agregarlos sin un ADR.
- **Seguridad**: nunca commitear secretos ni `.env` (usar `.env.example`). La autorización por rol
  se verifica en los casos de uso; RLS es una segunda barrera, no la única. Datos personales bajo
  Ley 25.326. Cambios de esquema solo como migraciones de Supabase CLI.

## Flujo de trabajo

Detalle completo en [`CONTRIBUTING.md`](CONTRIBUTING.md).

- Ramas `feature/*`, `fix/*`, `test/*` desde `develop`. Nunca commitear directo a `main` ni a
  `develop`.
- PR chicos hacia `develop`, con merge Squash. Cambios en `packages/domain` o en puertos requieren
  dos aprobaciones y, si cambian un contrato, un ADR.
- Antes de proponer un PR deben pasar `tsc --noEmit`, ESLint (con la regla de límites entre capas)
  y Vitest.

## Spec Kit

Es una herramienta opcional. En el repo se versionan solo la constitución y, cuando existan, las
specs de cada feature en `specs/`. No hace falta tenerlo instalado para trabajar.
