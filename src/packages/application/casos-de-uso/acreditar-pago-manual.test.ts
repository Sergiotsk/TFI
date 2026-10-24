import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, SinCuposParaConfirmar } from '@tfi/domain'
import { AccionesDelPersonalFake } from '../puertos/acciones-del-personal/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import { AcreditarPagoManualUseCase } from './acreditar-pago-manual'
import type { Actor } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'

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
    caso: new AcreditarPagoManualUseCase(postulaciones, acciones, reloj),
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

describe('AcreditarPagoManual', () => {
  it('confirma la vacante de una PAGO_PENDIENTE con cupo', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 5 * UN_DIA),
    })

    const consultada = await caso.ejecutar(secretaria, postulacion.id)

    expect(consultada.estado).toBe('VACANTE_CONFIRMADA')
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('VACANTE_CONFIRMADA')
  })

  it('también lo pueden hacer TESORERIA y DIRECCION', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const una = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 5 * UN_DIA),
    })
    const otra = postulaciones.sembrar({
      aspiranteId: 'aspirante-2',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 5 * UN_DIA),
    })

    await expect(caso.ejecutar({ ...secretaria, rol: 'TESORERIA' }, una.id)).resolves.toMatchObject(
      { estado: 'VACANTE_CONFIRMADA' },
    )
    await expect(caso.ejecutar({ ...secretaria, rol: 'DIRECCION' }, otra.id)).resolves.toMatchObject(
      { estado: 'VACANTE_CONFIRMADA' },
    )
  })

  it('acredita también una VENCIDO', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'VENCIDO',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    const consultada = await caso.ejecutar(secretaria, postulacion.id)

    expect(consultada.estado).toBe('VACANTE_CONFIRMADA')
  })

  it('no lo puede hacer un ASPIRANTE', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 5 * UN_DIA),
    })

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'ASPIRANTE' }, postulacion.id),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no encuentra una Postulación inexistente', async () => {
    const { caso } = armarMundo()

    await expect(caso.ejecutar(secretaria, 'no-existe')).rejects.toThrow(NoEncontrado)
  })

  it('no acredita desde un estado que no es PAGO_PENDIENTE ni VENCIDO', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PREINSCRIPTO',
    })

    await expect(caso.ejecutar(secretaria, postulacion.id)).rejects.toThrow(ConflictoDeEstado)
  })

  it('no acredita una excepción en revisión (la decide Dirección)', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos)
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_EN_REVISION',
    })

    await expect(caso.ejecutar(secretaria, postulacion.id)).rejects.toThrow(ConflictoDeEstado)
  })

  it('rechaza confirmar si el período ya está lleno', async () => {
    const { caso, postulaciones, periodos } = armarMundo()
    const periodo = await sembrarPeriodo(periodos, 1)
    postulaciones.sembrar({
      aspiranteId: 'confirmado',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + 5 * UN_DIA),
    })

    await expect(caso.ejecutar(secretaria, postulacion.id)).rejects.toThrow(
      SinCuposParaConfirmar,
    )
  })
})
