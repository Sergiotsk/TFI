import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, SinCuposParaIniciar } from '@tfi/domain'
import type { Postulacion } from '@tfi/domain'
import { PasarelaDePagoFake } from '../puertos/pasarela-de-pago/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDeIntencionesDePagoFake } from '../puertos/repositorio-de-intenciones-de-pago/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import { IniciarPagoConPasarelaUseCase } from './iniciar-pago-con-pasarela'
import type { Actor } from './actor'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const CIERRE = new Date('2026-12-01T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const INSTITUCION = 'institucion-1'

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: INSTITUCION,
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

interface Opciones {
  totalCupos?: number
  postulaciones?: RepositorioEspia
}

async function armarMundo(opciones: Opciones = {}) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = opciones.postulaciones ?? new RepositorioEspia()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const pasarela = new PasarelaDePagoFake()
  const intenciones = new RepositorioDeIntencionesDePagoFake(() => reloj.ahora())
  const periodo = new PeriodoDeIngreso(
    'periodo-1',
    INSTITUCION,
    'Ingreso 2027',
    opciones.totalCupos ?? 50,
    CIERRE,
    10,
    1_500_000,
  )
  await periodos.guardar(periodo)

  let external = 0
  const caso = new IniciarPagoConPasarelaUseCase(
    postulaciones,
    periodos,
    pasarela,
    reloj,
    () => {
      external += 1
      return `int_${external}`
    },
    () => ({
      backUrls: {
        success: 'http://localhost/pagos/retorno?resultado=success',
        pending: 'http://localhost/pagos/retorno?resultado=pending',
        failure: 'http://localhost/pagos/retorno?resultado=failure',
      },
      notificationUrl: 'http://localhost/api/pagos/webhook/mercadopago',
    }),
    intenciones,
  )

  return { caso, reloj, postulaciones, periodo, intenciones }
}

describe('IniciarPagoConPasarela', () => {
  it('pasa a PAGO_PENDIENTE y guarda una intención', async () => {
    const { caso, postulaciones, periodo, intenciones } = await armarMundo()
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)

    const resultado = await caso.ejecutar(aspirante, creada.id)

    expect(resultado.postulacion.estado).toBe('PAGO_PENDIENTE')
    expect(resultado.externalId).toBe('int_1')
    expect(resultado.initPoint).toContain('pref_fake_int_1')
    expect(intenciones.todas()).toHaveLength(1)
    expect(intenciones.todas()[0]?.postulacionId).toBe(creada.id)
    expect(intenciones.todas()[0]?.expiraEl).toEqual(new Date('2026-10-30T00:00:00.000Z'))
  })

  it('reintenta con el plazo vigente sin repetir la transición ni crear otra preferencia', async () => {
    const espia = new RepositorioEspia()
    const { caso, postulaciones, periodo, intenciones } = await armarMundo({
      postulaciones: espia,
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)
    const primero = await caso.ejecutar(aspirante, creada.id)

    const segundo = await caso.ejecutar(aspirante, creada.id)

    expect(segundo.externalId).toBe(primero.externalId)
    expect(segundo.preferenceId).toBe(primero.preferenceId)
    expect(segundo.initPoint).toBe(primero.initPoint)
    expect(espia.transiciones).toEqual([
      { antes: 'PREINSCRIPTO', despues: 'PAGO_PENDIENTE' },
    ])
    expect(intenciones.todas()).toHaveLength(1)
  })

  it('no se queda sin cupos por contarse a sí misma en el reintento', async () => {
    const { caso, postulaciones, periodo } = await armarMundo({ totalCupos: 1 })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)
    await caso.ejecutar(aspirante, creada.id)

    const reintento = await caso.ejecutar(aspirante, creada.id)

    expect(reintento.postulacion.estado).toBe('PAGO_PENDIENTE')
  })

  it('reintenta desde un PAGO_PENDIENTE vencido con una intención nueva', async () => {
    const espia = new RepositorioEspia()
    const { caso, reloj, postulaciones, periodo, intenciones } = await armarMundo({
      postulaciones: espia,
    })
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)
    const primero = await caso.ejecutar(aspirante, creada.id)

    reloj.avanzar(11 * UN_DIA)
    const segundo = await caso.ejecutar(aspirante, creada.id)

    expect(segundo.externalId).not.toBe(primero.externalId)
    expect(espia.transiciones).toEqual([
      { antes: 'PREINSCRIPTO', despues: 'PAGO_PENDIENTE' },
      { antes: 'PAGO_PENDIENTE', despues: 'VENCIDO' },
      { antes: 'VENCIDO', despues: 'PAGO_PENDIENTE' },
    ])
    expect(intenciones.todas()).toHaveLength(2)
  })

  it('no reutiliza una intención de otro monto', async () => {
    const { caso, postulaciones, periodo, intenciones } = await armarMundo()
    const creada = await postulaciones.crear(aspirante.perfilId, periodo.id)
    await intenciones.crear({
      postulacionId: creada.id,
      periodoId: periodo.id,
      institucionId: INSTITUCION,
      montoCentavos: 1,
      externalId: 'int_vieja',
      preferenceId: 'pref_vieja',
      initPoint: 'http://localhost/vieja',
      expiraEl: new Date(AHORA.getTime() + UN_DIA),
    })

    const resultado = await caso.ejecutar(aspirante, creada.id)

    expect(resultado.externalId).toBe('int_1')
    expect(intenciones.todas()).toHaveLength(2)
  })

  it('sigue contando los pendientes de otras Postulaciones', async () => {
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
})
