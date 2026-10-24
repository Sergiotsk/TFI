# infrastructure/informe-de-pagos

Lee el informe de pagos de SysAdmin que Tesorería sube una vez por día y lo traduce a `PagoInformado[]`
(puerto `LectorDeInformeDePagos`). El formato real está **pendiente**: lo tiene que pasar Administración
(T04, #33). Mientras tanto, `LectorDeInformeProvisorio` lee un formato provisorio; cuando llegue el real,
se agrega otro adaptador y se cambia en la raíz de composición, sin tocar los casos de uso.

## Formato provisorio

CSV con encabezado, separado por coma o por punto y coma (el Excel en español exporta con `;`):

```csv
referencia;dni;numero;monto;fecha_pago
REC-0001;30111222;000093;15000,00;2026-10-20
REC-0002;30111333;;15000;2026-10-20T14:30:00-03:00
```

| Columna | Obligatoria | Formato |
|---|---|---|
| `referencia` | sí | Identifica el pago en SysAdmin. No se puede repetir: si se reimporta, el pago sale `DUPLICADO` |
| `dni` | una de las dos | 7 u 8 dígitos |
| `numero` | una de las dos | Número de Postulación (acepta los ceros a la izquierda) |
| `monto` | sí | Pesos, con hasta 2 decimales (`.` o `,`) y sin separador de miles |
| `fecha_pago` | sí | `AAAA-MM-DD` (se toma como el comienzo de ese día en Argentina) o fecha y hora ISO con zona |

Si alguna línea es inválida se rechaza el archivo entero, con el número de línea y el motivo.
