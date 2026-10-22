# Decisiones de arquitectura (ADRs)

Un **ADR** (Architecture Decision Record) registra una decisión técnica
importante **junto con su contexto**: por qué se tomó, qué alternativas había y
qué consecuencias trae.

## Reglas

- **Inmutables.** No se editan. Si una decisión cambia, se escribe un ADR nuevo
  que *supersede* al anterior.
- **Numerados** en orden (`0001`, `0002`, ...).
- **Cortos.** Contexto → Decisión → Consecuencias.

## Índice

| # | Título | Estado |
|---|---|---|
| [0001](0001-usar-arquitectura-hexagonal.md) | Usar arquitectura hexagonal | Aceptado |
| [0002](0002-disenar-para-multi-institucion.md) | Diseñar para multi-institución | Aceptado (supersedido parcialmente por [0006](0006-instituciones-en-el-esquema.md) en lo que respecta al esquema) |
| [0003](0003-src-como-raiz-del-workspace.md) | `src/` como raíz del workspace, con paquetes planos | Aceptado |
| [0004](0004-migraciones-por-integracion-github.md) | Migraciones al remoto por la integración de GitHub de Supabase | Aceptado |
| [0005](0005-excepciones-de-vacante-decide-direccion.md) | Los pagos excepcionales los decide Dirección, caso por caso | Aceptado |
| [0006](0006-instituciones-en-el-esquema.md) | La institución como dato del esquema desde ahora | Aceptado |
| [0007](0007-renombrar-procedure-a-postulacion.md) | Renombrar Procedure a Postulación y alinear los roles | Aceptado |

## Plantilla

```markdown
# NNNN - Título de la decisión

## Estado
Propuesto | Aceptado | Supersedido por [XXXX](...)

## Contexto
Qué problema/restricción motivó la decisión.

## Decisión
Qué decidimos hacer.

## Consecuencias
- ✅ Beneficios
- ⚠️ Costos / trade-offs
```
