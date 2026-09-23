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
| [0002](0002-disenar-para-multi-institucion.md) | Diseñar para multi-institución | Aceptado |

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
