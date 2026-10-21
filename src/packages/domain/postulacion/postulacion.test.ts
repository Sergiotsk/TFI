import { describe, expect, test } from 'vitest'
import { Monto } from '../pago/monto'
import { PeriodoDeIngreso } from '../periodo/periodo-de-ingreso'
import { PeriodoCerrado, SinCuposParaIniciar, TransicionInvalida } from './errores'
import { ESTADOS_DE_POSTULACION, ESTADOS_QUE_OCUPAN_CUPO, type EstadoDePostulacion } from './estados'
import { NumeroDePostulacion } from './numero-de-postulacion'
import { Postulacion } from './postulacion'

const DIA = 24 * 60 * 60 * 1000
const AHORA = new Date('2027-02-01T10:00:00Z')
const CIERRE = new Date('2027-03-01T00:00:00Z')
const VENCE = new Date(AHORA.getTime() + 5 * DIA)

function periodo(totalCupos = 50) {
  return new PeriodoDeIngreso('per-1', 'inst-1', 'Ingreso 2027', totalCupos, CIERRE, 5, new Monto(1500000))
}

function desde(estado: EstadoDePostulacion, venceEl?: Date, motivoRevision?: 'SIN_CUPO' | 'FUERA_DE_PLAZO') {
  return new Postulacion('p-1', new NumeroDePostulacion(1), 'asp-1', 'per-1', estado, venceEl, motivoRevision)
}

// Estados que se pueden reconstruir con su vencimiento (todos menos PREINSCRIPTO).
function conVencimiento(estado: EstadoDePostulacion) {
  return desde(estado, estado === 'PREINSCRIPTO' ? undefined : VENCE, estado === 'PAGO_EN_REVISION' ? 'SIN_CUPO' : undefined)
}

const pendiente = () => desde('PAGO_PENDIENTE', VENCE)
const vencida = () => desde('VENCIDO', VENCE)
const enRevision = () => desde('PAGO_EN_REVISION', VENCE, 'SIN_CUPO')

describe('Postulacion', () => {
  describe('crear', () => {
    test('nace PREINSCRIPTO, sin vencimiento ni motivo', () => {
      const p = Postulacion.crear('p-1', new NumeroDePostulacion(7), 'asp-1', 'per-1')

      expect(p.id).toBe('p-1')
      expect(p.numero.valor).toBe(7)
      expect(p.aspiranteId).toBe('asp-1')
      expect(p.periodoId).toBe('per-1')
      expect(p.estado).toBe('PREINSCRIPTO')
      expect(p.venceEl).toBeUndefined()
      expect(p.motivoRevision).toBeUndefined()
    })
  })

  describe('invariantes al reconstruir', () => {
    test('PAGO_PENDIENTE exige venceEl', () => {
      expect(() => desde('PAGO_PENDIENTE')).toThrow()
    })

    test('PAGO_EN_REVISION exige motivoRevision', () => {
      expect(() => desde('PAGO_EN_REVISION', VENCE)).toThrow()
    })

    test('motivoRevision solo se admite en PAGO_EN_REVISION', () => {
      expect(() => desde('PAGO_PENDIENTE', VENCE, 'SIN_CUPO')).toThrow()
    })
  })

  describe('estadoEn (vencimiento perezoso)', () => {
    test('PAGO_PENDIENTE dentro del plazo sigue PAGO_PENDIENTE', () => {
      expect(pendiente().estadoEn(new Date(VENCE.getTime() - 1))).toBe('PAGO_PENDIENTE')
    })

    test('PAGO_PENDIENTE justo en venceEl todavía no venció (vence cuando ahora > venceEl)', () => {
      expect(pendiente().estadoEn(new Date(VENCE))).toBe('PAGO_PENDIENTE')
    })

    test('PAGO_PENDIENTE pasado venceEl se ve VENCIDO', () => {
      expect(pendiente().estadoEn(new Date(VENCE.getTime() + 1))).toBe('VENCIDO')
    })

    test('no modifica el estado persistido', () => {
      const p = pendiente()
      p.estadoEn(new Date(VENCE.getTime() + 1))

      expect(p.estado).toBe('PAGO_PENDIENTE')
    })

    test('PAGO_EN_REVISION no vence nunca (FR-013)', () => {
      expect(enRevision().estadoEn(new Date(VENCE.getTime() + 365 * DIA))).toBe('PAGO_EN_REVISION')
    })

    test.each(ESTADOS_DE_POSTULACION.filter((e) => e !== 'PAGO_PENDIENTE' && e !== 'PAGO_EN_REVISION'))(
      '%s no cambia con el tiempo',
      (estado) => {
        expect(conVencimiento(estado).estadoEn(new Date(VENCE.getTime() + 365 * DIA))).toBe(estado)
      },
    )
  })

  describe('registrarVencimiento', () => {
    test('persiste VENCIDO cuando el plazo ya pasó, conservando venceEl', () => {
      const p = pendiente().registrarVencimiento(new Date(VENCE.getTime() + 1))

      expect(p.estado).toBe('VENCIDO')
      expect(p.venceEl).toEqual(VENCE)
    })

    test('rechaza si el plazo todavía no pasó', () => {
      expect(() => pendiente().registrarVencimiento(new Date(VENCE))).toThrow(TransicionInvalida)
    })

    test('rechaza desde cualquier estado que no sea PAGO_PENDIENTE', () => {
      expect(() => vencida().registrarVencimiento(new Date(VENCE.getTime() + 1))).toThrow(TransicionInvalida)
      expect(() => enRevision().registrarVencimiento(new Date(VENCE.getTime() + 1))).toThrow(TransicionInvalida)
    })
  })

  describe('iniciarPago', () => {
    test('PREINSCRIPTO pasa a PAGO_PENDIENTE con vencimiento = min(ahora + plazo, cierre)', () => {
      const p = desde('PREINSCRIPTO').iniciarPago(periodo(), 0, AHORA)

      expect(p.estado).toBe('PAGO_PENDIENTE')
      expect(p.venceEl).toEqual(new Date(AHORA.getTime() + 5 * DIA))
    })

    test('el vencimiento se topa en el cierre del período', () => {
      const ahora = new Date('2027-02-27T00:00:00Z')

      expect(desde('PREINSCRIPTO').iniciarPago(periodo(), 0, ahora).venceEl).toEqual(CIERRE)
    })

    test('devuelve una Postulación nueva y no modifica la original', () => {
      const original = desde('PREINSCRIPTO')
      const nueva = original.iniciarPago(periodo(), 0, AHORA)

      expect(nueva).not.toBe(original)
      expect(original.estado).toBe('PREINSCRIPTO')
    })

    test('VENCIDO (persistido) reintenta con plazo nuevo', () => {
      const ahora = new Date(VENCE.getTime() + DIA)
      const p = vencida().iniciarPago(periodo(), 0, ahora)

      expect(p.estado).toBe('PAGO_PENDIENTE')
      expect(p.venceEl).toEqual(new Date(ahora.getTime() + 5 * DIA))
    })

    test('PAGO_PENDIENTE vencido de forma perezosa también puede reintentar', () => {
      const ahora = new Date(VENCE.getTime() + DIA)
      const p = pendiente().iniciarPago(periodo(), 0, ahora)

      expect(p.estado).toBe('PAGO_PENDIENTE')
      expect(p.venceEl).toEqual(new Date(ahora.getTime() + 5 * DIA))
    })

    test('PAGO_PENDIENTE vigente no puede volver a iniciar', () => {
      expect(() => pendiente().iniciarPago(periodo(), 0, AHORA)).toThrow(TransicionInvalida)
    })

    test('PAGO_EN_REVISION no puede iniciar un pago nuevo', () => {
      expect(() => enRevision().iniciarPago(periodo(), 0, AHORA)).toThrow(TransicionInvalida)
    })

    test('una vacante confirmada o posterior no puede iniciar pago', () => {
      for (const estado of ESTADOS_QUE_OCUPAN_CUPO) {
        expect(() => conVencimiento(estado).iniciarPago(periodo(), 0, AHORA)).toThrow(TransicionInvalida)
      }
    })

    test('período cerrado: PeriodoCerrado (FR-011)', () => {
      const tarde = new Date(CIERRE.getTime() + 1)

      expect(() => desde('PREINSCRIPTO').iniciarPago(periodo(), 0, tarde)).toThrow(PeriodoCerrado)
    })

    test('sin cupos libres (ocupados >= total): SinCuposParaIniciar (FR-011)', () => {
      expect(() => desde('PREINSCRIPTO').iniciarPago(periodo(50), 50, AHORA)).toThrow(SinCuposParaIniciar)
      expect(() => desde('PREINSCRIPTO').iniciarPago(periodo(50), 51, AHORA)).toThrow(SinCuposParaIniciar)
    })

    test('con un cupo libre sí puede iniciar', () => {
      expect(desde('PREINSCRIPTO').iniciarPago(periodo(50), 49, AHORA).estado).toBe('PAGO_PENDIENTE')
    })
  })

  describe('confirmar', () => {
    test('PAGO_PENDIENTE con pago en plazo pasa a VACANTE_CONFIRMADA', () => {
      expect(pendiente().confirmar(new Date(VENCE.getTime() - DIA)).estado).toBe('VACANTE_CONFIRMADA')
    })

    test('conserva venceEl para auditoría', () => {
      expect(pendiente().confirmar(AHORA).venceEl).toEqual(VENCE)
    })

    test('pago justo en venceEl es en plazo (pagadoEl <= venceEl)', () => {
      expect(pendiente().confirmar(new Date(VENCE)).estado).toBe('VACANTE_CONFIRMADA')
    })

    test('PAGO_PENDIENTE con pago fuera de plazo no confirma', () => {
      expect(() => pendiente().confirmar(new Date(VENCE.getTime() + 1))).toThrow(TransicionInvalida)
    })

    test('VENCIDO con pagadoEl <= venceEl confirma (pagó a tiempo, se informó tarde)', () => {
      expect(vencida().confirmar(new Date(VENCE.getTime() - 1)).estado).toBe('VACANTE_CONFIRMADA')
      expect(vencida().confirmar(new Date(VENCE)).estado).toBe('VACANTE_CONFIRMADA')
    })

    test('VENCIDO con pagadoEl > venceEl no confirma', () => {
      expect(() => vencida().confirmar(new Date(VENCE.getTime() + 1))).toThrow(TransicionInvalida)
    })

    test('desde PREINSCRIPTO no confirma (nunca inició el pago)', () => {
      expect(() => desde('PREINSCRIPTO').confirmar(AHORA)).toThrow(TransicionInvalida)
    })

    test('desde PAGO_EN_REVISION no confirma: solo Dirección con aceptarExcepcion', () => {
      expect(() => enRevision().confirmar(AHORA)).toThrow(TransicionInvalida)
    })

    test('desde una vacante ya confirmada o posterior no confirma de nuevo', () => {
      for (const estado of ESTADOS_QUE_OCUPAN_CUPO) {
        expect(() => conVencimiento(estado).confirmar(AHORA)).toThrow(TransicionInvalida)
      }
    })
  })

  describe('pasarARevision', () => {
    test('PAGO_PENDIENTE con SIN_CUPO pasa a PAGO_EN_REVISION con el motivo', () => {
      const p = pendiente().pasarARevision('SIN_CUPO')

      expect(p.estado).toBe('PAGO_EN_REVISION')
      expect(p.motivoRevision).toBe('SIN_CUPO')
      expect(p.venceEl).toEqual(VENCE)
    })

    test('PAGO_PENDIENTE con FUERA_DE_PLAZO pasa a PAGO_EN_REVISION', () => {
      expect(pendiente().pasarARevision('FUERA_DE_PLAZO').motivoRevision).toBe('FUERA_DE_PLAZO')
    })

    test('VENCIDO con FUERA_DE_PLAZO pasa a PAGO_EN_REVISION', () => {
      const p = vencida().pasarARevision('FUERA_DE_PLAZO')

      expect(p.estado).toBe('PAGO_EN_REVISION')
      expect(p.motivoRevision).toBe('FUERA_DE_PLAZO')
    })

    test('VENCIDO con SIN_CUPO no es una transición válida', () => {
      expect(() => vencida().pasarARevision('SIN_CUPO')).toThrow(TransicionInvalida)
    })

    test('desde PREINSCRIPTO, PAGO_EN_REVISION o vacantes no es válida', () => {
      expect(() => desde('PREINSCRIPTO').pasarARevision('SIN_CUPO')).toThrow(TransicionInvalida)
      expect(() => enRevision().pasarARevision('FUERA_DE_PLAZO')).toThrow(TransicionInvalida)
      for (const estado of ESTADOS_QUE_OCUPAN_CUPO) {
        expect(() => conVencimiento(estado).pasarARevision('FUERA_DE_PLAZO')).toThrow(TransicionInvalida)
      }
    })
  })

  describe('aceptarExcepcion', () => {
    test('PAGO_EN_REVISION pasa a VACANTE_CONFIRMADA y limpia el motivo', () => {
      const p = enRevision().aceptarExcepcion()

      expect(p.estado).toBe('VACANTE_CONFIRMADA')
      expect(p.motivoRevision).toBeUndefined()
    })

    test('desde cualquier otro estado es inválida', () => {
      for (const estado of ESTADOS_DE_POSTULACION.filter((e) => e !== 'PAGO_EN_REVISION')) {
        expect(() => conVencimiento(estado).aceptarExcepcion()).toThrow(TransicionInvalida)
      }
    })
  })

  describe('rechazarExcepcion', () => {
    test('PAGO_EN_REVISION pasa a VENCIDO y limpia el motivo', () => {
      const p = enRevision().rechazarExcepcion()

      expect(p.estado).toBe('VENCIDO')
      expect(p.motivoRevision).toBeUndefined()
    })

    test('quedar VENCIDO permite reintentar con iniciarPago', () => {
      const ahora = new Date(VENCE.getTime() + DIA)

      expect(enRevision().rechazarExcepcion().iniciarPago(periodo(), 0, ahora).estado).toBe('PAGO_PENDIENTE')
    })

    test('desde cualquier otro estado es inválida', () => {
      for (const estado of ESTADOS_DE_POSTULACION.filter((e) => e !== 'PAGO_EN_REVISION')) {
        expect(() => conVencimiento(estado).rechazarExcepcion()).toThrow(TransicionInvalida)
      }
    })
  })

  describe('ocupaCupo', () => {
    test('cuentan VACANTE_CONFIRMADA y todos los posteriores', () => {
      for (const estado of ESTADOS_QUE_OCUPAN_CUPO) {
        expect(conVencimiento(estado).ocupaCupo).toBe(true)
      }
    })

    test('no cuentan PREINSCRIPTO, PAGO_PENDIENTE, PAGO_EN_REVISION ni VENCIDO', () => {
      expect(desde('PREINSCRIPTO').ocupaCupo).toBe(false)
      expect(pendiente().ocupaCupo).toBe(false)
      expect(enRevision().ocupaCupo).toBe(false)
      expect(vencida().ocupaCupo).toBe(false)
    })
  })
})
