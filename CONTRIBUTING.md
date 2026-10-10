# Cómo contribuir

Convenciones para aportar al repositorio. Se desprenden de la
[constitución](.specify/memory/constitution.md) (sección *Flujo de desarrollo y calidad* y
*Governance*); si algo de acá la contradice, rige la constitución.

## Antes de empezar

- Leé la [constitución](.specify/memory/constitution.md): son las reglas del proyecto.
- Si vas a escribir código, leé la
  [guía de estructura del código](docs/architecture/estructura-codigo.md).
- Tomá una tarjeta del tablero (GitHub Projects) antes de arrancar, así nadie duplica trabajo.

## Ramas

| Rama | Para qué | Quién escribe |
|---|---|---|
| `main` | Entregas | Solo por PR desde `develop` |
| `develop` | Integración | Solo por PR desde ramas de trabajo |
| `feature/*` | Funcionalidad nueva | Vos, desde `develop` |
| `fix/*` | Corrección de un error | Vos, desde `develop` |
| `test/*` | Tests | Vos, desde `develop` |

**Nadie hace commit directo a `main` ni a `develop`.**

## Flujo de trabajo

```bash
git switch develop
git pull
git switch -c feature/nombre-corto      # o fix/..., test/...

# ...trabajás y commiteás...

git push -u origin feature/nombre-corto
# abrís el PR hacia develop
```

Si `develop` avanzó mientras trabajabas, actualizá tu rama antes de pedir revisión.

## Pull Requests

- **Hacia `develop`**, y **chicos**: un PR, un tema. Es más fácil de revisar y de deshacer.
- **Descripción** con qué cambia y cómo probarlo.
- **Revisión**: al menos un compañero tiene que aprobar. Se pide revisión; no hay dueños de áreas.
- **Merge con Squash**: cada PR queda como un solo commit en `develop`.
- **Quien revisa verifica que se cumpla la constitución.** Si el PR agrega complejidad, tiene que
  justificarla.

### Cambios en el núcleo

Los cambios en `packages/domain` o en los puertos necesitan **dos aprobaciones**. Si modifican un
contrato existente, además van con un **ADR** en [`docs/decisions/`](docs/decisions/).

### Puertas de calidad

Un PR no se mergea si falla alguna de estas verificaciones en CI:

- `tsc --noEmit`
- ESLint, incluida la regla de límites entre capas y la prohibición de `any`
- Vitest

## Commits

El formato de los mensajes de commit todavía no está definido (pendiente en la constitución,
`TODO(COMMITS)`). Mientras tanto: mensajes claros, en castellano, que digan qué cambia.

## Decisiones de arquitectura

Toda decisión de arquitectura se registra como ADR en [`docs/decisions/`](docs/decisions/), con su
contexto y consecuencias. Usá los ADR existentes como modelo.

## Cambios a la constitución

Se proponen por PR revisado por el equipo e incluyen:

- la justificación del cambio;
- si hace falta, un plan para migrar el código existente;
- la versión nueva, según versionado semántico: **MAJOR** si se quita o redefine un principio de
  forma incompatible, **MINOR** si se agrega un principio o se amplía una guía, **PATCH** si es una
  aclaración.

## Seguridad y datos

- **Nunca** subas secretos, tokens ni archivos `.env`. Usá `.env.example` con valores falsos.
- El esquema de la base se cambia **solo con migraciones** de Supabase CLI en el repo.
- Los datos personales de los aspirantes (DNI, analíticos, fotos) están protegidos por la
  Ley 25.326: no los uses en ejemplos, tests ni capturas.
