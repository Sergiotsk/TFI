# Documentación del proyecto

Índice maestro de la documentación. Acá vive el trabajo; el
`DOCUMENTO-SEGUIMIENTO-PROYECTO.md` es la **foto** que se compila en PDF para la
entrega de la cátedra.

## Cómo está organizado

| Carpeta / archivo | Qué contiene | Naturaleza |
|---|---|---|
| [`discovery/`](discovery/) | Descubrimiento con **Design Thinking**: entrevistas e ideación | 📸 Se hace y se cierra |
| [`decisions/`](decisions/) | **ADRs** — decisiones de arquitectura con su contexto | 🫀 Vivo, crece |
| [`product/`](product/) | Historias de usuario y cómo se gestiona el backlog | 🫀 Vivo |
| [`architecture/`](architecture/) | Visión técnica: diagramas (hexagonal, paquetes, estados, pagos) y [guía de estructura del código](architecture/estructura-codigo.md) | 🫀 Vivo |
| `DOCUMENTO-SEGUIMIENTO-PROYECTO.md` | Entregable formal (formato cátedra) | 📸 Foto → PDF final |
| [`_referencias/`](_referencias/) | Material de apoyo: ejemplo SADA y transcripción cruda de la entrevista con Sistemas y Administración | Referencia |

### Fuera de `docs/`

| Archivo | Qué contiene |
|---|---|
| [`constitution.md`](../.specify/memory/constitution.md) | Reglas del proyecto: principios, stack y flujo de trabajo |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Cómo aportar: ramas, Pull Requests y revisiones |
| [`AGENTS.md`](../AGENTS.md) | Instrucciones para agentes de código |

## Regla de oro: una sola fuente de verdad

Cada dato vive en **un solo lugar**:

- **Tablero de tareas** → GitHub Projects (no se duplica en `.md`).
- **Backlog / historias de usuario** → ver [`product/`](product/).
- **Reglas del proyecto** → la [constitución](../.specify/memory/constitution.md).
- **Decisiones de arquitectura** → ver [`decisions/`](decisions/).
- El **documento de la cátedra** *refleja y resume* lo anterior; no es la fuente,
  es la vista que se congela en PDF al final.

## Estado del proyecto

- **Tema:** Gestión de ingresantes (UTN FRH — Equipo 5).
- **Etapa actual:** 🟢 Empatizar concluida (entrevistas con Director, Secretaría, Sistemas y
  Administración). Quedan detalles por ajustar (formato del informe de pagos, lista de
  confirmados) y arranca la construcción.
- **Visión:** posible producto para otras instituciones (ver
  [ADR-0002](decisions/0002-disenar-para-multi-institucion.md)).
