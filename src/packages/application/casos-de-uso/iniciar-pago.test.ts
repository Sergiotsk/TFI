import { describe, expect, it } from 'vitest'
import {
  PeriodoDeIngreso,
  PeriodoCerrado,
  SinCuposParaIniciar,
  TransicionInvalida,
} from '@tfi/domain'
import type { Postulacion } from '@tfi/domain'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { IniciarPagoUseCase } from './iniciar-pago'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const CIERRE = new Date('2026-12-01T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: 'institucion-1',
}

class RepositorioEspia extends RepositorioDePostulacionesFake {
  readonly transiciones: Array<{ antes: string; despues: string }> = []

  override async guardarTransicion(
    antes: Postulacion,
    despues: Postulacion,
  ): Promise<'ok' | 'conflicto'> {
    this.transiciones.push({ antes: antes.estado, despues: despues.estado })

    return super.guardarTransicion(antes, despues)
  }
}

class RepositorioQueConflictua extends RepositorioDePostulacionesFake {
  override async guardarTransicion(): Promise<'conflicto'> {
    return 'conflicto'
  }
}

interface Opciones {
  cierraEl?: Date
  totalCupos?: number
  postulaciones?: RepositorioDePostulacionesFake
}

async function armarMundo(opciones: Opciones = {}) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = opciones.postulaciones ?? new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const periodo = new PeriodoDeIngreso(
    'periodo-1',
    'institucion-1',
    'Ingreso 2027',
    opciones.totalCupos ?? 50,
    opciones.cierraEl ?? CIERRE,
    10,
    1_500_000,
  )
  await periodos.guardar(periodo)

  return {
    caso: new IniciarPagoUseCase(postulaciones, periodos, reloj),
    postulaciones,
    periodo,
  }
}

describe('IniciarPago', () => {
  it('calcula el vencimiento sumando el plazo del período', async () => {
    const { caso, postulaciones, periodo } = await armarMundo()
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    const iniciada = await caso.ejecutar(aspirante, creada.id)

    expect(iniciada.estado).toBe('PAGO_PENDIENTE')
    expect(iniciada.venceEl).toEqual(new Date('2026-10-30T00:00:00.000Z'))
    expect(iniciada.aviso).toBe('Tu lugar no está reservado hasta que se acredite el pago.')
  })

  it('acota el vencimiento al cierre del período', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({
      cierraEl: new Date('2026-10-25T00:00:00.000Z'),
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    const iniciada = await caso.ejecutar(aspirante, creada.id)

    expect(iniciada.venceEl).toEqual(new Date('2026-10-25T00:00:00.000Z'))
  })

  it('no deja iniciar el pago con el período cerrado', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({
      cierraEl: new Date('2026-10-19T00:00:00.000Z'),
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    await expect(caso.ejecutar(aspirante, creada.id)).rejects.toThrow(PeriodoCerrado)
  })

  it('no deja iniciar el pago si no hay cupos libres (FR-011)', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({ totalCupos: 1 })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    await expect(caso.ejecutar(aspirante, creada.id)).rejects.toThrow(SinCuposParaIniciar)
  })

  it('cuenta los pagos pendientes vigentes como lugar ocupado', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({ totalCupos: 1 })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + UN_DIA),
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    await expect(caso.ejecutar(aspirante, creada.id)).rejects.toThrow(SinCuposParaIniciar)
  })

  it('no cuenta los pagos pendientes ya vencidos', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({ totalCupos: 1 })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    const iniciada = await caso.ejecutar(aspirante, creada.id)

    expect(iniciada.estado).toBe('PAGO_PENDIENTE')
  })

  it('reintenta desde VENCIDO con un plazo nuevo', async () => {
    const { caso, postulaciones, periodo } = await armarMundo()
    const vencida = postulaciones.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: periodo.id,
      estado: 'VENCIDO',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    const iniciada = await caso.ejecutar(aspirante, vencida.id)

    expect(iniciada.estado).toBe('PAGO_PENDIENTE')
    expect(iniciada.venceEl).toEqual(new Date('2026-10-30T00:00:00.000Z'))
  })

  it('persiste el VENCIDO antes de reintentar un pago vencido', async () => {
    const espia = new RepositorioEspia()
    const { caso, periodo } = await armarMundo({ postulaciones: espia })
    const vencida = espia.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: periodo.id,
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    await caso.ejecutar(aspirante, vencida.id)

    expect(espia.transiciones).toEqual([
      { antes: 'PAGO_PENDIENTE', despues: 'VENCIDO' },
      { antes: 'VENCIDO', despues: 'PAGO_PENDIENTE' },
    ])
  })

  it('devuelve ConflictoDeEstado si otro proceso movió la fila', async () => {
    const conflictivo = new RepositorioQueConflictua()
    const { caso, periodo } = await armarMundo({ postulaciones: conflictivo })
    const creada = await conflictivo.crear(aspirante.perfilId, periodo.id)

    await expect(caso.ejecutar(aspirante, creada.id)).rejects.toThrow(ConflictoDeEstado)
  })

  it('no deja reiniciar un plazo que sigue vigente', async () => {
    const { caso, postulaciones, periodo } = await armarMundo()
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)
    await caso.ejecutar(aspirante, creada.id)

    await expect(caso.ejecutar(aspirante, creada.id)).rejects.toThrow(TransicionInvalida)
  })

  it('no deja iniciar el pago de una Postulación ajena', async () => {
    const { caso, postulaciones, periodo } = await armarMundo()
    const ajena = postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'PREINSCRIPTO',
    })

    await expect(caso.ejecutar(aspirante, ajena.id)).rejects.toThrow(NoAutorizado)
  })

  it('solo un ASPIRANTE puede iniciar el pago', async () => {
    const { caso, postulaciones, periodo } = await armarMundo()
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    await expect(
      caso.ejecutar({ ...aspirante, rol: 'TESORERIA' }, creada.id),
    ).rejects.toThrow(NoAutorizado)
  })

  it('devuelve NoEncontrado si la Postulación no existe', async () => {
    const { caso } = await armarMundo()

    await expect(caso.ejecutar(aspirante, 'no-existe')).rejects.toThrow(NoEncontrado)
  })
})
