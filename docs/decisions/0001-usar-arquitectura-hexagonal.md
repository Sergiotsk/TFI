# 0001 - Usar arquitectura hexagonal

## Estado

Aceptado

## Contexto

El proyecto digitaliza el proceso de inscripción de ingresantes, hoy sostenido
por una cadena de sistemas desconectados (formulario, Drive, Excel, mail) más una
caja negra externa (SYSACAD). Del relevamiento surgen dos restricciones fuertes:

- La solución debe ser un **único punto de verdad** con trazabilidad auditable,
  independiente de las herramientas concretas que hoy usa Secretaría.
- La integración con sistemas externos (SYSACAD y otros) puede cambiar o quedar
  fuera de alcance, y **no debe contaminar el núcleo** del negocio.
- Se proyecta escalar de sitio web a app, y potencialmente a otras instituciones
  (ver [ADR-0002](0002-disenar-para-multi-institucion.md)).

La nota inicial del equipo ya apuntaba a esto: *"aislar el núcleo/dominio de la
idea, pudiendo cambiar los componentes de la app a futuro"*.

## Decisión

Adoptamos **arquitectura hexagonal** (puertos y adaptadores): el dominio y los
casos de uso quedan en el centro, sin dependencias de frameworks, base de datos
ni servicios externos. Todo lo de afuera (UI web, persistencia, integraciones)
entra a través de **puertos** implementados por **adaptadores** intercambiables.

## Consecuencias

- ✅ El dominio (reglas del proceso de inscripción) queda aislado y testeable sin
  base de datos ni frameworks.
- ✅ Cambiar un componente (ej. web → app, o cambiar el mecanismo de
  persistencia) no toca el núcleo.
- ✅ Las integraciones externas viven en adaptadores; si una queda fuera de
  alcance, el núcleo no se entera.
- ⚠️ Más *boilerplate* y ceremonia inicial (puertos, adaptadores, mapeos).
- ⚠️ Exige disciplina del equipo para no filtrar detalles de infraestructura
  hacia el dominio.
