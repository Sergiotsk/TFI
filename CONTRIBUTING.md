# Cómo contribuir

Convenciones para aportar al repositorio. Se desprenden de la
[constitución](.specify/memory/constitution.md) (sección *Flujo de desarrollo y calidad* y
*Governance*); si algo de acá la contradice, rige la constitución.

## Antes de empezar

- Leé la [constitución](.specify/memory/constitution.md): son las reglas del proyecto.
- Si vas a escribir código, leé la
  [guía de estructura del código](docs/architecture/estructura-codigo.md).
- Tomá una tarjeta del tablero (GitHub Projects) antes de arrancar, así nadie duplica trabajo.

## Cómo tomar una tarjeta

1. Se toma **solo de `Listo`**, la de más arriba. Nunca directo del Backlog.
2. Antes de arrancar: asignate y movela a `En curso`.
3. Una tarjeta pasa de Backlog a `Listo` cuando:
   - es del incremento actual,
   - no tiene bloqueos abiertos (*blocked by*),
   - tiene "Cuándo está hecho",
   - tiene `Puntos`.
4. `Prioridad`:
   - **P0**: camino crítico o fecha de entrega.
   - **P1**: hace falta para cerrar el incremento.
   - **P2**: puede esperar.
   - Dentro de `Listo`, el orden de las tarjetas desempata.
5. Las dependencias se cargan como relación *blocked by* del issue, no solo en el texto.
6. El tablero mueve solo lo demás: un issue nuevo entra a `Backlog`, el PR vinculado lo pasa a
   `En revisión` y el merge o el cierre lo pasa a `Hecho` (ver [Pull Requests](#pull-requests)).

**Puntos**: medida relativa de esfuerzo + complejidad + incertidumbre, **no horas**.
- Escala: 1 · 2 · 3 · 5 · 8.
- Se estima entre todos; si algo da más de 8, se divide.

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

Los comandos de pnpm (`pnpm install`, `pnpm test`, `pnpm dev`) se corren desde `src/`, que es la
raíz del workspace.

## Pull Requests

- **Hacia `develop`**, y **chicos**: un PR, un tema. Es más fácil de revisar y de deshacer.
- **Descripción** con qué cambia y cómo probarlo, y **`Closes #NN`** con el issue que resuelve.
  Así queda vinculado: el tablero mueve la tarjeta a `En revisión` al abrirlo y a `Hecho` al
  mergearlo. Sin esa línea, la tarjeta no se mueve.
- **Abrilo cuando esté listo para revisar.** Un PR en borrador también vincula el issue y manda
  la tarjeta a `En revisión` antes de tiempo; si pasa, devolvela a mano a `En curso`.
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
