# infrastructure/informe-de-pagos

Lee el informe de pagos que Tesorería sube y lo traduce a `PagoInformado[]` (puerto `LectorDeInformeDePagos`,
ADR 0011).

- `LectorDeInformesXlsx` lee cualquier planilla `.xlsx` según un `PerfilDeInforme`.
- `PerfilDeInforme` dice qué columnas buscar, de qué proveedor son los pagos y, opcionalmente, qué concepto
  tiene que traer la descripción. Otra institución se suma con un perfil nuevo en `perfiles/`.
- La raíz de composición elige el perfil.

## Cómo lee

- Usa la primera hoja.
- El encabezado es la primera fila (de las 20 primeras) que tiene todas las columnas del perfil. Los nombres se
  comparan sin acentos, sin mayúsculas y sin los espacios de relleno.
- Los datos van desde la fila siguiente hasta la primera fila vacía, con un tope de 5000.
- La fecha (serial de Excel o fecha) es el comienzo de ese día en Argentina (UTC-3), así un pago del mismo día
  del vencimiento cuenta en plazo.
- El monto va en pesos y se guarda en centavos.
- Un documento que no es un DNI (7 u 8 dígitos, con o sin puntos) deja la fila sin DNI. No es un error: el caso
  de uso la ignora.
- Si alguna fila es inválida (recibo, monto o fecha) o un recibo se repite, se rechaza el archivo entero, con el
  número de fila de Excel y el motivo.

## Informe de SysAdmin (UTN Haedo)

Perfil `PERFIL_SYSADMIN_UTN_HAEDO`. Filas de título arriba y el encabezado en una fila que cambia de un informe a
otro.

| Columna | Uso |
|---|---|
| `Fecha Recibo` | Fecha de pago |
| `Nro Recibo` | Referencia del pago (`INFORME_SYSADMIN`). Si se reimporta, el pago sale `DUPLICADO` |
| `Nombre Originante del Ingreso` | No se usa |
| `Nro Doc` | DNI de quien pagó |
| `Monto recibido` | Monto en pesos |
| `Descripción Recibo` | Texto libre. Se usaría para el filtro de concepto, hoy apagado |
| `Descripción Conc de Ingreso` | No se usa (es la carrera) |

El informe trae también las cuotas de quienes ya cursan. El filtro de concepto está apagado hasta que SysAdmin
confirme el texto de la seña (MATRICULA es provisorio, #33). Mientras tanto, la admisión ignora por DNI las filas
que no son suyas (ADR 0011).

Las planillas de los tests son sintéticas: nunca se versiona un informe real (Ley 25.326).
