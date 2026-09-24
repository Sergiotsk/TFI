# Entrevista con el director de la TUP — versión ordenada

> Documento editorial elaborado a partir de una transcripción automática de aproximadamente una hora. Se eliminaron repeticiones, muletillas y pasajes no relacionados con la entrevista. Los nombres de sistemas y personas que no se distinguen con claridad se conservan como referencia general o se señalan como pendientes de validación.

## Resumen ejecutivo

La principal necesidad de la TUP es **reorganizar el proceso de inscripción**. Hoy, una persona interesada completa un formulario, recibe correos con enlaces a carpetas, sube documentación y luego obtiene instrucciones para pagar la matrícula. El proceso es mayormente manual, se apoya en correos electrónicos y no permite conocer con certeza, en tiempo real, cuántos ingresantes están realmente confirmados.

El punto crítico identificado es la **confirmación del pago**. La propuesta central es que el pago acreditado sea el hito que confirme la vacante y transforme al interesado en ingresante. La carga y validación de documentación continuaría después, con requisitos informados de forma clara desde el inicio.

## 1. Problema prioritario

### 1.1 Incertidumbre sobre las vacantes

La facultad necesita alcanzar una cantidad definida de ingresantes, pero hoy trabaja con estimaciones. Para completar, por ejemplo, 100 vacantes, suele ser necesario avanzar con entre un 40 % y un 50 % más de personas interesadas, porque muchas abandonan el proceso antes de pagar.

Esto genera dos riesgos opuestos:

- Quedar por debajo de la cantidad necesaria de ingresantes.
- Ofrecer más vacantes de las disponibles y luego no poder confirmarlas.

### 1.2 Proceso fragmentado y manual

La inscripción se distribuye entre formularios, correos, carpetas compartidas, comprobantes de transferencia, Tesorería y sistemas institucionales. No existe una vista única que permita seguir el estado de cada persona.

Las consecuencias son:

- Seguimiento manual de cantidades y estados.
- Dificultad para distinguir interesados de ingresantes confirmados.
- Comunicaciones perdidas por direcciones de correo erróneas, spam o falta de respuesta.
- Verificación manual de comprobantes y pagos.
- Datos duplicados o inconsistentes al importarlos a los sistemas institucionales.

## 2. Flujo actual de inscripción

1. **Carga inicial de datos.** La persona interesada completa un formulario web con datos personales y de contacto.
2. **Envío de correo y documentación.** Recibe por correo un enlace a una carpeta compartida para cargar documentación, con una ventana aproximada de 48 horas.
3. **Revisión de documentación.** El equipo controla visualmente certificados analíticos y demás requisitos para determinar si la persona podría cursar.
4. **Oferta de vacante.** Si hay cupo y la documentación resulta aceptable, se envía otro correo con la oferta y las instrucciones para pagar la matrícula.
5. **Pago y confirmación.** El pago puede ser por transferencia, presencial o en efectivo. La verificación y la comunicación con Tesorería son manuales.
6. **Alta posterior.** Una vez confirmado, se avanza con la carga o importación de datos en los sistemas académico-administrativos.

### Estado problemático

Durante casi todo el circuito, la persona sigue siendo solamente una **interesada**. La institución no sabe con certeza si ocupará una vacante hasta que el pago se verifica, lo cual puede tardar y depender de varias personas y canales.

## 3. Criterio de negocio acordado

### Definición de ingresante

El pago acreditado debe ser el hito que:

- Confirme la reserva de vacante.
- Transforme a la persona interesada en ingresante.
- Actualice inmediatamente la disponibilidad de cupos.

La idea expresada en la reunión es: **“pago acreditado = vacante confirmada”**.

### Información previa obligatoria

Antes del pago, la persona debe conocer con claridad:

- Características y condiciones de la carrera.
- Monto de matrícula y modalidades de pago.
- Documentación requerida.
- Requisitos de admisión y situaciones que podrían impedir el ingreso.
- Tratamiento posterior de la documentación y los datos personales.

Esto reduce reclamos y evita que el pago se interprete como una aceptación sin condiciones previamente informadas.

## 4. Propuesta funcional

### 4.1 Portal de postulantes

Crear un subsistema o portal específico para postulantes, separado del acceso habitual de estudiantes, con una cuenta o sesión propia durante el proceso de ingreso.

El portal debería permitir:

- Completar y corregir datos personales.
- Cargar documentación.
- Consultar requisitos, estado y cupos.
- Recibir notificaciones centralizadas dentro del sistema.
- Acceder a las opciones de pago.
- Ver la confirmación inmediata cuando el pago se acredita.

Al concretarse el ingreso, el acceso de postulante puede desactivarse o convertirse en el acceso regular al sistema académico.

### 4.2 Estados mínimos del proceso

| Estado | Condición | Acción del sistema |
| --- | --- | --- |
| Interesado | Inicia la inscripción o consulta requisitos. | Registra datos y orienta el proceso. |
| Postulante con pago pendiente | Acepta las condiciones e inicia el pago. | Muestra modalidades y vigencia. |
| Ingresante confirmado | El pago se acredita. | Reserva vacante, descuenta cupo y confirma el ingreso. |
| Documentación pendiente / en revisión | Falta documentación o requiere control. | Solicita correcciones y permite seguimiento. |
| No admitido / desistido | No cumple requisitos o abandona. | Libera o no reserva vacante según la regla definida. |

> La revisión documental es necesaria, pero no debería demorar la visualización del cupo confirmado cuando el pago ya se acreditó, salvo que la institución defina expresamente una excepción.

## 5. Pagos: requisito principal de la solución

### 5.1 Pagos digitales

Se propone integrar una pasarela de pago que notifique la acreditación en tiempo real. El sistema debe:

- Confirmar automáticamente el pago.
- Actualizar el estado de la persona y el contador de vacantes.
- Evitar depender del envío manual de comprobantes.
- Informar la operación a Tesorería según el mecanismo acordado.

### 5.2 Pagos presenciales o en efectivo

No pueden omitirse, porque requieren intervención de Tesorería. Deben contemplarse dos alternativas a validar:

1. **Integración con el sistema de Tesorería:** el nuevo sistema consulta o recibe la confirmación del pago.
2. **Rol de Tesorería en el portal:** Tesorería marca manualmente la acreditación de los pagos presenciales.

Para estos casos se planteó un plazo acotado —por ejemplo, 12 o 24 horas—, pero la vacante solo queda asegurada cuando el pago se registra como acreditado.

### 5.3 Principio de integración

La solución no debe crear tareas manuales adicionales. Lo ideal es que Tesorería siga trabajando con su sistema habitual y que el portal capture el estado necesario mediante una integración. Si esto no fuera viable, se deberá definir un flujo manual claro y mínimo.

## 6. Documentación y calidad de datos

### Validación actual

La documentación se revisa visualmente. Se controla, entre otros aspectos, que el certificado analítico y los datos declarados sean coherentes y que la persona pueda cursar. No se identificó una verificación oficial automática en esta etapa.

### Riesgos detectados

- Archivos incompletos, erróneos o no correspondientes.
- Datos de contacto mal cargados.
- Personas ya registradas en sistemas institucionales que pueden duplicarse.
- Importación de datos sin suficientes controles de consistencia.

### Recomendaciones

- Validar formato y obligatoriedad de los datos antes de avanzar.
- Usar DNI u otro identificador institucional para detectar duplicados.
- Mantener trazabilidad de quién revisó y aprobó cada documento.
- Informar desde el inicio la documentación que se exigirá, aun si se controla después del pago.

## 7. Integraciones y restricciones institucionales

- La TUP utiliza sistemas académico-administrativos existentes; la importación actual de datos se realiza con procedimientos internos y puede producir inconsistencias.
- Es necesario conocer qué datos puede intercambiar el sistema de Tesorería y cómo confirma pagos.
- Debe evaluarse la integración entre los sistemas existentes y el nuevo portal antes de diseñar el flujo definitivo.
- El alojamiento y tratamiento de datos personales requiere validación institucional, especialmente si se consideran servidores fuera del país.
- Se deberán incluir términos y condiciones y contemplar la normativa aplicable a datos personales.

## 8. Próximos pasos acordados

1. Coordinar una reunión exploratoria con Tesorería.
2. Incorporar al responsable de sistemas académico-administrativos para revisar las integraciones posibles.
3. Relevar el sistema de Tesorería: modalidades de cobro, tiempos de acreditación, datos disponibles y posibles mecanismos de consulta o notificación.
4. Definir formalmente los estados del postulante, las reglas de reserva de vacante y las excepciones documentales.
5. Diseñar el flujo de pagos digitales y el tratamiento de pagos presenciales/en efectivo.
6. Confirmar la política institucional de almacenamiento y protección de datos personales.

## 9. Preguntas pendientes de definición

- ¿El pago confirma siempre la vacante o existen excepciones por requisitos documentales?
- ¿Qué documentación mínima debe presentarse antes de pagar?
- ¿Cuál será el plazo exacto para pagos presenciales o en efectivo?
- ¿Tesorería puede exponer o notificar el estado de un pago al nuevo sistema?
- ¿Qué sistema será la fuente de verdad para evitar duplicados?
- ¿Dónde se alojarán los datos y qué aprobaciones institucionales se requieren?

## Conclusión

La solución no debe limitarse a digitalizar el formulario existente. Debe **rediseñar el proceso de admisión** para centralizar la comunicación, dar visibilidad del estado de cada postulante y convertir la acreditación del pago en el evento que confirma el cupo. La viabilidad depende, sobre todo, de acordar el flujo con Tesorería y de integrar de manera segura los sistemas institucionales ya existentes.
