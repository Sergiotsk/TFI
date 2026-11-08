import { describe, expect, test } from 'vitest'
import { Dni } from '../perfil/dni'
import { Monto } from '../pago/monto'
import type { PagoInformado } from '../pago/pago'
import { ReferenciaDePago } from '../pago/referencia-de-pago'
import { PeriodoDeIngreso } from '../periodo/periodo-de-ingreso'
import { type Candidata, evaluarPago } from './evaluar-pago'
import type { EstadoDePostulacion } from './estados'
import { NumeroDePostulacion } from './numero-de-postulacion'
import { Postulacion } from './postulacion'

const DIA = 24 * 60 * 60 * 1000
const VENCE = new Date('2027-02-06T10:00:00Z')
const EN_PLAZO = new Date(VENCE.getTime() - DIA)
const TARDE = new Date(VENCE.getTime() + DIA)
const MATRICULA = new Monto(1500000)
const DNI = new Dni('12345678')

function periodo(totalCupos = 50) {
  return new PeriodoDeIngreso('per-1', 'inst-1', 'Ingreso 2027', totalCupos, new Date('2027-03-01T00:00:00Z'), 5, MATRICULA)
}

function postulacion(estado: EstadoDePostulacion, id = 'p-1') {
  const venceEl = estado === 'PREINSCRIPTO' ? null : VENCE
  const motivo = estado === 'PAGO_EN_REVISION' ? 'SIN_CUPO' : null
  return new Postulacion(
    id,
    new NumeroDePostulacion(1),
    'asp-1',
    'per-1',
    estado,
    venceEl,
    motivo,
    new Date(0),
    new Date(0),
  )
}

function candidata(estado: EstadoDePostulacion, id = 'p-1'): Candidata {
  return { postulacion: postulacion(estado, id), dniDelAspirante: DNI }
}

function pago(sobrescribir: Partial<PagoInformado> = {}): PagoInformado {
  return {
    referencia: new ReferenciaDePago('INFORME_SYSADMIN', 'REC-1'),
    monto: MATRICULA,
    pagadoEl: EN_PLAZO,
    ...sobrescribir,
  }
}

describe('evaluarPago', () => {
  describe('regla 1: candidata', () => {
    test('sin candidata: NO_IMPUTAR REFERENCIA_DESCONOCIDA, sin postulación', () => {
      expect(evaluarPago(pago(), { via: 'NUMERO', candidatas: [] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'REFERENCIA_DESCONOCIDA',
      })
    })

    test('sin candidata por DNI: NO_IMPUTAR REFERENCIA_DESCONOCIDA', () => {
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'REFERENCIA_DESCONOCIDA',
      })
    })

    test('más de una candidata: NO_IMPUTAR AMBIGUA', () => {
      const candidatas = [candidata('PAGO_PENDIENTE', 'p-1'), candidata('VENCIDO', 'p-2')]

      expect(evaluarPago(pago(), { via: 'DNI', candidatas }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'AMBIGUA',
      })
    })

    test('la regla 1 gana aunque el monto también sea insuficiente', () => {
      const decision = evaluarPago(pago({ monto: new Monto(1) }), { via: 'DNI', candidatas: [] }, periodo(), 0)

      expect(decision).toMatchObject({ tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' })
    })
  })

  describe('regla 2: DNI cuando vino por número', () => {
    test('el DNI informado no coincide con el del aspirante: DNI_NO_COINCIDE', () => {
      const informado = pago({ dni: new Dni('87654321') })

      expect(evaluarPago(informado, { via: 'NUMERO', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'DNI_NO_COINCIDE',
      })
    })

    test('si el DNI informado coincide, sigue con las demás reglas', () => {
      const informado = pago({ dni: new Dni('12345678') })

      expect(
        evaluarPago(informado, { via: 'NUMERO', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('si no se informó DNI, no hay nada que contrastar', () => {
      expect(
        evaluarPago(pago(), { via: 'NUMERO', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('vía DNI no se vuelve a contrastar (la candidata ya salió de ese DNI)', () => {
      const informado = pago({ dni: new Dni('87654321') })

      expect(
        evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('la regla 2 gana sobre el monto insuficiente', () => {
      const informado = pago({ dni: new Dni('87654321'), monto: new Monto(1) })

      expect(
        evaluarPago(informado, { via: 'NUMERO', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0),
      ).toMatchObject({ motivo: 'DNI_NO_COINCIDE' })
    })
  })

  describe('regla 3: monto', () => {
    test('monto menor a la matrícula: NO_IMPUTAR MONTO_INSUFICIENTE, con la postulación', () => {
      const informado = pago({ monto: new Monto(MATRICULA.centavos - 1) })

      expect(evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'MONTO_INSUFICIENTE',
        postulacionId: 'p-1',
      })
    })

    test('monto igual a la matrícula alcanza', () => {
      expect(
        evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('monto mayor a la matrícula alcanza', () => {
      const informado = pago({ monto: new Monto(MATRICULA.centavos * 2) })

      expect(
        evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('la regla 3 gana sobre YA_TIENE_PAGO', () => {
      const informado = pago({ monto: new Monto(1) })

      expect(
        evaluarPago(informado, { via: 'DNI', candidatas: [candidata('VACANTE_CONFIRMADA')] }, periodo(), 0),
      ).toMatchObject({ motivo: 'MONTO_INSUFICIENTE' })
    })
  })

  describe('regla 4: ya tiene pago', () => {
    test.each<EstadoDePostulacion>([
      'VACANTE_CONFIRMADA',
      'ESPERANDO_DOCUMENTACION',
      'DOCUMENTACION_EN_REVISION',
      'OBSERVADO',
      'DOCUMENTACION_VALIDADA',
      'CONFIRMADO_PARA_EXPORTAR',
      'PAGO_EN_REVISION',
    ])('%s: NO_IMPUTAR YA_TIENE_PAGO (pago doble)', (estado) => {
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [candidata(estado)] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'YA_TIENE_PAGO',
        postulacionId: 'p-1',
      })
    })

    test('la regla 4 gana sobre SIN_PAGO_INICIADO y sobre el cupo', () => {
      expect(
        evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('VACANTE_CONFIRMADA')] }, periodo(10), 10),
      ).toMatchObject({ motivo: 'YA_TIENE_PAGO' })
    })
  })

  describe('regla 5: sin pago iniciado', () => {
    test('PREINSCRIPTO: NO_IMPUTAR SIN_PAGO_INICIADO', () => {
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('PREINSCRIPTO')] }, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'SIN_PAGO_INICIADO',
        postulacionId: 'p-1',
      })
    })

    test('VENCIDO sin venceEl (migrado de RECHAZADO, research R8): NO_IMPUTAR SIN_PAGO_INICIADO', () => {
      const legacy = new Postulacion(
        'p-1',
        new NumeroDePostulacion(1),
        'asp-1',
        'per-1',
        'VENCIDO',
        null,
        null,
        new Date(0),
        new Date(0),
      )
      const imputacion = { via: 'DNI' as const, candidatas: [{ postulacion: legacy, dniDelAspirante: DNI }] }
      expect(evaluarPago(pago(), imputacion, periodo(), 0)).toEqual({
        tipo: 'NO_IMPUTAR',
        motivo: 'SIN_PAGO_INICIADO',
        postulacionId: 'p-1',
      })
    })
  })

  describe('regla 6: fuera de plazo', () => {
    test('pagadoEl > venceEl: REVISION FUERA_DE_PLAZO con el estado persistido', () => {
      const informado = pago({ pagadoEl: TARDE })

      expect(evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0)).toEqual({
        tipo: 'REVISION',
        postulacionId: 'p-1',
        estadoEsperado: 'PAGO_PENDIENTE',
        motivo: 'FUERA_DE_PLAZO',
      })
    })

    test('desde VENCIDO persistido, estadoEsperado es VENCIDO', () => {
      const informado = pago({ pagadoEl: TARDE })

      expect(evaluarPago(informado, { via: 'DNI', candidatas: [candidata('VENCIDO')] }, periodo(), 0)).toEqual({
        tipo: 'REVISION',
        postulacionId: 'p-1',
        estadoEsperado: 'VENCIDO',
        motivo: 'FUERA_DE_PLAZO',
      })
    })

    test('pagadoEl justo en venceEl es en plazo', () => {
      const informado = pago({ pagadoEl: VENCE })

      expect(
        evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0).tipo,
      ).toBe('CONFIRMAR')
    })

    test('tardío y sin cupo: se registra FUERA_DE_PLAZO (la 6 va antes que la 7)', () => {
      const informado = pago({ pagadoEl: TARDE })

      expect(
        evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(10), 10),
      ).toMatchObject({ tipo: 'REVISION', motivo: 'FUERA_DE_PLAZO' })
    })
  })

  describe('regla 7: sin cupo', () => {
    test('ocupados >= totalCupos: REVISION SIN_CUPO', () => {
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(10), 10)).toEqual({
        tipo: 'REVISION',
        postulacionId: 'p-1',
        estadoEsperado: 'PAGO_PENDIENTE',
        motivo: 'SIN_CUPO',
      })
    })

    test('ocupados por encima del total (aceptaciones de Dirección) también es sin cupo', () => {
      expect(
        evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(10), 12),
      ).toMatchObject({ tipo: 'REVISION', motivo: 'SIN_CUPO' })
    })

    test('postulación VENCIDA con pago en plazo y sin cupo: REVISION SIN_CUPO con estadoEsperado VENCIDO', () => {
      // La máquina de estados solo admite VENCIDO → revisión por FUERA_DE_PLAZO. Esta regla es de la tabla de
      // data-model.md y se cumple tal cual; el caso queda documentado acá para que la capa de arriba lo vea.
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('VENCIDO')] }, periodo(10), 10)).toEqual({
        tipo: 'REVISION',
        postulacionId: 'p-1',
        estadoEsperado: 'VENCIDO',
        motivo: 'SIN_CUPO',
      })
    })
  })

  describe('regla 8: confirmar', () => {
    test('en plazo y con cupo: CONFIRMAR con estadoEsperado PAGO_PENDIENTE', () => {
      expect(evaluarPago(pago(), { via: 'NUMERO', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(10), 9)).toEqual({
        tipo: 'CONFIRMAR',
        postulacionId: 'p-1',
        estadoEsperado: 'PAGO_PENDIENTE',
      })
    })

    test('pagó a tiempo pero se informó después del vencimiento: CONFIRMAR con estadoEsperado persistido PAGO_PENDIENTE', () => {
      // El estado efectivo ya sería VENCIDO, pero lo que cuenta es pagadoEl contra venceEl.
      const informado = pago({ pagadoEl: EN_PLAZO })

      expect(evaluarPago(informado, { via: 'DNI', candidatas: [candidata('PAGO_PENDIENTE')] }, periodo(), 0)).toEqual({
        tipo: 'CONFIRMAR',
        postulacionId: 'p-1',
        estadoEsperado: 'PAGO_PENDIENTE',
      })
    })

    test('pagó a tiempo y la postulación quedó persistida como VENCIDO: CONFIRMAR con estadoEsperado VENCIDO', () => {
      expect(evaluarPago(pago(), { via: 'DNI', candidatas: [candidata('VENCIDO')] }, periodo(), 0)).toEqual({
        tipo: 'CONFIRMAR',
        postulacionId: 'p-1',
        estadoEsperado: 'VENCIDO',
      })
    })
  })
})
