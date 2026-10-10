# Arquitectura

Visión técnica de la solución: cómo se estructura el software y por qué.

> Las **decisiones** con su contexto viven como ADRs en
> [`../decisions/`](../decisions/). Acá va la **vista** consolidada (diagramas,
> capas, componentes) que esos ADRs producen.

## Contenido

- [`overview.md`](./overview.md) — flujo invertido, hexagonal, paquetes del monorepo y sus
  dependencias, estados de la Postulación e integración con la facultad.
- [`estructura-codigo.md`](./estructura-codigo.md) — guía práctica del código: árbol del monorepo,
  regla de dependencias, puertos vs. tipos, un caso de punta a punta y cómo agregar una feature.
- [`secuencia-pago.md`](./secuencia-pago.md) — pago en ventanilla, informe de SysAdmin cargado por Tesorería,
  carga diaria del informe de pagos y alternativa Pagos360 (por confirmar).

### Cómo editar los diagramas

Los diagramas son bloques ` ```mermaid ` dentro de cada `.md`, así que se editan en el lugar y
GitHub los renderiza. El estilo (paleta azul marino, clusters oscuros, punteado para lo pendiente)
va en la línea `%%{init: ...}%%` de cada bloque y en los `classDef`; copiar esos de un diagrama
existente para mantener la coherencia. El fondo es transparente (el de la página).

Para previsualizar o exportar uno, pegar el bloque en [mermaid.live](https://mermaid.live).

### Pendiente

- Despliegue (Vercel + Supabase): esperar a consultar el alojamiento con Sistemas.
- DER y otros diagramas de apoyo, a medida que se necesiten.

## Decisiones relevantes

- [ADR-0001 — Arquitectura hexagonal](../decisions/0001-usar-arquitectura-hexagonal.md)
- [ADR-0002 — Multi-institución](../decisions/0002-disenar-para-multi-institucion.md)
