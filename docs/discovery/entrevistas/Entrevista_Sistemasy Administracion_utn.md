# Reunión sobre el sistema de inscripción de ingresantes: relevamiento v2

> **Fuentes:** `transcripcion_completa.txt` (crudo, ~1 h 13 min, 29/09/2026) y la versión ordenada anterior. Esta v2 corrige la ordenada con lo que dice el crudo y con las aclaraciones de Sergio.
> **Ruido del audio:** hay tramos ininteligibles y una alucinación de Whisper (descartada). 
> **Contexto:** TP de Gestión de Desarrollo de Software, problemática de inscripción de ingresantes a la tecnicatura.

---

## 1. Personas

| Persona | Rol |
| --- | --- |
| **Sebastián ("Seba")** | **Director** de la tecnicatura. Es la referencia de la idea de "pago primero" y de que lo clave es que la gente pague para habilitar el flujo. Hay que cerrar con él el diagrama del flujo. |
| **Christian** | Encargado de la parte **administrativa y de pagos**. Conoce los circuitos administrativos (complejos). |
| **Luis** | Encargado de la parte de **sistemas** (académicos y administrativos). Opina sobre viabilidad técnica y operativa. |
| **Ariel ("Ari")** | Uno de los **secretarios de la TUP**. Al cierre de la presentación inicial se le dice al grupo "sigue hablando con Ari. Y seguimos reuniendo nosotros", así que es el contacto para seguir coordinando el relevamiento. |
| Persona de tesorería / administración ⚠ | Cuenta el circuito manual actual de listados, marcas y mails. No queda claro cuál de los presentes es. |

---

## 2. Alcance

**Sí:**
- Ordenar e integrar el **proceso de inscripción de ingresantes**.
- Que el **pago sea el primer paso** y dispare el resto del flujo.
- Dejar de coordinar por Excel y por mail.

**No:**
- Reemplazar lo que ya funciona (por ejemplo, el canal actual de gestión de pagos). Cuando se habla de "reemplazo" se habla del proceso de inscripción completo.

**Restricciones duras (se repitieron varias veces):**
1. **No generar tareas manuales nuevas** a los sectores que ya trabajan.
2. **No duplicar información** que ya está en los sistemas de la facultad.

**Grado vs. tecnicatura:** en grado el pago queda al final (el alumno se anota, carga datos y después paga o no). En tecnicatura la **matrícula se paga al principio**.

**Interés principal de administración:** capturar el concepto de pago de la tecnicatura. Lo que más les interesa es el **pago en ventanilla / efectivo** cuando abren las inscripciones.

**Ojo:** la facultad puede no adoptar el proyecto. Se dijo que podía gustar o que podían seguir con lo que ya tienen.

---

## 3. Restricciones técnicas de los sistemas existentes

1. **SQL Server + aplicación en Visual FoxPro.** Las reglas, la estructura y las relaciones **están en el programa, no en la base**. No se puede leer ni escribir directo contra la base: solo por las interfaces que cada sistema ofrezca. (Aparece textual en el crudo; lo introdujo un alumno que leyó la documentación del sistema.)
2. **Sin integridad referencial.** Si se borra un curso, los alumnos quedan colgados y no avisa.
3. **Los sistemas no se ven entre sí.** Hay **dos tablas de personas** (una por sistema). Si una persona se muda, no se corrige desde la facultad: hay que pedir el cambio por mail a otra área.
4. **Cambios pedidos en la base de datos pendientes:** unas ~35 en los últimos 7 años (confirmado por Sergio: son cambios pedidos a la base).
5. **Interfaces desparejas.** Algunas pantallas importan o exportan Excel, otras no, por decisión del proveedor ("es muy peligroso"). En algunos casos solo puede cargar el administrador absoluto.
6. **Las validaciones de la aplicación no se pueden saltear.**
7. **La estructura cambia sin aviso.** Una actualización puede romper lo armado ("de golpe dejó de funcionar").
8. **La facultad no gestiona esos sistemas**, por lo que dar acceso a un tercero es complicado.
9. **Carga de personas en el sistema académico:** es una sola tabla de personas y el resto son relaciones aparte. La explicación es confusa en el audio ⚠.
10. **Ingeniería:** sus alumnos ya están en SysAcad y son datos académicos, por lo que interfacear es más simple. La tecnicatura nueva es el caso más difícil.

---

## 4. Proceso: lo vigente vs. lo propuesto

**Vigente hoy (circuito manual):**
- Se baja un listado de inscriptos y llegan mails con los pagos.
- Alguien marca el archivo con los que pagaron y lo devuelve, y otra persona crea los usuarios.
- Alta académica (SysAcad) y alta económica (SysAdmin), donde se genera la deuda y la cuota.
- Conciliación manual de cada pago.
- Dato nuevo: hoy ya se pueden cargar cuotas por archivo; antes se cargaban una por una.

**Propuesto por el grupo (aprobado en líneas generales por Sebastián):**
1. Aceptar condiciones.
2. **Preinscripción** con datos mínimos.
3. **Pago**: reserva que conceptualmente es la matrícula.
4. Carga y validación de documentación.
5. Al validar, el pago se aplica y se da el alta.

Reglas dichas:
- **El proceso tiene que iniciar con una preinscripción**, no con un pago suelto.
- **Sebastián: el alumno tiene que pagar el total**. Lo que más le interesa es que la gente pague para habilitar el flujo. Devoluciones y casos raros se ven después.
- Para devolver un pago primero hay que haber registrado el ingreso.
- Hay una **reserva** y una **matrícula**, con el monto a definir ⚠ (no quedó claro si la reserva es el 100%).

**Nota:** la frase "nosotros lo que hacemos es la inscripción… es como una plataforma de inscripción" la dice un alumno describiendo el sistema del grupo. No hay evidencia de que el área de ingreso ya use una plataforma.

---

## 5. Pagos: dónde está el dolor real

- **Demora de acreditación:** 24–48 h (se mencionó 72 h).
- **Transferencias, el peor caso:**
  - El alumno no manda el comprobante, o lo manda sin detalle ni nombre.
  - El banco no relaciona el movimiento con la persona: de ~50 pagos de un día, solo 5 o 6 traen datos del pagador.
  - Fechas desfasadas: el comprobante dice 14 pero acredita después.
  - Comprobantes apócrifos o repetidos (dos hermanos mandan el mismo).
- **Efectivo / ventanilla:** menos problemático (la persona está presente), pero alguien tiene que marcar el pago. No se puede omitir.
- **Caso de ejemplo (septiembre):** alguien pagó de más, se le descargó la deuda y no volvió a pagar; después se discute si hay baja. Fue un comentario para ejemplificar problemáticas, **sin regla definida**.
- **Montos de cuotas:** se mencionaron como comentario (plata, cuotas). No tomar las cifras del audio como datos ⚠ ("130 / 150", "150, 600, 600").

---

## 6. Pasarelas de pago

- **Mercado Pago NO se puede usar.** La institución lo tiene prohibido. Era la opción que el grupo estaba planificando, así que hay que descartarla. (El crudo lo dice como "está prohibido…" dos veces.)
- Recomendación que se dio: arrancar por **Pagos360**, por facilidad y porque una regional ya lo usa hace ~6 meses. En el crudo dicen "creo que vamos a ir por pago de 60".
- Pagos360 genera un **archivo** que informa quién pagó.
- Se mencionó **PagoFácil** como lo más parecido a otro servicio nombrado ⚠.
- Se mencionó que **un webhook notifica el pago** ("webcoop" en la transcripción = **webhook**). Sirve para dejar de depender del comprobante.
- Una persona cuenta que hace un año pelea para encontrar el contacto que habilite el link de pagos virtual. Los servicios que nombra son **First Data** y **Posnet** (confirmado por Sergio; en la transcripción suenan como "Fart Data" y "postre").
- Se habló de una **billetera con convenio** que ya se estaría habilitando en algunos lados ⚠ (no se sabe cuál).
- **Decisión de diseño:** contemplar **las dos vías** (pasarela digital y efectivo/ventanilla). Un convenio puede caerse, así que la solución **no debe quedar casada** con una sola plataforma.

---

## 7. Integración: alternativas barajadas

| # | Alternativa | Contra |
| --- | --- | --- |
| 1 | **Export/import Excel** con formato acordado | Sigue siendo manual; hay pantallas que no lo permiten |
| 2 | **Vista de solo lectura + proceso automático (cron)** | Requiere acceso a un tercero; una actualización lo rompe |
| 3 | **Rol en el nuevo sistema** para que administración/tesorería confirme pagos ahí y exporte los datos de pagos | Agrega una tarea (la exportación), **pero Christian (encargado de administración) dio el ok** a que se genere el rol para su sector. Es la alternativa más directa. |
| 4 | **Pasarela de pago** con archivo o webhook | Depende de convenio y viabilidad; no resuelve el efectivo |

**Detalles útiles:**
- **Ya existe un informe** de lo pagado en el período anterior, que se baja en CSV/XLSX. Puede servir como fuente.
- **Frecuencia acordada: una exportación por día, al final del día**, con los datos de pagos. Christian, encargado de administración, aceptó que se genere un rol en el sistema nuevo para su sector, para que hagan esa exportación (confirmado por Sergio).
- La comunicación ideal es **con la base de datos, no con las personas**: que el pago cargado se refleje solo.
- Se sugirió **no entrar en detalle técnico** en la charla con sistemas: que vean la necesidad general y que ellos digan qué es viable.

**Cómo funcionaría el cobro a futuro (según un interlocutor):** el alumno se registra en lo académico, se le generan las cuotas, un proceso las manda a SysAdmin y de ahí a la empresa de pagos. La empresa devuelve **dos archivos: quién pagó y quién depositó**, lo que reemplazaría la carga manual. Se mencionó además una actualización que modifica el sistema de cobros y cuotas.

---

## 8. Datos mínimos e intercambio

- **Datos mínimos para registrar un pago:** nombre, número de documento, fecha del pago y quién pagó.
- **Datos para el alta:** primero los básicos de matrícula. Los demás se cargan después del primer paso.
- **Colegios:** hoy no se pide en tecnicatura (si el colegio no está en la lista genera demoras), pero a la Secretaría le interesa mucho. Queda como dato para después del primer paso.
- El sistema académico **importa Excel** con los **códigos de la secretaría** (por ejemplo, qué código es DNI y cuál pasaporte). La idea es que el sistema nuevo exporte ya en ese formato.
- **Orden acordado:** primero el flujo general, después formato y códigos.
- **Autorización:** Christian pidió los mails del grupo y la **autorización de Sebastián** para poder pasarles información (habló de información todavía "no autorizada"). Esto condiciona el envío de la estructura de datos.

---

## 9. Criterios firmes

1. El **pago es el hito** que habilita todo lo demás.
2. **No se toca la base directo**: interfaces, exportaciones o vistas de consulta.
3. **No reemplazar** los sistemas existentes ni duplicar información.
4. **No agregar tareas manuales** a los sectores.
5. El objetivo es **agilizar el ingreso**, no digitalizar el formulario.
6. **Primero el MVP** (capturar el pago). El resto son "chiches que ayudan".

**Ideas del grupo fuera del MVP:** un servicio externo para autenticación y procesamiento de imágenes/PDF para ayudar a validar documentación. También **mails automáticos** al pagador apenas se carga el pago.

---

## 10. Requerimientos extraíbles

**Funcionales**
- **RF1** Preinscripción con datos mínimos antes de habilitar el pago.
- **RF2** Registro del pago: nombre, documento, fecha y quién pagó.
- **RF3** La confirmación del pago habilita el alta.
- **RF4** Exportación diaria con el formato y los códigos que consume el sistema académico.
- **RF5** Notificaciones automáticas al pagador (comprobante recibido, pago acreditado, qué falta).
- **RF6** Confirmación manual de pagos en efectivo, acotada a un rol.
- **RF7** Integración con pasarela (**Pagos360**, por archivo o webhook), sin acoplarse a una sola.
- **RF8** Rol para administración/tesorería con acceso al sistema nuevo, para **exportar los datos de pagos al final del día** (aceptado por Christian, administración).

**No funcionales**
- **RNF1** No acceder a bases de terceros.
- **RNF2** Desacoplar el formato de intercambio para tolerar cambios del proveedor.
- **RNF3** No generar trabajo manual adicional.
- **RNF4** Contemplar devoluciones y bajas (registrar el ingreso antes de devolver).
- **RNF5** Soportar dos canales de pago conviviendo (digital y presencial).
- **RNF6** Descartar Mercado Pago como pasarela.

---

## 11. Pendientes y preguntas abiertas

- ¿Quién habilita la pasarela y con qué convenio?
- ¿Se puede conseguir una vista o informe de solo lectura, con qué permisos?
- ¿Cuál es la fuente de verdad ante personas duplicadas entre sistemas?
- ¿Quién confirma los pagos en efectivo y en cuánto tiempo?
- ¿Qué datos y códigos exactos espera el sistema académico?
- ¿Qué documentación debe estar validada antes de pagar?
- ¿Qué pasa si el pago se acredita y la documentación no valida (devolución, cupo)?
- ¿Cuánto es la reserva y es el total de la matrícula?
- ¿Cuál es la billetera con convenio que se mencionó?

---

## 12. Próximos pasos dichos en la reunión

1. **Charla exploratoria de 15–20 min** con sistemas/administración, **sin llevar solución técnica**.
2. Que les pasen la **estructura de datos básica** (antes, mandarle a Christian los mails del grupo y conseguir la autorización de Sebastián).
3. **Rehacer el flujo general**, porque el anterior ya no sirve.
4. Después, acordar formato de datos y códigos.
5. **Cerrar el diagrama del flujo con Sebastián**.

---

## 13. Frases para citar

> Verificar contra el audio antes de citar en el informe. `[B1]` = Bloque 1, etc.

- "la estructura de la base de datos y las relaciones no están en la base de datos, están en el programa." `[B1]`
- "no lo pueden hacer directamente a base de datos… solamente lo van a poder hacer por las interfaces" `[B1]`
- "si yo borro el curso, los alumnos no me avisan, no me avisan nada." `[B1]`
- "La idea de tener un nuevo ingreso es no reemplazar necesariamente cosas que ya están definidas" `[B1]`
- "la idea es evitar la dependencia de la comunicación con ellos, sino que sea la comunicación con la base de datos." `[B1]`
- "Si o si, el proceso tiene que iniciar con una pre-cursión." (preinscripción) `[B2]`
- "me ponen que de 50 pagos recibo un día 5 o 6 y me detienen los datos de la persona" `[B2]`
- "El pago es lo único." `[B3]`
- "el banco no te relaciona el movimiento con el [?]" `[B3]`
