import { describe, expect, it } from 'vitest'
import { TransicionInvalida } from './errores'
import type { EstadoPostulacion } from './estados'
import type { MotivoRevision } from './motivoRevision'
import { NumeroDePostulacion } from './numero-de-postulacion'
import { Postulacion } from './postulacion'

const CREADA_EL = new Date('2026-10-20T12:00:00.000Z')
const VENCE_EL = new Date('2026-11-01T12:00:00.000Z')
const DENTRO_DEL_PLAZO = new Date('2026-10-25T12:00:00.000Z')
const VENCIDA = new Date('2026-11-02T12:00:00.000Z')
const NUEVO_VENCE_EL = new Date('2026-11-05T12:00:00.000Z')

function crear(
  estado: EstadoPostulacion,
  opciones: { venceEl?: Date | null; motivoRevision?: MotivoRevision | null } = {},
): Postulacion {
  const venceEl =
    opciones.venceEl !== undefined
      ? opciones.venceEl
      : estado === 'PAGO_PENDIENTE'
        ? VENCE_EL
        : null
  const motivoRevision =
    opciones.motivoRevision !== undefined
      ? opciones.motivoRevision
      : estado === 'PAGO_EN_REVISION'
        ? 'SIN_CUPO'
        : null

  return new Postulacion(
    'postulacion-1',
    NumeroDePostulacion.desde(42),
    'aspirante-1',
    'periodo-1',
    estado,
    venceEl,
    motivoRevision,
    CREADA_EL,
    CREADA_EL,
  )
}

describe('Postulacion.estadoEn', () => {
  it('devuelve el estado persistido mientras no venció', () => {
    expect(crear('PAGO_PENDIENTE').estadoEn(DENTRO_DEL_PLAZO)).toBe('PAGO_PENDIENTE')
  })

  it('deriva VENCIDO cuando el plazo pasó', () => {
    expect(crear('PAGO_PENDIENTE').estadoEn(VENCIDA)).toBe('VENCIDO')
  })

  it('no considera vencida la Postulación justo en el instante del vencimiento', () => {
    expect(crear('PAGO_PENDIENTE').estadoEn(VENCE_EL)).toBe('PAGO_PENDIENTE')
  })

  it('PAGO_EN_REVISION no vence (FR-013)', () => {
    const enRevision = crear('PAGO_EN_REVISION', { venceEl: VENCE_EL })

    expect(enRevision.estadoEn(new Date('2027-01-01T00:00:00.000Z'))).toBe('PAGO_EN_REVISION')
  })
})

describe('Postulacion: transiciones válidas', () => {
  it('PREINSCRIPTO inicia el pago', () => {
    const actualizada = crear('PREINSCRIPTO').iniciarPago(VENCE_EL, CREADA_EL)

    expect(actualizada.estado).toBe('PAGO_PENDIENTE')
    expect(actualizada.venceEl).toEqual(VENCE_EL)
  })

  it('PAGO_PENDIENTE confirma la vacante y conserva el vencimiento para auditoría', () => {
    const actualizada = crear('PAGO_PENDIENTE').confirmar(DENTRO_DEL_PLAZO)

    expect(actualizada.estado).toBe('VACANTE_CONFIRMADA')
    expect(actualizada.venceEl).toEqual(VENCE_EL)
  })

  it('VENCIDO confirma si el pago fue dentro del plazo', () => {
    const actualizada = crear('VENCIDO', { venceEl: VENCE_EL }).confirmar(VENCIDA)

    expect(actualizada.estado).toBe('VACANTE_CONFIRMADA')
  })

  it('VENCIDO reintenta el pago con un plazo nuevo', () => {
    const actualizada = crear('VENCIDO', { venceEl: VENCE_EL }).iniciarPago(
      NUEVO_VENCE_EL,
      VENCIDA,
    )

    expect(actualizada.estado).toBe('PAGO_PENDIENTE')
    expect(actualizada.venceEl).toEqual(NUEVO_VENCE_EL)
  })

  it('PAGO_PENDIENTE ya vencido permite reintentar (el estado efectivo es VENCIDO)', () => {
    const actualizada = crear('PAGO_PENDIENTE').iniciarPago(NUEVO_VENCE_EL, VENCIDA)

    expect(actualizada.estado).toBe('PAGO_PENDIENTE')
    expect(actualizada.venceEl).toEqual(NUEVO_VENCE_EL)
  })

  it('PAGO_PENDIENTE pasa a revisión por falta de cupo', () => {
    const actualizada = crear('PAGO_PENDIENTE').pasarARevision('SIN_CUPO', DENTRO_DEL_PLAZO)

    expect(actualizada.estado).toBe('PAGO_EN_REVISION')
    expect(actualizada.motivoRevision).toBe('SIN_CUPO')
  })

  it('PAGO_PENDIENTE pasa a revisión por estar fuera de plazo', () => {
    const actualizada = crear('PAGO_PENDIENTE').pasarARevision('FUERA_DE_PLAZO', VENCIDA)

    expect(actualizada.estado).toBe('PAGO_EN_REVISION')
    expect(actualizada.motivoRevision).toBe('FUERA_DE_PLAZO')
  })

  it('Dirección acepta la excepción y confirma la vacante', () => {
    const actualizada = crear('PAGO_EN_REVISION').aceptarExcepcion(VENCIDA)

    expect(actualizada.estado).toBe('VACANTE_CONFIRMADA')
    expect(actualizada.motivoRevision).toBeNull()
  })

  it('Dirección rechaza la excepción y la Postulación vuelve a VENCIDO', () => {
    const actualizada = crear('PAGO_EN_REVISION', { venceEl: VENCE_EL }).rechazarExcepcion(VENCIDA)

    expect(actualizada.estado).toBe('VENCIDO')
    expect(actualizada.motivoRevision).toBeNull()
  })

  it('vencer() persiste el VENCIDO cuando el plazo ya pasó', () => {
    const vencida = crear('PAGO_PENDIENTE').vencer(VENCIDA)

    expect(vencida.estado).toBe('VENCIDO')
    expect(vencida.venceEl).toEqual(VENCE_EL)
  })

  it('vencer() no deja vencer una Postulación que todavía está en plazo', () => {
    expect(() => crear('PAGO_PENDIENTE').vencer(DENTRO_DEL_PLAZO)).toThrow(TransicionInvalida)
  })

  it('vencer() no deja vencer una Postulación que no está pendiente de pago', () => {
    expect(() => crear('PAGO_EN_REVISION').vencer(VENCIDA)).toThrow(TransicionInvalida)
  })
})

describe('Postulacion.prorrogar', () => {
  it('extiende el plazo de una PAGO_PENDIENTE vigente', () => {
    const prorrogada = crear('PAGO_PENDIENTE').prorrogar(NUEVO_VENCE_EL, DENTRO_DEL_PLAZO)

    expect(prorrogada.estado).toBe('PAGO_PENDIENTE')
    expect(prorrogada.venceEl).toEqual(NUEVO_VENCE_EL)
  })

  it('reactiva una VENCIDO con un plazo nuevo', () => {
    const reactivada = crear('VENCIDO').prorrogar(NUEVO_VENCE_EL, VENCIDA)

    expect(reactivada.estado).toBe('PAGO_PENDIENTE')
    expect(reactivada.venceEl).toEqual(NUEVO_VENCE_EL)
  })

  it('también reactiva una PAGO_PENDIENTE que ya venció', () => {
    const reactivada = crear('PAGO_PENDIENTE').prorrogar(NUEVO_VENCE_EL, VENCIDA)

    expect(reactivada.estado).toBe('PAGO_PENDIENTE')
    expect(reactivada.venceEl).toEqual(NUEVO_VENCE_EL)
  })

  it('no prorroga una Postulación que no está pendiente de pago o vencida', () => {
    for (const estado of [
      'PREINSCRIPTO',
      'PAGO_EN_REVISION',
      'VACANTE_CONFIRMADA',
      'CONFIRMADO_PARA_EXPORTAR',
    ] as const) {
      expect(() => crear(estado).prorrogar(NUEVO_VENCE_EL, DENTRO_DEL_PLAZO)).toThrow(
        TransicionInvalida,
      )
    }
  })
})

const TRANSICIONES_INVALIDAS: ReadonlyArray<{
  estado: EstadoPostulacion
  intento: string
  transicion: (postulacion: Postulacion) => Postulacion
}> = [
  { estado: 'PREINSCRIPTO', intento: 'confirmar', transicion: (p) => p.confirmar(CREADA_EL) },
  {
    estado: 'PREINSCRIPTO',
    intento: 'pasar a revisión',
    transicion: (p) => p.pasarARevision('SIN_CUPO', CREADA_EL),
  },
  {
    estado: 'PREINSCRIPTO',
    intento: 'aceptar una excepción',
    transicion: (p) => p.aceptarExcepcion(CREADA_EL),
  },
  {
    estado: 'PAGO_PENDIENTE',
    intento: 'aceptar una excepción',
    transicion: (p) => p.aceptarExcepcion(DENTRO_DEL_PLAZO),
  },
  {
    estado: 'VACANTE_CONFIRMADA',
    intento: 'iniciar el pago',
    transicion: (p) => p.iniciarPago(VENCE_EL, VENCIDA),
  },
  {
    estado: 'VACANTE_CONFIRMADA',
    intento: 'pasar a revisión',
    transicion: (p) => p.pasarARevision('SIN_CUPO', VENCIDA),
  },
  {
    estado: 'PAGO_EN_REVISION',
    intento: 'iniciar el pago',
    transicion: (p) => p.iniciarPago(VENCE_EL, VENCIDA),
  },
  {
    estado: 'PAGO_EN_REVISION',
    intento: 'confirmar sin decisión de Dirección',
    transicion: (p) => p.confirmar(VENCIDA),
  },
  {
    estado: 'CONFIRMADO_PARA_EXPORTAR',
    intento: 'iniciar el pago',
    transicion: (p) => p.iniciarPago(VENCE_EL, VENCIDA),
  },
]

describe('Postulacion: transiciones inválidas', () => {
  for (const caso of TRANSICIONES_INVALIDAS) {
    it(`desde ${caso.estado} no se puede ${caso.intento}`, () => {
      expect(() => caso.transicion(crear(caso.estado))).toThrow(TransicionInvalida)
    })
  }
})

describe('Postulacion: invariantes', () => {
  it('PAGO_PENDIENTE exige vencimiento', () => {
    expect(() => crear('PAGO_PENDIENTE', { venceEl: null })).toThrow()
  })

  it('PAGO_EN_REVISION exige motivo', () => {
    expect(() => crear('PAGO_EN_REVISION', { motivoRevision: null })).toThrow()
  })

  it('fuera de PAGO_EN_REVISION el motivo tiene que ser nulo', () => {
    expect(() => crear('PAGO_PENDIENTE', { motivoRevision: 'SIN_CUPO' })).toThrow()
  })
})

describe('Postulacion: inmutabilidad', () => {
  it('no muta la Postulación original', () => {
    const original = crear('PREINSCRIPTO')

    const actualizada = original.iniciarPago(VENCE_EL, CREADA_EL)

    expect(original.estado).toBe('PREINSCRIPTO')
    expect(original.venceEl).toBeNull()
    expect(actualizada).not.toBe(original)
    expect(actualizada.id).toBe(original.id)
    expect(actualizada.numero.equals(original.numero)).toBe(true)
  })
})
