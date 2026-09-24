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
| [`architecture/`](architecture/) | Visión técnica: diagramas del hexagonal, capas, puertos | 🫀 Vivo |
| `DOCUMENTO-SEGUIMIENTO-PROYECTO.md` | Entregable formal (formato cátedra) | 📸 Foto → PDF final |
| [`_referencias/`](_referencias/) | Material de apoyo (no propio): ejemplo SADA | Referencia |

## Regla de oro: una sola fuente de verdad

Cada dato vive en **un solo lugar**:

- **Tablero de tareas** → GitHub Projects (no se duplica en `.md`).
- **Backlog / historias de usuario** → ver [`product/`](product/).
- **Decisiones de arquitectura** → ver [`decisions/`](decisions/).
- El **documento de la cátedra** *refleja y resume* lo anterior; no es la fuente,
  es la vista que se congela en PDF al final.

## Estado del proyecto

- **Tema:** Gestión de ingresantes (UTN FRH — Equipo 5).
- **Etapa actual:** 🔵 Empatizar (recolección de entrevistas).
- **Visión:** posible producto para otras instituciones (ver
  [ADR-0002](decisions/0002-disenar-para-multi-institucion.md)).
