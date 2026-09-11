# Universidad Tecnológica Nacional

## Cátedra Práctica Profesional Supervisada — Año 2026

# Proyecto: [NOMBRE PENDIENTE] — Gestión de Ingresantes

**Estado:** Tema definido (gestión de ingresantes). Falta definir el nombre del producto — reemplazar `[NOMBRE PENDIENTE]` en el título cuando se decida

**Número de Equipo:** 5

## Integrantes Equipo de Proyecto

| DNI      | Nombre                       | E-Mail                                    |
| -------- | ---------------------------- | ----------------------------------------- |
| 47214815 | De Vivo Federico             | Fdevivo096@alumnos.frh.utn.edu.ar         |
| 44886849 | Vadone Santiago Gabriel      | svadone373@alumnos.frh.utn.edu.ar         |
| 40290828 | Enriquez Aveiro Lucia Este   | lenriquez551@alumnos.frh.utn.edu.ar       |
| 32384844 | Tschernitschek Sergio Fabian | stschernitschek377@alumnos.frh.utn.edu.ar |

**Docente:** Lic. Leila Coronel

---

## Índice

1. [Definición de alcance](#1-definición-de-alcance)
   1. [Justificación del Proyecto elegido. Título. Beneficiarios](#11-justificación-del-proyecto-elegido-título-beneficiarios)
   2. [Objetivo, Límite y Alcance](#12-objetivo-límite-y-alcance)
   3. [Visual Story Mapping](#13-visual-story-mapping)
   4. [Product Backlog](#14-product-backlog)
   5. [Criterios de aceptación](#15-criterios-de-aceptación)
2. [Modelo de Negocio](#2-modelo-de-negocio)
   1. [Business Model Canvas](#21-business-model-canvas)
   2. [Metas. Hitos. Cronograma](#23-metas-hitos-cronograma)
   3. [Oferta - Cuadro de competidores y Productos complementarios](#24-oferta---cuadro-de-competidores-y-productos-complementarios)
   4. [Análisis económico-financiero](#25-análisis-económico-financiero)
3. [Interesados y Equipo](#3-interesados-y-equipo)
   1. [Matriz de interesados](#31-matriz-de-interesados)
   2. [Equipo de proyecto](#32-equipo-de-proyecto)
4. [Release planning - Plan de versiones](#4-release-planning---plan-de-versiones) _(No Realizar, según indicación de la cátedra en el ejemplo)_
   1. [Estimación Story Points](#41-estimación-story-points)
   2. [Plan de versiones](#42-plan-de-versiones)
5. [Experiencia de Usuario](#5-experiencia-de-usuario)
   1. [Prototipo de navegación](#51-prototipo-de-navegación)
   2. [Wireframes / Mockups](#52-wireframes-mockups)
6. [Arquitectura de Software](#6-arquitectura-de-software)
   1. [Diagrama de Arquitectura](#61-diagrama-de-arquitectura)
   2. [Frameworks / Componentes utilizados](#62-frameworks--componentes-utilizados)
   3. [Infraestructura tecnológica](#63-infraestructura-tecnológica)
   4. [Otros diagramas según corresponda](#64-otros-diagramas-según-corresponda)
   5. [Estándar de codificación](#65-estándar-de-codificación)
7. [Plan de pruebas](#7-plan-de-pruebas)
   1. [Diseño y ejecución de escenario de prueba](#71-diseño-y-ejecución-de-escenario-de-prueba)
   2. [Seguimiento de fallas](#72-seguimiento-de-fallas)
8. [Manual Instalación](#8-manual-instalación)
9. [Hoja de Ruta para la exposición](#9-hoja-de-ruta-para-la-exposición)

- [Anexo I. Retrospectiva](#anexo-i-retrospectiva)
- [Anexo II. Documentación adicional](#anexo-ii-documentación-adicional)

---

## 1. Definición de alcance

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 1.1 Justificación del Proyecto elegido. Título. Beneficiarios

#### Justificación

La elección de este proyecto surge de la convergencia de tres fuentes, no de una sola corazonada — y eso es justo lo que la hace sólida para defender ante la cátedra:

1. **Problemática observada como alumnos.** El equipo observó, tanto en compañeros de la propia cursada como de otras carreras, casos concretos de alumnos que llegaban a cursar materias sin figurar como inscriptos en ellas — quedando fuera de los listados oficiales pese a estar efectivamente asistiendo y cursando. Esta desconexión entre lo que el alumno hace en la práctica y lo que el sistema institucional refleja fue la primera señal, desde la experiencia propia, de que el proceso de alta e inscripción tiene un problema real de fondo y no un simple inconveniente administrativo aislado.
2. **Problemática confirmada por la cátedra.** La Lic. Leila Coronel, a cargo de la materia, coincidió en que la gestión de ingresantes es una problemática vigente y relevante dentro de la institución, y sugirió tanto el tema como la metodología de abordaje: entrevistar a los actores reales del proceso antes de programar una sola línea de código.
3. **Problemática confirmada por quien ejecuta el proceso hoy.** La entrevista con el Secretario (04/09/2026) terminó de validar la elección: lo que hoy existe no es un proceso de inscripción propiamente dicho, sino una cadena de ocho pasos manuales sostenida por una persona con Excel, un Drive compartido y memoria. Tres sistemas de registro que no se hablan entre sí (Drive, Excel, mail), más una caja negra externa (SYSACAD) a la que se le entrega la posta al final. El propio Secretario lo resumió mejor que cualquier relevamiento técnico: *"no es laburar menos, es laburar más organizado y poner el foco donde se toman las decisiones"*.

Vale remarcar que los puntos 1 y 3 no son dos quejas sueltas: son el mismo problema visto desde dos veredas distintas. Lo que el equipo vio como alumnos (compañeros cursando sin figurar inscriptos) es el síntoma visible de lo que el Secretario describió desde el otro lado del mostrador como falta de contraste entre lo que se carga y lo que se espera — *"vos no te enterás hasta que no viene el alumno"*. Que la experiencia propia y el relevamiento con el actor institucional apunten al mismo punto de falla, de forma independiente, es lo que terminó de decidir la elección.

De las alternativas evaluadas (ver `docs/Ideas-Exploradas/IDEAS-RANKEADAS.md`), esta fue la que combinó los tres criterios que priorizamos como equipo: un problema real y verificado con evidencia de primera mano (no una hipótesis), un alcance acotable en el tiempo de la cursada, y un interesado institucional concreto dispuesto a validar el resultado.

#### Título

_(pendiente — ver nota de estado al inicio del documento)_

#### Beneficiarios

- **Ingresantes.** Ganan visibilidad sobre el estado real de su trámite (documentación, pago, alta) en lugar de enterarse tarde o por mail suelto.
- **Secretaría / área de Bedelía-Alumnado (el Secretario y su equipo).** Reemplazan el seguimiento manual en tres sistemas distintos por un único punto de verdad (*source of truth*), con trazabilidad auditable de altas y bajas — un requisito que el propio Secretario marcó como no negociable ("es tu palabra contra la ley" si no queda registro).
- **Dirección académica (Sebastián, Director).** Accede a información consolidada y confiable para decisiones de cupos y comisiones, hoy afectadas por cargas tardías o incompletas de ingresantes (el Secretario reportó comisiones que arrancan con 10-15 alumnos cuando correspondían 100).
- **La institución en general.** Reduce el riesgo de errores por falta de contraste entre lo que se espera y lo que efectivamente se carga en SYSACAD, sin necesidad de tocar ese sistema (fuera del alcance del proyecto, ver [1.2](#12-objetivo-límite-y-alcance)).

### 1.2 Objetivo, Límite y Alcance

#### Objetivo

El proyecto tiene como objetivo proporcionar una solución de software que digitalice y centralice el proceso de inscripción de ingresantes, hoy sostenido manualmente mediante una cadena de sistemas desconectados entre sí (formulario, Drive, Excel y mail), reemplazándolos por un único punto de verdad (*source of truth*) que dé visibilidad en tiempo real del estado de cada aspirante — documentación, pago de matrícula y alta — tanto para el propio ingresante como para el personal de Secretaría a cargo del proceso.

No se trata de reducir la carga de trabajo sin más, sino de reordenarla: eliminar el chequeo manual carpeta por carpeta, el cruce a mano de comprobantes de pago contra Excel, y la falta de contraste entre lo que Secretaría espera y lo que efectivamente termina cargado — que hoy genera casos como comisiones que arrancan con 10-15 alumnos cuando correspondían 100, por ingresantes que no llegaron a cargarse a tiempo.

> **Alcance:** listado de funcionalidades que va a tener la solución, con el detalle de cada una (entidades involucradas, reglas de negocio relevantes).
>
> **Fuera de Alcance:** funcionalidades que explícitamente NO se van a hacer en esta versión, con la justificación de por qué quedan afuera. Es tan importante como el alcance mismo — marca los límites del proyecto ante la cátedra.

#### Alcance

- _(completar — detallar funcionalidades concretas: ej. formulario de inscripción, carga y validación de documentación, seguimiento de pago de matrícula, generación de la lista final a entregar a Secretaría, notificaciones de estado al ingresante, diferenciación entre ingresante nuevo / alumno con cursada de otra carrera / equivalencias, etc.)_

#### Fuera de Alcance

- **Cupos y asignación de comisiones.** Es un problema distinto (de recursada, no de ingreso) y depende de otra persona (Director) — así delimitado explícitamente por el Secretario en la entrevista para no diluir el foco del proyecto.
- **Integración directa con SYSACAD.** Es un sistema administrado por otro nivel institucional (universidad/Ministerio), intocable desde la facultad. La solución "trabaja para afuera": termina donde se genera la lista final que se traspasa al sector que carga SYSACAD, sin API ni integración directa.
- _(completar con el resto de los límites que definan)_

### 1.3 Visual Story Mapping

> Mapa visual (tipo tablero de historias) que cruza los "temas"/módulos de la solución (columnas) contra las releases/MVP (filas), mostrando qué funcionalidad entra en cada etapa. En el ejemplo se hizo con post-its agrupados en MVP, Release 1, Release 2, Release 3.

_(insertar imagen o link al tablero — Miro, FigJam, Jira, etc.)_

### 1.4 Product Backlog

> Listado de historias de usuario con formato "Como [rol] Quiero [funcionalidad] Para [beneficio]", con prioridad (release) y status.

| ID Historia de usuario | Como | Quiero | Para | Prioridad | Status |
| ---------------------- | ---- | ------ | ---- | --------- | ------ |
|                        |      |        |      |           |        |
|                        |      |        |      |           |        |
|                        |      |        |      |           |        |

### 1.5 Criterios de aceptación

> Por cada historia de usuario del backlog, se define uno o más criterios de aceptación en formato Gherkin (Dado / Cuando / Entonces).

#### Historia de Usuario: _(nombre)_

| N° Criterio de aceptación | Dado... | Cuando... | Entonces... |
| --------------------------- | ------- | --------- | ----------- |
| 1                           |         |           |             |
| 2                           |         |           |             |

---

## 2. Modelo de Negocio

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 2.1 Business Model Canvas

> Los nueve módulos del Canvas: Key Partners, Key Activities, Key Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue Streams.

_(insertar imagen del canvas)_

#### 2.2.1 Segmento de mercado

_(completar)_

#### 2.2.2 Propuesta de valor

_(completar)_

#### 2.2.3 Canales

_(completar)_

#### 2.2.4 Relaciones con los clientes

_(completar)_

#### 2.2.5 Fuentes de ingresos

_(completar)_

#### 2.2.6 Recursos clave

_(completar)_

#### 2.2.7 Actividades clave

_(completar)_

#### 2.2.8 Socios clave - Proveedores

_(completar)_

#### 2.2.9 Estructura de costos

_(completar)_

### 2.3 Metas. Hitos. Cronograma

_(completar)_

### 2.4 Oferta - Cuadro de competidores y Productos complementarios

#### Cuadro de competidores

| Nombre del producto | Sitio Web | Fortalezas | Debilidades |
| ------------------- | --------- | ---------- | ----------- |
|                     |           |            |             |

#### Productos complementarios

> Software de terceros del que depende o se apoya la solución (hosting, infraestructura, librerías clave, etc.)

| Nombre del producto | Sitio Web | Fortalezas | Debilidades |
| ------------------- | --------- | ---------- | ----------- |
|                     |           |            |             |

### 2.5 Análisis económico-financiero

> Beneficios tangibles e intangibles esperados del proyecto.

**Beneficios:**

- _(completar)_

---

## 3. Interesados y Equipo

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 3.1 Matriz de interesados

| Nombre Interesado                               |
| ----------------------------------------------- |
| _(nombre, institución, contacto, depto/rol)_ |

### 3.2 Equipo de proyecto

| Rol de Scrum     | Nombre y apellido |
| ---------------- | ----------------- |
| Product Owner    |                   |
| Scrum Master     |                   |
| Dev Team         |                   |
| Business Analyst |                   |

---

## 4. Release planning - Plan de versiones

> ⚠️ En el ejemplo de la cátedra esta sección figura marcada como **"No Realizar"**. Confirmar con la docente si aplica al equipo.

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |

### 4.1 Estimación Story Points

_(completar si corresponde)_

### 4.2 Plan de versiones

_(completar si corresponde)_

---

## 5. Experiencia de Usuario

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 5.1 Prototipo de navegación

> Diagrama de flujo de pantallas: qué pantalla lleva a cuál y con qué acción (click en botón X → pantalla Y).

_(insertar diagrama de navegación)_

### 5.2 Wireframes / Mockups

> Por cada pantalla: captura/mockup + breve descripción funcional de sus componentes.

#### Pantalla: _(nombre)_

_(descripción + imagen)_

---

## 6. Arquitectura de Software

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 6.1 Diagrama de Arquitectura

_(insertar diagrama — ej. Azure/AWS/GCP architecture diagram)_

### 6.2 Frameworks / Componentes utilizados

**Backend:**

- _(completar)_

**Frontend:**

- _(completar)_

**Base de datos:**

- _(completar)_

### 6.3 Infraestructura tecnológica

| Descripción      | Detalle |
| ----------------- | ------- |
| Base de datos     |         |
| Sistema Operativo |         |
| Bases de Datos    |         |

| Descripción          | Detalle |
| --------------------- | ------- |
| API Rest              |         |
| Sistema Operativo     |         |
| AppServer / WebServer |         |
| Lenguajes utilizados  |         |

| Descripción          | Detalle |
| --------------------- | ------- |
| Front end             |         |
| Sistema Operativo     |         |
| AppServer / WebServer |         |
| Lenguajes utilizados  |         |

### 6.4 Otros diagramas según corresponda

> Ej: Diagrama Entidad-Relación (DER), diagrama de clases, diagrama de secuencia, etc.

_(completar)_

### 6.5 Estándar de codificación

> Ej: convención de versionado semántico (SemVer), convención de nombres, linters, estilo de commits, etc.

_(completar)_

---

## 7. Plan de pruebas

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### 7.1 Diseño y ejecución de escenario de prueba

| Historia de usuario | Escenario de prueba | Resultado | Observaciones |
| ------------------- | ------------------- | --------- | ------------- |
|                     |                     |           |               |

### 7.2 Seguimiento de fallas

> Para seguimiento de issues, usar la herramienta que se elija (GitHub Issues, Jira, etc.) y volcar el resumen/link acá.

_(completar)_

---

## 8. Manual Instalación

> Describir el proceso de despliegue de la solución (o indicar que, al ser una app web, no requiere instalación local).

_(completar)_

---

## 9. Hoja de Ruta para la exposición

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

**Link al template de la demo:** _(completar)_

### Índice de la presentación

1. ¿Quiénes somos?
2. ¿Cuál es el problema?
3. Propuesta de solución
4. ¿Cómo funciona?
5. Beneficios
6. Financiación
7. Costos
8. Competencias (comparación)
9. Tecnología
10. Aspiraciones (complementos)
11. Equipo
12. Agradecimiento

### Resumen de Hoja de Ruta

#### 1. ¿Quiénes somos?

_(completar)_

#### 2. Nuestro producto

_(completar)_

---

## Anexo I. Retrospectiva

### Historia de Revisión

| Fecha | Versión | Descripción | Autor |
| ----- | -------- | ------------ | ----- |
|       |          |              |       |

### Retrospectiva #1 — _(fecha)_

|                                                                     |  |
| ------------------------------------------------------------------- | - |
| **¿Qué hicimos bien?**                                      |  |
| **¿Qué podemos mejorar?**                                   |  |
| **Ideas y propuestas**                                        |  |
| **ROI** _(de -2 a 2, retorno respecto al tiempo invertido)_ |  |

---

## Anexo II. Documentación adicional

**Link:** _(completar)_
