import { describe, expect, it } from 'vitest'
import { LectorDeInformeProvisorio } from './lector-provisorio'

const lector = new LectorDeInformeProvisorio()

function leerOk(contenido: string) {
  const resultado = lector.leer(contenido)
  if (!resultado.ok) throw new Error(`Se esperaba un informe válido: ${JSON.stringify(resultado.errores)}`)
  return resultado.pagos
}

function leerErrores(contenido: string) {
  const resultado = lector.leer(contenido)
  if (resultado.ok) throw new Error('Se esperaba un informe inválido')
  return resultado.errores
}

describe('LectorDeInformeProvisorio', () => {
  it('lee un CSV con comas y arma los pagos del informe de SysAdmin', () => {
    const [pago] = leerOk(
      'referencia,dni,numero,monto,fecha_pago\nREC-001,30111222,93,15000.00,2026-10-20T14:30:00-03:00\n',
    )

    expect(pago?.referencia.proveedor).toBe('INFORME_SYSADMIN')
    expect(pago?.referencia.referenciaExterna).toBe('REC-001')
    expect(pago?.dni?.valor).toBe('30111222')
    expect(pago?.numero?.valor).toBe(93)
    expect(pago?.monto.centavos).toBe(1_500_000)
    expect(pago?.pagadoEl.toISOString()).toBe('2026-10-20T17:30:00.000Z')
  })

  it('acepta punto y coma, coma decimal, columnas en otro orden, BOM y CRLF', () => {
    const [pago] = leerOk('\uFEFFFecha_Pago;Monto;Referencia;DNI\r\n2026-10-20;15000,5;REC-002;30111222\r\n')

    expect(pago?.monto.centavos).toBe(1_500_050)
    expect(pago?.numero).toBeUndefined()
  })

  it('una fecha sin hora es el comienzo de ese día en Argentina', () => {
    const [pago] = leerOk('referencia,dni,monto,fecha_pago\nREC-003,30111222,15000,2026-10-20\n')

    expect(pago?.pagadoEl.toISOString()).toBe('2026-10-20T03:00:00.000Z')
  })

  it('el número de Postulación acepta los ceros a la izquierda que ve el aspirante', () => {
    const [pago] = leerOk('referencia,numero,monto,fecha_pago\nREC-004,000093,15000,2026-10-20\n')

    expect(pago?.numero?.valor).toBe(93)
    expect(pago?.dni).toBeUndefined()
  })

  it('ignora las líneas en blanco', () => {
    const pagos = leerOk('referencia,dni,monto,fecha_pago\n\nREC-005,30111222,15000,2026-10-20\n\n')

    expect(pagos).toHaveLength(1)
  })

  it('rechaza el archivo con todas las líneas inválidas y su motivo', () => {
    const errores = leerErrores(
      [
        'referencia,dni,numero,monto,fecha_pago',
        'REC-1,30111222,,15000,2026-10-20',
        'REC-2,,,15000,2026-10-20',
        'REC-3,123,,15000,2026-10-20',
        'REC-4,30111222,,15.000,2026-10-20',
        'REC-5,30111222,,0,2026-10-20',
        'REC-6,30111222,,15000,20/10/2026',
        ',30111222,,15000,2026-10-20',
      ].join('\n'),
    )

    expect(errores.map((e) => e.linea)).toEqual([3, 4, 5, 6, 7, 8])
    expect(errores[0]?.mensaje).toMatch(/DNI o el número/)
    expect(errores[1]?.mensaje).toMatch(/DNI/)
    expect(errores[2]?.mensaje).toMatch(/monto/)
    expect(errores[4]?.mensaje).toMatch(/fecha/)
  })

  it('rechaza una referencia repetida dentro del mismo archivo', () => {
    const errores = leerErrores(
      'referencia,dni,monto,fecha_pago\nREC-1,30111222,15000,2026-10-20\nREC-1,30111333,15000,2026-10-20\n',
    )

    expect(errores).toEqual([{ linea: 3, mensaje: expect.stringMatching(/REC-1.*repetida/) }])
  })

  it('rechaza un encabezado sin las columnas obligatorias', () => {
    const errores = leerErrores('ref,importe\nREC-1,15000\n')

    expect(errores).toHaveLength(1)
    expect(errores[0]?.linea).toBe(1)
    expect(errores[0]?.mensaje).toMatch(/referencia.*monto.*fecha_pago/)
  })

  it('rechaza un archivo sin pagos', () => {
    expect(leerErrores('')).toEqual([{ linea: 1, mensaje: expect.stringMatching(/vacío/) }])
    expect(leerErrores('referencia,dni,monto,fecha_pago\n')).toEqual([
      { linea: 2, mensaje: expect.stringMatching(/no tiene pagos/) },
    ])
  })
})
