import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { LectorDeInformesXlsx } from './lector-de-informes-xlsx'
import type { PerfilDeInforme } from './perfil-de-informe'
import { PERFIL_SYSADMIN_UTN_HAEDO } from './perfiles/sysadmin-utn-haedo'

// Encabezado como lo exporta SysAdmin: nombres rellenados con espacios.
const ENCABEZADO = [
  'Fecha Recibo',
  'Nro Recibo',
  'Nombre Originante del Ingreso          ',
  'Nro Doc      ',
  'Monto recibido          ',
  'Descripción Recibo                     ',
  'Descripción Conc de Ingreso            ',
]

type Celda = string | number | Date | null

/** Una fila de datos inventados: fecha (serial de Excel o Date), recibo, DNI, monto y descripción. */
function fila(recibo: Celda, dni: Celda, monto: Celda, fecha: Celda = 46296, descripcion = 'MATRICULA TUP 2027'): Celda[] {
  return [fecha, recibo, 'Persona de Prueba', dni, monto, descripcion, 'Tecnicatura de prueba']
}

/** Arma una planilla como la de SysAdmin: títulos arriba, el encabezado en `filaDelEncabezado` y los datos. */
async function planilla(filas: Celda[][], opciones: { filaDelEncabezado?: number; encabezado?: string[] } = {}) {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Hoja1')
  const filaDelEncabezado = opciones.filaDelEncabezado ?? 6
  hoja.getCell('A2').value = 'Institución de prueba'
  hoja.getCell('A4').value = 'Informe (Fecha Recibo=01/10/2026..31/10/2026)'

  hoja.getRow(filaDelEncabezado).values = opciones.encabezado ?? ENCABEZADO
  filas.forEach((valores, indice) => {
    const numero = filaDelEncabezado + 1 + indice
    hoja.getRow(numero).values = valores
    if (typeof valores[0] === 'number') hoja.getCell(numero, 1).numFmt = 'dd/mm/yyyy'
  })

  return new Uint8Array(await libro.xlsx.writeBuffer())
}

async function leerOk(contenido: Uint8Array, perfil: PerfilDeInforme = PERFIL_SYSADMIN_UTN_HAEDO) {
  const resultado = await new LectorDeInformesXlsx(perfil).leer(contenido)
  if (!resultado.ok) throw new Error(`Se esperaba un informe válido: ${JSON.stringify(resultado.errores)}`)
  return resultado
}

async function leerErrores(contenido: Uint8Array, perfil: PerfilDeInforme = PERFIL_SYSADMIN_UTN_HAEDO) {
  const resultado = await new LectorDeInformesXlsx(perfil).leer(contenido)
  if (resultado.ok) throw new Error('Se esperaba un informe inválido')
  return resultado.errores
}

describe('LectorDeInformesXlsx', () => {
  it('lee el informe de SysAdmin con el encabezado en la fila 6', async () => {
    const { pagos, descartadas } = await leerOk(await planilla([fila(7547, '30111222', 100000)]))

    expect(descartadas).toBe(0)
    expect(pagos).toHaveLength(1)
    const [pago] = pagos
    expect(pago?.referencia.proveedor).toBe('INFORME_SYSADMIN')
    expect(pago?.referencia.referenciaExterna).toBe('7547')
    expect(pago?.dni?.valor).toBe('30111222')
    expect(pago?.numero).toBeUndefined()
    expect(pago?.monto.centavos).toBe(10_000_000)
  })

  it('encuentra el encabezado aunque esté en otra fila', async () => {
    const { pagos } = await leerOk(await planilla([fila(1, '30111222', 100000)], { filaDelEncabezado: 4 }))

    expect(pagos).toHaveLength(1)
  })

  it('una fecha es el comienzo de ese día en Argentina, venga como serial o como fecha', async () => {
    const { pagos } = await leerOk(
      await planilla([
        fila(1, '30111222', 100000, 46296),
        fila(2, '30111333', 100000, new Date(Date.UTC(2026, 9, 1))),
      ]),
    )

    expect(pagos.map((p) => p.pagadoEl.toISOString())).toEqual(['2026-10-01T03:00:00.000Z', '2026-10-01T03:00:00.000Z'])
  })

  it('acepta el DNI como número o con puntos, y el monto con centavos', async () => {
    const { pagos } = await leerOk(await planilla([fila(1, 30111222, 99900.5), fila(2, '30.111.333', '100000')]))

    expect(pagos.map((p) => p.dni?.valor)).toEqual(['30111222', '30111333'])
    expect(pagos.map((p) => p.monto.centavos)).toEqual([9_990_050, 10_000_000])
  })

  it('un documento que no es un DNI deja la fila sin DNI, no es un error', async () => {
    const { pagos } = await leerOk(await planilla([fila(1, '######', 100000), fila(2, 'AB1234567', 100000)]))

    expect(pagos.map((p) => p.dni)).toEqual([undefined, undefined])
  })

  it('lee hasta la primera fila vacía', async () => {
    const { pagos } = await leerOk(await planilla([fila(1, '30111222', 100000), [], fila(2, '30111333', 100000)]))

    expect(pagos).toHaveLength(1)
  })

  describe('filtro de concepto', () => {
    const filas = [
      fila(1, '30111222', 100000, 46296, 'MATRICULA TUP 2027'),
      fila(2, '30111333', 100000, 46296, 'CUOTA TUP - OCTUBRE 2026'),
    ]

    it('el perfil de SysAdmin arranca sin filtro: pasan todas las filas', async () => {
      const { pagos, descartadas } = await leerOk(await planilla(filas))

      expect(pagos).toHaveLength(2)
      expect(descartadas).toBe(0)
    })

    it('con concepto, descarta las filas cuya descripción no lo incluye (sin mirar acentos ni mayúsculas)', async () => {
      const perfil = { ...PERFIL_SYSADMIN_UTN_HAEDO, concepto: 'Matrícula' }

      const { pagos, descartadas } = await leerOk(await planilla(filas), perfil)

      expect(pagos.map((p) => p.referencia.referenciaExterna)).toEqual(['1'])
      expect(descartadas).toBe(1)
    })
  })

  describe('rechaza el archivo entero', () => {
    it('si falta una columna obligatoria', async () => {
      const encabezado = ENCABEZADO.filter((columna) => !columna.startsWith('Monto'))

      const errores = await leerErrores(await planilla([], { encabezado }))

      expect(errores).toEqual([{ linea: 1, mensaje: expect.stringContaining('Monto recibido') }])
    })

    it('con cada fila inválida y su número de fila de Excel', async () => {
      const errores = await leerErrores(
        await planilla([
          fila(1, '30111222', 100000),
          fila(1, '30111333', 100000),
          fila(3, '30111444', 0),
          fila(4, '30111555', 'cien mil'),
          fila(null, '30111666', 100000),
          fila(6, '30111777', 100000, 'ayer'),
        ]),
      )

      expect(errores.map((e) => e.linea)).toEqual([8, 9, 10, 11, 12])
      expect(errores[0]?.mensaje).toContain('repetido')
    })

    it('si no es una planilla de Excel', async () => {
      const errores = await leerErrores(new TextEncoder().encode('referencia;dni;monto\n1;30111222;100'))

      expect(errores).toEqual([{ linea: 1, mensaje: expect.stringContaining('.xlsx') }])
    })

    it('si no tiene filas de pagos', async () => {
      const errores = await leerErrores(await planilla([]))

      expect(errores).toEqual([{ linea: 7, mensaje: 'El informe no tiene pagos' }])
    })
  })
})
