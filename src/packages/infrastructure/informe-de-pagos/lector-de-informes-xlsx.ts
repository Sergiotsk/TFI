import ExcelJS from 'exceljs'
import { Dni, Monto, ReferenciaDePago, type PagoInformado } from '@tfi/domain'
import type { ErrorDeLectura, LectorDeInformeDePagos, ResultadoDeLectura } from '@tfi/application'
import type { PerfilDeInforme } from './perfil-de-informe'

const MAXIMO_DE_FILAS = 5000
/** El encabezado se busca en las primeras filas: arriba suele haber títulos. */
const FILAS_PARA_EL_ENCABEZADO = 20

// Pesos con hasta 2 decimales (punto o coma) y sin separador de miles, para un monto que viene como texto.
const MONTO = /^(\d+)(?:[.,](\d{1,2}))?$/
// Un DNI con puntos, espacios o guiones de separación; cualquier otra cosa no es un DNI.
const DNI = /^\d{1,2}[.\s-]?\d{3}[.\s-]?\d{3}$/
const DIA = 24 * 60 * 60 * 1000
// El día 0 de los seriales de Excel (con el bug del 29/02/1900, que no afecta a fechas actuales).
const ORIGEN_DE_EXCEL = Date.UTC(1899, 11, 30)

type Campo = 'fecha' | 'referencia' | 'dni' | 'monto' | 'descripcion'

/**
 * Lee el informe de pagos de una planilla `.xlsx` según el perfil de la institución (ADR 0011).
 *
 * Usa la primera hoja. El encabezado es la primera fila que tiene todas las columnas del perfil, y los
 * datos van desde la fila siguiente hasta la primera vacía. Una fecha es el comienzo de ese día en
 * Argentina (UTC-3), así un pago del mismo día del vencimiento cuenta en plazo. Un documento que no es
 * un DNI deja la fila sin DNI: decide el caso de uso.
 */
export class LectorDeInformesXlsx implements LectorDeInformeDePagos {
  constructor(private readonly perfil: PerfilDeInforme) {}

  async leer(contenido: Uint8Array): Promise<ResultadoDeLectura> {
    const hoja = await primeraHoja(contenido)
    if (!hoja) {
      return { ok: false, errores: [{ linea: 1, mensaje: 'El archivo no es una planilla de Excel (.xlsx) válida' }] }
    }

    const nombres = this.columnasBuscadas()
    const encabezado = buscarEncabezado(hoja, nombres)
    if (!encabezado) {
      const lista = Object.values(nombres).join(', ')
      return {
        ok: false,
        errores: [{ linea: 1, mensaje: `No se encontró el encabezado del informe: tiene que tener las columnas ${lista}` }],
      }
    }

    const pagos: PagoInformado[] = []
    const errores: ErrorDeLectura[] = []
    const vistas = new Map<string, number>()
    let descartadas = 0
    let linea = encabezado.fila + 1

    for (; linea <= hoja.rowCount; linea += 1) {
      const fila = hoja.getRow(linea)
      const campo = (nombre: Campo) => {
        const columna = encabezado.columnas.get(nombre)
        return columna === undefined ? null : valorDeCelda(fila.getCell(columna).value)
      }
      if (Object.keys(nombres).every((nombre) => vacio(campo(nombre as Campo)))) break
      if (linea - encabezado.fila > MAXIMO_DE_FILAS) {
        return { ok: false, errores: [{ linea, mensaje: `El informe supera las ${MAXIMO_DE_FILAS} filas` }] }
      }

      if (this.perfil.concepto !== undefined && !normalizar(texto(campo('descripcion'))).includes(normalizar(this.perfil.concepto))) {
        descartadas += 1
        continue
      }

      const pago = this.leerFila(campo)
      if (typeof pago === 'string') {
        errores.push({ linea, mensaje: pago })
        continue
      }

      const referencia = pago.referencia.referenciaExterna
      const anterior = vistas.get(referencia)
      if (anterior !== undefined) {
        errores.push({ linea, mensaje: `El recibo ${referencia} está repetido (ya aparece en la fila ${anterior})` })
        continue
      }
      vistas.set(referencia, linea)
      pagos.push(pago)
    }

    if (errores.length > 0) return { ok: false, errores }
    if (pagos.length === 0 && descartadas === 0) {
      return { ok: false, errores: [{ linea: encabezado.fila + 1, mensaje: 'El informe no tiene pagos' }] }
    }
    return { ok: true, pagos, descartadas }
  }

  /** Las columnas a encontrar en el encabezado: la descripción solo si hay que filtrar por concepto. */
  private columnasBuscadas(): Partial<Record<Campo, string>> {
    const { descripcion, ...obligatorias } = this.perfil.columnas
    return this.perfil.concepto !== undefined && descripcion !== undefined ? { ...obligatorias, descripcion } : obligatorias
  }

  /** Una fila válida, o el motivo por el que no lo es. */
  private leerFila(campo: (nombre: Campo) => Valor): PagoInformado | string {
    const referencia = leerReferencia(campo('referencia'))
    if (referencia === null) return `Falta el número de recibo, o no es válido ("${texto(campo('referencia'))}")`

    const centavos = leerCentavos(campo('monto'))
    if (centavos === null) return `El monto "${texto(campo('monto'))}" no es válido: tienen que ser pesos mayores a 0`

    const pagadoEl = leerFecha(campo('fecha'))
    if (!pagadoEl) return `La fecha "${texto(campo('fecha'))}" no es válida`

    const documento = texto(campo('dni'))
    return {
      referencia: new ReferenciaDePago(this.perfil.proveedor, referencia),
      monto: new Monto(centavos),
      pagadoEl,
      dni: DNI.test(documento) ? new Dni(documento.replace(/\D/g, '')) : undefined,
    }
  }
}

type Valor = string | number | Date | null

async function primeraHoja(contenido: Uint8Array): Promise<ExcelJS.Worksheet | null> {
  try {
    const libro = new ExcelJS.Workbook()
    // Los tipos de exceljs llaman `Buffer` a un ArrayBuffer: se copia el rango exacto de los bytes.
    await libro.xlsx.load(contenido.slice().buffer)
    return libro.worksheets[0] ?? null
  } catch {
    return null
  }
}

function buscarEncabezado(
  hoja: ExcelJS.Worksheet,
  nombres: Partial<Record<Campo, string>>,
): { fila: number; columnas: Map<Campo, number> } | null {
  const ultima = Math.min(hoja.rowCount, FILAS_PARA_EL_ENCABEZADO)
  for (let numero = 1; numero <= ultima; numero += 1) {
    const enLaFila = new Map<string, number>()
    hoja.getRow(numero).eachCell((celda, columna) => {
      enLaFila.set(normalizar(texto(valorDeCelda(celda.value))), columna)
    })

    const columnas = new Map<Campo, number>()
    for (const [campo, nombre] of Object.entries(nombres)) {
      const columna = enLaFila.get(normalizar(nombre ?? ''))
      if (columna !== undefined) columnas.set(campo as Campo, columna)
    }
    if (columnas.size === Object.keys(nombres).length) return { fila: numero, columnas }
  }
  return null
}

/** El valor de una celda en un tipo simple: texto enriquecido y fórmulas se reducen a su resultado. */
function valorDeCelda(valor: ExcelJS.CellValue): Valor {
  if (valor === null || valor === undefined) return null
  if (typeof valor === 'string' || typeof valor === 'number' || valor instanceof Date) return valor
  if (typeof valor === 'boolean') return String(valor)
  if ('richText' in valor) return valor.richText.map((parte) => parte.text).join('')
  if ('result' in valor) return valorDeCelda(valor.result as ExcelJS.CellValue)
  if ('text' in valor) return valor.text
  return null
}

function leerReferencia(valor: Valor): string | null {
  if (typeof valor === 'number') return Number.isSafeInteger(valor) && valor > 0 ? String(valor) : null
  const referencia = texto(valor)
  return referencia === '' ? null : referencia
}

function leerCentavos(valor: Valor): number | null {
  if (typeof valor === 'number') {
    const centavos = Math.round(valor * 100)
    return Number.isSafeInteger(centavos) && centavos > 0 ? centavos : null
  }
  const monto = MONTO.exec(texto(valor))
  if (!monto) return null
  const centavos = Number(monto[1]) * 100 + Number((monto[2] ?? '0').padEnd(2, '0'))
  return centavos > 0 ? centavos : null
}

function leerFecha(valor: Valor): Date | null {
  let dia: Date
  if (valor instanceof Date) dia = valor
  else if (typeof valor === 'number' && Number.isInteger(valor) && valor > 0) dia = new Date(ORIGEN_DE_EXCEL + valor * DIA)
  else return null
  if (Number.isNaN(dia.getTime())) return null
  return new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 3))
}

function texto(valor: Valor): string {
  if (valor === null) return ''
  if (valor instanceof Date) return valor.toISOString()
  return String(valor).trim()
}

function vacio(valor: Valor): boolean {
  return texto(valor) === ''
}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
}
