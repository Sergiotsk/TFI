import { describe, expect, test } from 'vitest'
import { ReferenciaDePago } from './referencia-de-pago'

describe('ReferenciaDePago', () => {
  test('expone proveedor y referencia externa', () => {
    const referencia = new ReferenciaDePago('INFORME_SYSADMIN', 'REC-0001')

    expect(referencia.proveedor).toBe('INFORME_SYSADMIN')
    expect(referencia.referenciaExterna).toBe('REC-0001')
  })

  test('el par proveedor + referencia identifica el pago: iguales si coinciden ambos', () => {
    const a = new ReferenciaDePago('PAGOS360', 'abc')

    expect(a.igualA(new ReferenciaDePago('PAGOS360', 'abc'))).toBe(true)
  })

  test('misma referencia en otro proveedor no es igual', () => {
    expect(new ReferenciaDePago('PAGOS360', 'abc').igualA(new ReferenciaDePago('INFORME_SYSADMIN', 'abc'))).toBe(false)
  })

  test('otra referencia en el mismo proveedor no es igual', () => {
    expect(new ReferenciaDePago('PAGOS360', 'abc').igualA(new ReferenciaDePago('PAGOS360', 'abd'))).toBe(false)
  })

  test('rechaza una referencia externa vacía', () => {
    expect(() => new ReferenciaDePago('PAGOS360', '')).toThrow()
    expect(() => new ReferenciaDePago('PAGOS360', '   ')).toThrow()
  })
})
