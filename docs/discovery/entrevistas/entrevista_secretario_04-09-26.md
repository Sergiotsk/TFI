# Entrevista informal con el Secretario — Flujo de inscripción de ingresantes

**Fecha de la charla:** 04/09/2026
**Fuente:** `transcripcion_completa.txt` (Whisper, 2 bloques, ~57 min, ruido de fondo típico de grabación de aula)
**Objetivo de la entrevista:** relevar CÓMO funciona hoy el proceso de inscripción de ingresantes, para poder proponer una solución de software que lo mejore.

> Nota de método: esto no es una transcripción palabra por palabra — es una reconstrucción del proceso real a partir de lo que dijo el secretario, ordenado como un ANÁLISIS DE PROCESO (que es lo que se necesita para diseñar una solución, no un acta literal).

---

## 0. Quién es quién (esto importa para no perder tiempo después)

| Persona                                                  | Rol                                           | Qué sabe / qué maneja                                                                                                                      |
| -------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **El Secretario** (entrevistado hoy)               | Operativo — hace la inscripción día a día | Todo el circuito manual: documentación, pagos, mails                                                                                        |
| **Sebastián** (Director)                          | Estratégico                                  | Cupos, comisiones, política académica —**entrevista pendiente**                                                                     |
| Sector de Sistemas/Software (no identificado por nombre) | Backend humano del SYSACAD                    | Genera legajo, correo institucional, carga materias iniciales —**automatizado de su lado, pero es una caja negra para el secretario** |
| Profesora (GDS)                                          | Docente que asignó el proyecto               | Sugirió el tema y el método (entrevista antes de programar)                                                                                |

**Punto clave que el secretario remarcó él mismo, dos veces:** *"El foco ahora son los ingresantes"* — no te dejes arrastrar por el tema de cupos/comisiones, que es un problema distinto (de recursada, no de ingreso) y depende de otra persona (Sebastián). Esto te lo dijo para que no pierdas tiempo analizando algo que no es tu alcance. Hazle caso — es una buena delimitación de scope.

---

## 1. El proceso real, tal como pasa hoy (no como "debería" pasar)

Este es el punto en el que un arquitecto tiene que ser honesto: lo que el secretario describió **no es un proceso**, es una cadena de parches manuales que funciona porque una persona la sostiene con Excel y memoria. Anotá los pasos, pero prestá más atención a las **costuras** entre paso y paso — ahí es donde se rompe todo.

```
[Formulario web]
      │
      ▼
[Drive compartido: 1 carpeta por DNI]  ←── otro sector la puebla
      │
      ▼
[Chequeo manual, carpeta por carpeta] ──── ¿cumple documentación?
      │
      ▼
[Excel de control: OK / no OK]
      │
      ▼
[Mail: "confirmá cupo, pagá matrícula"]
      │
      ▼
[Alumno transfiere + manda comprobante] ──── control manual en Excel
      │                                       (tesorería confirma aparte)
      ▼
[Tanda de "bienvenida"] ──── mail con legajo, charla obligatoria
      │
      ▼
[OTRO SECTOR carga en SYSACAD] ──── legajo, correo institucional,
      │                              alta en materias iniciales
      │                              (automático de SU lado, opaco
      │                               para el secretario)
      ▼
[Secretario manda mail final] ──── horarios, códigos, cómo usar autogestión
```

Ocho pasos. **Tres sistemas de registro distintos** (Drive, Excel, mail) que no se hablan entre sí, más un cuarto sistema (SYSACAD) que es una caja negra externa.

---

## 2. Los problemas reales — clasificados por tipo, no por orden cronológico

Esto es lo que te sirve para diseñar la solución. No es lo mismo un problema de **falta de visibilidad** que uno de **falta de automatización** — se atacan distinto.

### A. Problemas de VISIBILIDAD (el secretario no sabe algo hasta que es tarde)

- **No hay contraste entre lo que carga el otro sector y lo que él espera.** Textual: *"vos no te enterás hasta que no viene el alumno"* cuando falta una materia o el alumno no quedó cargado. Esto es GRAVE — es un problema de arquitectura de sistemas: **no hay un sistema de verdad único (source of truth) ni una confirmación de cierre de ciclo.** El secretario dispara información hacia el otro sector y confía a ciegas en que se ejecutó bien.
- Reconoce errores recurrentes: comisiones que arrancan con 10-15 alumnos cuando "correspondían" 100, porque los ingresantes no se cargaron a tiempo. Esto no es un caso aislado — lo dijo como algo que "vimos varias veces".

### B. Problemas de AUTOMATIZACIÓN (tareas repetitivas que hoy hace una persona)

- Chequeo de documentación: **cero filtrado automático**, carpeta por carpeta, ojo humano. Esto es lo más obviamente automatizable (validar que estén los archivos requeridos, formato, campos completos).
- Control de pagos: cruzar comprobante recibido vs. matrícula esperada, hoy a mano en Excel.
- Todo el tracking de estado del alumno (documentación OK / pago OK / bienvenida enviada / legajo generado) vive en la cabeza del secretario + 3 planillas distintas.

### C. Problemas de INTEGRACIÓN (no se puede tocar, hay que rodear)

- SYSACAD es intocable desde la facultad — lo administra otro nivel (universidad/Ministerio). El secretario fue clarísimo: **la solución "trabaja para afuera"**, hasta el borde de SYSACAD, no adentro.
- Esto define un límite arquitectónico duro para tu proyecto: tu sistema termina donde generás la "lista final" que se le pasa al otro sector. No hay API, no hay integración directa — es un traspaso de información (probablemente por mail o planilla, igual que ahora).

### D. Problemas de GOBERNANZA / RESPONSABILIDAD (no son técnicos, son de proceso)

- Las bajas de alumnos requieren conformidad explícita por medio institucional — el secretario fue tajante: *"es tu palabra contra la ley"* si no hay registro. Cualquier solución que automatice bajas o altas **tiene que dejar rastro auditable** — no es un detalle, es un requisito no funcional real que surgió solo.

---

## 3. Lo que el secretario NO te dijo (pero se infiere) — para tu propuesta de valor

- Nunca midió tiempos ni volumen exacto (cuántos ingresantes por ciclo, cuánto tarda cada paso). Si vas a proponerle algo, **pedile esos números en la próxima charla** — sin eso no podés argumentar el ROI de automatizar.
- El "otro sector" que carga SYSACAD es una dependencia crítica y nadie de tu equipo lo entrevistó todavía. Si tu solución depende de pasarle una lista final más prolija, **en algún momento vas a necesitar hablar con ellos también**, no alcanza con el secretario y el director.
- El secretario mismo dijo que él "no es programador" y no entiende bien cómo el otro sector dispara la carga (usan "un programita", ni él sabe cómo). Esto es una señal de que **la solución tiene que ser transparente para él**, no asumir que va a entender integraciones técnicas.

---

## 4. Alcance para la propuesta técnica (lo que se decidió en la charla)

- **Foco: ingresantes.** No tocar cupos/comisiones (eso es Sebastián, y es un problema de recursada).
- **No tocar SYSACAD.** La solución cubre desde el formulario hasta el traspaso final de la lista.
- **Diferenciar tipos de alta:** ingresante nuevo (vía formulario) ≠ alumno que viene con cursada de otra carrera ≠ equivalencias. Cada uno entra por una vía distinta — si programás pensando en un solo flujo, te va a explotar en producción con casos borde reales desde el día uno.
- Idea explícita del secretario, y la más honesta de toda la charla: *"no es laburar menos, es laburar más organizado y poner el foco donde se toman las decisiones"* — o sea, no le vendas "te va a ahorrar tiempo" sin más; vendele **visibilidad y trazabilidad**, que es lo que realmente le falta.

## 5. Próximo paso obligatorio

Falta la entrevista con **Sebastián** (director) — la parte estratégica (por qué existen los cupos, qué decisiones política/administrativas condicionan el proceso). El secretario se ofreció a coordinarla. Sin esa segunda mirada, tu propuesta va a estar coja: vas a tener la mecánica pero no el "por qué" de varias reglas.

---
