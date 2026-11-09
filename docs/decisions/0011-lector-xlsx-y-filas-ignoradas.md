# 0011 - Lector XLSX del informe de pagos y filas que la admisión ignora

## Estado

Propuesto (2026-10-30)

## Contexto

US1 importa el informe de pagos con un lector CSV provisorio, a la espera del formato real (T04, #33).
SysAdmin ya lo entregó: el "Informe TUP" es un `.xlsx` de una hoja, con filas de título arriba y el
encabezado en una fila que cambia de un informe a otro (en las muestras estuvo en la 4 y en la 6).
Las columnas son `Fecha Recibo` (serial de Excel), `Nro Recibo`, `Nombre Originante del Ingreso`,
`Nro Doc`, `Monto recibido` (pesos), `Descripción Recibo` (texto libre) y `Descripción Conc de
Ingreso` (la carrera).

Aparecen tres problemas:

1. **El archivo es binario.** El puerto `LectorDeInformeDePagos` recibe un `string`.
2. **El informe trae otra cosa además de las señas.** Casi todas las filas son cuotas mensuales de
   alumnos que ya cursan. La app solo acredita la seña de admisión, así que sin filtrar cada informe
   llenaría la bandeja de No imputados con cientos de filas ajenas.
3. **No sabemos con qué texto registra SysAdmin la seña.** El concepto provisorio es `MATRICULA`, pero
   no está confirmado, y la descripción es texto libre (`CUOTA TUP - OCTUBRE 2026`, `CUOTA TUP MES 10`,
   `PARTE CUOTA ...`, `A CTA. ...`).

## Decisión

- **El puerto recibe bytes y es asíncrono:** `leer(contenido: Uint8Array): Promise<ResultadoDeLectura>`.
  El resultado correcto informa además cuántas filas descartó el filtro de concepto.
- **Un lector genérico con un perfil por institución.** `LectorDeInformesXlsx` sabe leer una planilla;
  `PerfilDeInforme` dice qué columnas buscar, qué proveedor usar y si hay filtro de concepto. El
  perfil de SysAdmin UTN Haedo es solo datos. El encabezado se detecta (la primera fila que tiene todas
  las columnas obligatorias), no se fija.
- **La librería es `exceljs`**, con versión exacta.
- **El documento que no es un DNI no es un error de lectura.** La fila queda sin DNI y la decide el
  caso de uso. Los errores de estructura (recibo, fecha o monto inválidos, recibo repetido) siguen
  rechazando el archivo entero.
- **La admisión ignora las filas que no son suyas, solo para `INFORME_SYSADMIN`.** Si la imputación va
  por DNI y ese DNI no tiene Postulaciones, la fila queda `IGNORADO / SIN_POSTULACION`. Si todas sus
  Postulaciones ya ocupan cupo, queda `IGNORADO / YA_ADMITIDO`. La fila ignorada no se persiste como
  pago; se cuenta en el resumen de la carga (`ignorados`) y se lista en el resultado.
- **El filtro de concepto existe pero arranca apagado para SysAdmin.** Hasta que SysAdmin confirme el
  texto de la seña, la red de seguridad es el DNI.
- **Los pagos parciales no cambian:** un monto menor a la matrícula sigue `NO_IMPUTADO /
  MONTO_INSUFICIENTE`.

## Alternativas descartadas

- **Convertir el XLSX a CSV en el borde web y dejar el puerto como está.** Mete el formato del archivo
  en `apps/web` y fabrica un CSV intermedio sin sentido. Contradice el adaptador de importación de la
  Constitución.
- **SheetJS.** La versión de npm (0.18.5) está abandonada y tiene CVEs; la actual se instala desde el
  CDN de SheetJS, fuera del registro.
- **Importar todas las filas a No imputados.** Es lo más trazable, pero agrega unas 500 filas de ruido
  por mes.
- **Filtrar por concepto `MATRICULA` desde el día 1.** Si el texto real es otro, se descartan todas
  las señas sin que nadie se entere.
- **Dejar las cuotas de los admitidos como `YA_TIENE_PAGO`.** Un doble pago de seña quedaría siempre
  visible, a cambio de que cada mes la cohorte admitida llene la bandeja.
- **Ignorar también en el JSON manual y en Pagos360.** Esos pagos se iniciaron desde la app; una
  referencia desconocida ahí es un problema real que tiene que verse.

## Consecuencias

- ✅ Tesorería sube el archivo tal como sale de SysAdmin, sin editarlo.
- ✅ Otra institución se suma con un perfil nuevo, sin tocar el lector.
- ✅ Controlar cuotas a futuro es otro caso de uso sobre el mismo lector. Como la importación es
  idempotente por número de recibo, se pueden reimportar los informes viejos.
- ⚠️ Una seña pagada dos veces por alguien ya admitido no cae en la bandeja: solo aparece entre las
  filas ignoradas de esa carga.
- ⚠️ Si un aspirante paga con el DNI de otra persona, la fila se ignora como `SIN_POSTULACION`.
- ⚠️ Cambia un puerto y el dominio (`ResumenDeCarga.ignorados`): lleva dos aprobaciones y una
  migración que agrega la columna `ignorados` a `cargas_de_informe`.

## Cuándo re-evaluar

Cuando SysAdmin confirme el texto de la seña (prender el filtro de concepto), cuando se decida
controlar cuotas, o si aparece una institución cuyo informe no es una planilla.
