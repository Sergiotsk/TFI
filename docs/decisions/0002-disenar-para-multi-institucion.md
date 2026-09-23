# 0002 - Diseñar para multi-institución

## Estado

Aceptado

## Contexto

El TFI se desarrolla para **UTN FRH**, pero el equipo lo concibe como un **posible
producto** para otras instituciones educativas con el mismo problema de gestión
de ingresantes. Esto cambia decisiones de diseño: un proyecto que nace pensando
en ser producto se diseña distinto que uno que nace para entregar y morir.

## Decisión

- **Documentar** desde el día uno la visión multi-institución (este ADR).
- **Diseñar** el dominio contemplando "institución" como un concepto de primer
  orden, sin cablear supuestos específicos de UTN en el núcleo (se apoya en la
  [arquitectura hexagonal, ADR-0001](0001-usar-arquitectura-hexagonal.md)).
- **NO construir** todavía la estructura para multi-institución (ni carpetas por
  institución en `discovery/`, ni multi-tenancy en el código). Se difiere hasta
  que exista una segunda institución real.

## Consecuencias

- ✅ La visión queda registrada y guía las decisiones sin costo de mantenimiento
  hoy (es solo un documento).
- ✅ Al mantener el núcleo agnóstico de UTN, el día que entre otra institución el
  cambio es barato.
- ⚠️ Hay que resistir la tentación de sobre-diseñar (multi-tenancy prematuro):
  se anticipa el cambio en el **diseño**, no se paga en la **estructura** hasta
  que llega.

## Cuándo re-evaluar

Cuando aparezca una segunda institución interesada, o cuando el TFI esté
entregado y se decida seguir el proyecto como producto real.
