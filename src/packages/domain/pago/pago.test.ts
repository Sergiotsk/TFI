import { describe, expect, test } from 'vitest'
import { Dni } from '../perfil/dni'
import { NumeroDePostulacion } from '../postulacion/numero-de-postulacion'
import { Monto } from './monto'
import { Pago } from './pago'
import { ReferenciaDePago } from './referencia-de-pago'

const referencia = new ReferenciaDePago('INFORME_SYSADMIN', 'REC-1')
const monto = new Monto(1500000)
const pagadoEl = new Date('2027-02-03T10:00:00Z')
const registradoEl = new Date('2027-02-04T20:00:00Z')

describe('Pago', () => {
  test('ACREDITADO guarda postulación, carga y datos informados', () => {
    const pago = new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'ACREDITADO', {
      postulacionId: 'p-1',
      cargaId: 'c-1',
      dniInformado: new Dni('12345678'),
      numeroInformado: new NumeroDePostulacion(3),
    })

    expect(pago.estado).toBe('ACREDITADO')
    expect(pago.postulacionId).toBe('p-1')
    expect(pago.cargaId).toBe('c-1')
    expect(pago.dniInformado?.valor).toBe('12345678')
    expect(pago.numeroInformado?.valor).toBe(3)
    expect(pago.referencia).toBe(referencia)
    expect(pago.monto).toBe(monto)
  })

  test('A_DECIDIR exige postulación y motivo de revisión', () => {
    expect(() => new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'A_DECIDIR', { postulacionId: 'p-1' })).toThrow()
    expect(() => new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'A_DECIDIR', { motivoRevision: 'SIN_CUPO' })).toThrow()
    expect(
      new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'A_DECIDIR', {
        postulacionId: 'p-1',
        motivoRevision: 'SIN_CUPO',
      }).motivoRevision,
    ).toBe('SIN_CUPO')
  })

  test('NO_IMPUTADO exige motivo y no requiere postulación', () => {
    expect(() => new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'NO_IMPUTADO')).toThrow()
    expect(
      new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'NO_IMPUTADO', { motivoNoImputado: 'AMBIGUA' })
        .motivoNoImputado,
    ).toBe('AMBIGUA')
  })

  test('rechaza un monto de 0 centavos (CHECK monto_centavos > 0)', () => {
    const noImputado = { motivoNoImputado: 'AMBIGUA' } as const
    expect(() => new Pago('pg-1', referencia, new Monto(0), pagadoEl, registradoEl, 'NO_IMPUTADO', noImputado)).toThrow()
    expect(new Pago('pg-1', referencia, new Monto(1), pagadoEl, registradoEl, 'NO_IMPUTADO', noImputado).monto.centavos).toBe(1)
  })

  test('ACREDITADO y DEVUELTO exigen postulación', () => {
    expect(() => new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'ACREDITADO')).toThrow()
    expect(() => new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'DEVUELTO')).toThrow()
  })

  test('los motivos solo se admiten en su estado', () => {
    expect(
      () =>
        new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'ACREDITADO', {
          postulacionId: 'p-1',
          motivoRevision: 'SIN_CUPO',
        }),
    ).toThrow()
    expect(
      () =>
        new Pago('pg-1', referencia, monto, pagadoEl, registradoEl, 'ACREDITADO', {
          postulacionId: 'p-1',
          motivoNoImputado: 'AMBIGUA',
        }),
    ).toThrow()
  })
})
