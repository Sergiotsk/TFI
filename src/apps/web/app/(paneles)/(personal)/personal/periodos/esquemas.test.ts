import { describe, expect, it } from 'vitest'
import { aHoraDeLaInstitucion, leerCambiosDePeriodo } from './esquemas'

const ID = '7b0e7a52-3c1f-4f51-9a40-2b5d8f3e6a10'

function formulario(campos: Record<string, string>): FormData {
  const datos = new FormData()
  const completos = {
    id: ID,
    nombre: 'Ingreso 2027',
    totalCupos: '60',
    diasPlazoPago: '5',
    montoPesos: '120000',
    cierraEl: '2026-12-15T18:00',
    cierraElOriginal: '2026-11-10T00:00',
    ...campos,
  }
  for (const [nombre, valor] of Object.entries(completos)) datos.set(nombre, valor)
  return datos
}

describe('leerCambiosDePeriodo', () => {
  it('lee todos los campos y pasa el monto de pesos a centavos', () => {
    const resultado = leerCambiosDePeriodo(formulario({ montoPesos: '1500.50' }))

    expect(resultado).toEqual({
      ok: true,
      id: ID,
      cambios: {
        nombre: 'Ingreso 2027',
        totalCupos: 60,
        diasPlazoPago: 5,
        montoMatriculaCentavos: 150050,
        cierraEl: new Date('2026-12-15T21:00:00.000Z'),
      },
    })
  })

  it('toma el cierre en hora de Argentina (UTC-3)', () => {
    const resultado = leerCambiosDePeriodo(formulario({ cierraEl: '2026-11-20T00:00' }))

    expect(resultado.ok && resultado.cambios.cierraEl?.toISOString()).toBe('2026-11-20T03:00:00.000Z')
  })

  it('no manda el cierre si no cambió: un período cerrado se edita sin reabrirlo', () => {
    const resultado = leerCambiosDePeriodo(
      formulario({ cierraEl: '2026-11-10T00:00', cierraElOriginal: '2026-11-10T00:00' }),
    )

    expect(resultado.ok).toBe(true)
    expect(resultado.ok && 'cierraEl' in resultado.cambios).toBe(false)
  })

  it.each([
    [{ id: 'no-es-uuid' }, 'El período no es válido'],
    [{ nombre: '   ' }, 'El nombre es obligatorio'],
    [{ totalCupos: '-1' }, 'El total de cupos no puede ser negativo'],
    [{ diasPlazoPago: '0' }, 'El plazo debe ser de al menos un día'],
    [{ montoPesos: '0' }, 'El monto debe ser mayor que cero'],
    [{ cierraEl: 'mañana' }, 'La fecha de cierre no es válida'],
  ])('rechaza %o con un mensaje claro', (campos, mensaje) => {
    expect(leerCambiosDePeriodo(formulario(campos))).toEqual({ ok: false, mensaje })
  })
})

describe('aHoraDeLaInstitucion', () => {
  it('da el valor de un datetime-local en hora de Argentina', () => {
    expect(aHoraDeLaInstitucion(new Date('2026-11-10T03:00:00.000Z'))).toBe('2026-11-10T00:00')
    expect(aHoraDeLaInstitucion(new Date('2026-11-07T12:33:31.949Z'))).toBe('2026-11-07T09:33')
  })
})
