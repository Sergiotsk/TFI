import {
  Dni,
  Monto,
  NumeroDePostulacion,
  ReferenciaDePago,
  type PagoInformado,
} from '@tfi/domain'
import type { ErrorDeLectura, LectorDeInformeDePagos, ResultadoDeLectura } from '@tfi/application'

const OBLIGATORIAS = ['referencia', 'monto', 'fecha_pago'] as const
const MAXIMO_DE_FILAS = 5000

// Pesos con hasta 2 decimales (punto o coma) y sin separador de miles: el
// monto se pasa a centavos leyendo el texto, nunca con float.
const MONTO = /^(\d+)(?:[.,](\d{1,2}))?$/
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const FECHA_Y_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

/**
 * Lector del informe de pagos con el formato **provisorio** (hasta que T04
 * confirme el real).
 *
 * CSV con encabezado, separado por coma o por punto y coma, con las columnas
 * `referencia`, `monto` y `fecha_pago`, y al menos una de `dni` o `numero`
 * por fila. El monto va en pesos; una fecha sin hora es el comienzo de ese día
 * en Argentina (UTC-3), así un pago del mismo día del vencimiento cuenta en plazo.
 */
export class LectorDeInformeProvisorio implements LectorDeInformeDePagos {
  leer(contenido: string): ResultadoDeLectura {
    const lineas = contenido.replace(/^\uFEFF/, '').split(/\r?\n/)
    const [encabezado = ''] = lineas
    if (encabezado.trim() === '') {
      return { ok: false, errores: [{ linea: 1, mensaje: 'El archivo está vacío' }] }
    }

    const separador = encabezado.includes(';') ? ';' : ','
    const columnas = dividir(encabezado, separador).map((c) => c.toLowerCase())
    if (!OBLIGATORIAS.every((c) => columnas.includes(c))) {
      return {
        ok: false,
        errores: [
          {
            linea: 1,
            mensaje: 'El encabezado tiene que tener las columnas referencia, monto y fecha_pago (dni y numero son opcionales)',
          },
        ],
      }
    }

    const pagos: PagoInformado[] = []
    const errores: ErrorDeLectura[] = []
    const vistas = new Map<string, number>()

    lineas.slice(1).forEach((texto, indice) => {
      if (texto.trim() === '') return
      const linea = indice + 2
      const valores = dividir(texto, separador)
      if (valores.length !== columnas.length) {
        errores.push({ linea, mensaje: `La línea tiene ${valores.length} columnas y el encabezado ${columnas.length}` })
        return
      }

      const campo = (nombre: string) => valores[columnas.indexOf(nombre)] ?? ''
      const fila = leerFila(campo)
      if (typeof fila === 'string') {
        errores.push({ linea, mensaje: fila })
        return
      }

      const anterior = vistas.get(fila.referencia.referenciaExterna)
      if (anterior !== undefined) {
        errores.push({
          linea,
          mensaje: `La referencia ${fila.referencia.referenciaExterna} está repetida (ya aparece en la línea ${anterior})`,
        })
        return
      }

      vistas.set(fila.referencia.referenciaExterna, linea)
      pagos.push(fila)
    })

    if (errores.length > 0) return { ok: false, errores }
    if (pagos.length === 0) return { ok: false, errores: [{ linea: 2, mensaje: 'El informe no tiene pagos' }] }
    if (pagos.length > MAXIMO_DE_FILAS) {
      return { ok: false, errores: [{ linea: 1, mensaje: `El informe supera las ${MAXIMO_DE_FILAS} filas` }] }
    }

    return { ok: true, pagos }
  }
}

/** Una fila válida, o el motivo por el que no lo es. */
function leerFila(campo: (nombre: string) => string): PagoInformado | string {
  const referencia = campo('referencia')
  if (referencia === '') return 'Falta la referencia del pago'

  const dni = campo('dni')
  const numero = campo('numero')
  if (dni === '' && numero === '') return 'Falta el DNI o el número de Postulación'
  if (dni !== '' && !/^\d{7,8}$/.test(dni)) return `El DNI "${dni}" tiene que tener 7 u 8 dígitos`
  if (numero !== '' && !/^\d+$/.test(numero)) return `El número de Postulación "${numero}" no es válido`

  const monto = MONTO.exec(campo('monto'))
  if (!monto) {
    return `El monto "${campo('monto')}" no es válido: usá pesos con hasta 2 decimales y sin separador de miles (por ejemplo, 15000,00)`
  }
  const centavos = Number(monto[1]) * 100 + Number((monto[2] ?? '0').padEnd(2, '0'))
  if (centavos === 0) return 'El monto tiene que ser mayor a 0'

  const pagadoEl = leerFecha(campo('fecha_pago'))
  if (!pagadoEl) {
    return `La fecha "${campo('fecha_pago')}" no es válida: usá AAAA-MM-DD o una fecha y hora ISO con zona horaria`
  }

  const valorDelNumero = numero === '' ? undefined : Number(numero)
  if (valorDelNumero === 0) return 'El número de Postulación no puede ser 0'

  return {
    referencia: new ReferenciaDePago('INFORME_SYSADMIN', referencia),
    monto: new Monto(centavos),
    pagadoEl,
    dni: dni === '' ? undefined : new Dni(dni),
    numero: valorDelNumero === undefined ? undefined : NumeroDePostulacion.desde(valorDelNumero),
  }
}

function leerFecha(texto: string): Date | null {
  const soloFecha = FECHA.exec(texto)
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha.map(Number)
    if (anio === undefined || mes === undefined || dia === undefined) return null
    const fecha = new Date(Date.UTC(anio, mes - 1, dia, 3))
    // Descarta fechas que no existen (2026-02-31 se correría al 3 de marzo).
    return fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia ? fecha : null
  }

  if (!FECHA_Y_HORA.test(texto)) return null
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function dividir(linea: string, separador: string): string[] {
  return linea.split(separador).map((valor) => valor.trim().replace(/^"(.*)"$/, '$1').trim())
}
