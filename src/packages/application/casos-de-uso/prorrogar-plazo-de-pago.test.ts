import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, PeriodoCerrado, SinCuposParaIniciar } from '@tfi/domain'
import { AccionesDelPersonalFake } from '../puertos/acciones-del-personal/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { ProrrogarPlazoDePagoUseCase } from './prorrogar-plazo-de-pago'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const INSTITUCION = 'institucion-1'

const secretaria: Actor = {
  perfilId: 'secretaria-1',
  rol: 'SECRETARIA',
  institucionId: INSTITUCION,
}

function armarMundo() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const acciones = new AccionesDelPersonalFake(postulaciones, periodos, reloj)

  return {
    caso: new ProrrogarPlazoDePagoUseCase(postulaciones, periodos, acciones, reloj),
    postulaciones,
    periodos,
  }
}

async function sembrarPeriodo(
  periodos: RepositorioDePeriodosFake,
  totalCupos = 10,
  cierraEl = new Date(AHORA.getTime() + 30 * UN_DIA),
) {
  const periodo = new PeriodoDeIngreso(
    'periodo-1',
    INSTITUCION,
    'Primer cuatrimestre 2027',
    totalCupos,
    cierraEl,
    3,
    1_500_000,
  )
  await periodos.guardar(periodo)

  return periodo
}

describe('ProrrogarPlazoDePago', () => {
  it('extiende el plazo de una PAGO_PENDIENTE', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 2 * UN_DIA),
    })

    const consultada = await caso.ejecutar(secretaria, postulacion.id, 5)

    expect(consultada.estado).toBe('PAGO_PENDIENTE')
    expect(consultada.venceEl).toEqual(new Date(AHORA.getTime() + 5 * UN_DIA))
  })

  it('recorta el nuevo vencimiento al cierre del período', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(
      periodos,
      10,
      new Date(AHORA.getTime() + 2 * UN_DIA),
    )
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + UN_DIA),
    })

    const consultada = await caso.ejecutar(secretaria, postulacion.id, 10)

    expect(consultada.venceEl).toEqual(new Date(AHORA.getTime() + 2 * UN_DIA))
  })

  it('reactiva una VENCIDO con un plazo nuevo', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'VENCIDO',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    const consultada = await caso.ejecutar(secretaria, postulacion.id, 4)

    expect(consultada.estado).toBe('PAGO_PENDIENTE')
    expect(consultada.venceEl).toEqual(new Date(AHORA.getTime() + 4 * UN_DIA))
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
  })

  it('no reactiva una VENCIDO si el período no tiene cupo libre', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos, 1)
    postulaciones.sembrar({
      aspiranteId: 'confirmado',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })
    const vencida = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'VENCIDO',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    await expect(caso.ejecutar(secretaria, vencida.id, 3)).rejects.toThrow(SinCuposParaIniciar)
  })

  it('no prorroga si el período ya cerró', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos, 10, new Date(AHORA.getTime() - UN_DIA))
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 2 * UN_DIA),
    })

    await expect(caso.ejecutar(secretaria, postulacion.id, 3)).rejects.toThrow(PeriodoCerrado)
  })

  it('solo lo puede hacer el personal', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 2 * UN_DIA),
    })

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'ASPIRANTE' }, postulacion.id, 3),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no prorroga una Postulación ya confirmada', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })

    await expect(caso.ejecutar(secretaria, postulacion.id, 3)).rejects.toThrow(ConflictoDeEstado)
  })

  it('no encuentra una Postulación inexistente', async () => {
    const { caso } = armarMundo()

    await expect(caso.ejecutar(secretaria, 'no-existe', 3)).rejects.toThrow(NoEncontrado)
  })
})
