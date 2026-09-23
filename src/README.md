# src

Código fuente de la solución.

## Estado

🚧 **Sin código todavía.** El proyecto está en fase de **discovery** (ver
[`../docs/discovery/`](../docs/discovery/)). La construcción arranca cuando cierre
el descubrimiento y se defina el stack.

## Arquitectura

La solución seguirá **arquitectura hexagonal** (puertos y adaptadores), según
[ADR-0001](../docs/decisions/0001-usar-arquitectura-hexagonal.md): el dominio
aislado en el centro, la infraestructura y la UI como adaptadores
intercambiables.

## Por qué esta carpeta está (casi) vacía

La estructura interna (`domain/`, `application/`, `infrastructure/`, ...) **no se
define todavía a propósito**: su forma concreta depende del lenguaje y framework,
que aún no se eligieron (ver §6.2 del `DOCUMENTO-SEGUIMIENTO`). Anticipamos el
cambio en el **diseño** (ADR-0001), no lo pagamos en la **estructura** hasta que
haya código real. Ver también [ADR-0002](../docs/decisions/0002-disenar-para-multi-institucion.md).

## Próximo paso

Al elegir el stack, se documenta el layout hexagonal concreto en
[`../docs/architecture/`](../docs/architecture/) (y, si amerita, un ADR nuevo) y
recién ahí se crea la estructura de carpetas.
