# Guía de entrevista — Sebastián (Director) — versión priorizada

**Fecha:** martes
**Entrevistan:**
**Reemplaza a:** `GUIA-ENTREVISTA-DIRECTOR.md` (mismo contenido, reordenado por criticidad)

> El Secretario nos dio la mecánica. Sebastián nos tiene que dar **las reglas del juego**:
> qué se puede cambiar, qué está impuesto, y qué pasa cuando el proceso falla.

**Qué significan P0, P1 y P2:** es la escala de prioridad que se usa habitualmente
en desarrollo. Empieza en cero.

- **P0** — bloqueante: si no lo contesta, no podemos diseñar.
- **P1** — importante: da forma al proyecto y sostiene la defensa, pero podemos avanzar sin eso.
- **P2** — deseable: suma, se puede posponer o mandar por correo después.

Es notación nuestra, para organizar la reunión. En el informe formal la prioridad
va como Release 1 / 2 / 3, que es lo que usa la cátedra.

**Cómo está ordenada:** de mayor a menor impacto sobre el arranque del proyecto.

Cada pregunta lleva la etiqueta de qué alimenta:
`[RESTR]` restricción · `[RF]` requisito funcional · `[RNF]` requisito no funcional · `[JUST]` justificación del proyecto

**Aviso sobre el orden en vivo:** este orden es de *criticidad*, no necesariamente
de *conversación*. Arrancar en frío con "qué está impuesto por normativa" es árido.
Recomendación: abrir con las dos preguntas de calentamiento del final de este
documento, y a los tres minutos entrar directo a P0. Lo que no se puede es
llegar al final de la reunión con P0 sin cubrir.

---

## Antes de empezar

- Pedir permiso para grabar. Decir para qué es y que queda en el trabajo académico.
- **No proponer solución.** Si pregunta qué van a hacer, decir que todavía están relevando. En cuanto proponés, la persona deja de contarte problemas y empieza a opinar sobre tu idea.

---

# P0 — Sin esto no podemos empezar a diseñar

## P0.1 · Qué se puede cambiar y qué está impuesto

`[RESTR]` Define el alcance real de lo que podemos proponer. Es lo primero porque
condiciona todas las demás respuestas: no tiene sentido diseñar un flujo que la
normativa prohíbe.

1. ¿Qué partes del proceso son decisión de la facultad y cuáles vienen impuestas desde la universidad o el Ministerio? `[RESTR]`

   > **R:**

2. ¿Los requisitos de documentación los define la carrera o son normativa? `[RESTR]`

   > **R:**

3. ¿Qué reglas del proceso tienen respaldo normativo escrito y dónde está? `[RESTR]`

   > **R:**

4. ¿Hay algún paso que exista solo por costumbre y que se podría cambiar? `[RESTR]`

   > **R:**

## P0.2 · Reglas de admisión y casos borde

`[RF]` Esto **es** la máquina de estados. Cada caso borde que no releves ahora es
un bug de modelo de datos en noviembre.

> **Aclarar al entrar:** "esto es sobre el cupo de ingreso, no sobre comisiones de
> recursada — eso lo dejamos fuera de alcance como nos indicó Secretaría."

5. ¿Qué diferencias hay en el circuito entre un ingresante nuevo, alguien que viene con cursada de otra carrera, y una equivalencia? `[RF]`

   > **R:**

6. ¿Aceptan constancias de título en trámite con materias adeudadas? `[RF]`

   > **R:**

7. Si es así, ¿cuántas materias previas tolera el reglamento de la regional? `[RF]`

   > **R:**

8. ¿Cuál es la fecha límite para entregar el analítico definitivo? ¿Qué pasa si no llega? `[RF]`

   > **R:**

9. ¿El cupo de ingreso a la TUP se asigna por estricto orden de inscripción, por sorteo, o con otro criterio? `[RF]`

   > **R:**

10. ¿Cómo manejan la lista de espera cuando un aspirante abandona o no completa los papeles a tiempo? ¿Existe un período de gracia? `[RF]`

    > **R:**

## P0.3 · Trazabilidad y permisos

`[RNF]` Va en P0 y no en P1 porque la auditoría no se agrega después: o el modelo
la contempla desde el diseño, o hay que rehacerlo. El Secretario ya nos avisó que
esto pesa: *"es tu palabra contra la ley"*.

11. ¿Quién puede ver y quién puede modificar la información de un aspirante hoy? `[RNF]`

    > **R:**

12. Si se rechaza un legajo por documentación y después aparece el papel faltante, ¿quién puede revertir esa decisión y cómo queda registrado? `[RNF]`

    > **R:**

13. Sobre las bajas: el Secretario mencionó que hace falta conformidad por medio institucional. ¿Qué exige la normativa exactamente? `[RNF]`

    > **R:**

## P0.4 · Su prioridad, que puede no ser la del Secretario

`[RF]` Si el Director prioriza algo distinto a lo que priorizó Secretaría, tenemos
que saberlo **antes** de armar el backlog, no después.

14. Si pudiera arreglar una sola cosa del proceso de ingreso, ¿cuál sería? `[RF]`

    > **R:**

15. ¿Qué información sobre los ingresantes le gustaría tener y hoy no tiene? `[RF]`

    > **R:**

16. ¿Qué decisiones toma sobre el ingreso, y con qué datos las toma hoy? `[RF]`

    > **R:**

## P0.5 · Adopción real

`[RESTR]` Una sola pregunta, pero define cuánto invertimos en producción versus
prototipo. Las dos respuestas nos sirven.

17. ¿Hay intención real de usar una herramienta así, o lo toman como ejercicio académico?

    > **R:**

---

# P1 — Da forma al proyecto y sostiene la defensa

## P1.1 · El costo de que falle

`[JUST]` Es la apertura de la defensa. No bloquea el diseño, pero sin esto el
proyecto no tiene por qué existir.

18. El Secretario mencionó comisiones que arrancaron con 10-15 alumnos cuando correspondían 100. ¿Qué pasó después en esos casos? `[JUST]`

    > **R:**

19. ¿Se abren comisiones nuevas, se reasigna gente, se pierde el alumno? `[JUST]`

    > **R:**

20. ¿Qué costo tiene eso para la carrera — docentes asignados, aulas, presupuesto? `[JUST]`

    > **R:**

21. ¿Con qué frecuencia pasa? `[JUST]`

    > **R:**

22. ¿Cómo se enteran de que pasó? `[JUST]`

    > **R:**

## P1.2 · Magnitud

`[JUST]` `[RNF]` Números para el informe, y para dimensionar carga: no es lo mismo
un sistema para 80 aspirantes que para 800.

23. ¿Cuántos ingresantes se inscriben por ciclo?

    > **R:**

24. ¿Cuántos llegan efectivamente a cursar la primera materia?

    > **R:**

25. ¿En qué punto del circuito se pierde más gente?

    > **R:**

26. ¿Cuánto tiempo pasa entre que alguien completa el formulario y queda cargado en SYSACAD?

    > **R:**

27. ¿Ese volumen viene creciendo, bajando o estable?

    > **R:**

## P1.3 · Datos personales y conservación

`[RNF]` Afecta el diseño del almacenamiento, pero se puede resolver una iteración
más tarde que la trazabilidad.

28. ¿Existe algún protocolo sobre cuánto tiempo se conservan los PDF y fotos de los aspirantes que finalmente no ingresan o son rechazados? `[RNF]`

    > **R:**

29. ¿Hay una política de la facultad sobre datos personales de alumnos y aspirantes? `[RNF]`

    > **R:**

30. ¿Qué pasa hoy si alguien tiene que rendir cuentas de una decisión tomada hace dos años? `[RNF]`

    > **R:**

## P1.4 · Restricciones técnicas

`[RESTR]` Probablemente no las conteste él. El objetivo real de este bloque es que
nos derive a quien sí las sabe: la pregunta 32 es la que importa.

31. ¿El sistema debería desplegarse en servidores de la regional, o está permitido usar infraestructura cloud externa? `[RESTR]`

    > **R:**

32. Si no es su área, ¿a quién le tenemos que preguntar esto? `[RESTR]`

    > **R:**

33. ¿Hay algún requisito institucional sobre dónde pueden vivir los datos de alumnos? `[RESTR]`

    > **R:**

---

# P2 — Contexto y continuidad

Si el tiempo se acaba, estas se pueden mandar por correo después.

34. ¿Qué le reclaman a él cuando el proceso falla? `[JUST]`

    > **R:**

35. Si funcionara, ¿quién lo mantendría después de que nos recibamos?

    > **R:**

36. ¿Alguien intentó algo parecido antes? ¿Por qué no prosperó?

    > **R:**

37. ¿Qué nos convendría preguntarle al sector que carga SYSACAD? *(Nos prepara la tercera entrevista.)*

    > **R:**

38. ¿Hay alguien más con quien deberíamos hablar?

    > **R:**

39. ¿Podemos volver a consultarle cuando tengamos la propuesta armada?

    > **R:**

---

## Calentamiento (usar al abrir, no al cerrar)

Dos preguntas de P1.2 sirven para arrancar la charla sin arrancar en frío:

- ¿Cuántos ingresantes se inscriben por ciclo?
- ¿Ese volumen viene creciendo, bajando o estable?

Son fáciles de contestar, ponen números sobre la mesa y dan pie natural a entrar
en P0.1.

---

## Si solo quedan 15 minutos

Las cinco que no se pueden perder:

1. ¿Qué está impuesto por normativa y qué decide la facultad? *(P0.1 · 1)*
2. ¿Qué diferencias de circuito hay entre ingresante nuevo, pase y equivalencia? *(P0.2 · 5)*
3. ¿Quién puede modificar y cómo queda registrado? *(P0.3 · 11-12)*
4. Si pudiera arreglar una sola cosa, ¿cuál sería? *(P0.4 · 14)*
5. ¿A quién le preguntamos lo técnico? *(P1.4 · 32)*

---

## Notas al margen

Temas que se abrieron y no estaban en la guía:

>

## Frases textuales

Citas que valga la pena conservar tal cual:

> ""

## Contradicciones con lo que dijo el Secretario

>

---

## Pendientes nuestros, no de la entrevista

- Confirmar cuál es la norma de protección de datos personales aplicable hoy. Citarla bien en el informe.

## Después de la entrevista

- Guardar la transcripción cruda en `/entrevistas/fuentes/`, sin editar
- Escribir el análisis el mismo día, mientras está fresco
- Marcar explícitamente dónde Sebastián **contradice** al Secretario. Esas contradicciones son hallazgos, no errores: suelen señalar exactamente dónde el proceso está roto
