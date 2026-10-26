import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso } from '@tfi/domain'
import { AccionesDelPersonalFake } from '../puertos/acciones-del-personal/fake'
import { PasarelaDePagoFake } from '../puertos/pasarela-de-pago/fake'
import type { DatosPagoPasarela } from '../puertos/pasarela-de-pago/puerto'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDeIntencionesDePagoFake } from '../puertos/repositorio-de-intenciones-de-pago/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import { ProcesarWebhookMercadoPagoUseCase } from './procesar-webhook-mercadopago'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const CIERRE = new Date('2026-12-01T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const MONTO = 1_500_000
const INSTITUCION = 'institucion-1'
const EXTERNAL_ID = 'int_1'

interface Opciones {
  totalCupos?: number
}

async function armarMundo(opciones: Opciones = {}) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const periodo = new PeriodoDeIngreso(
    'periodo-1',
    INSTITUCION,
    'Ingreso 2027',
    opciones.totalCupos ?? 50,
    CIERRE,
    10,
    MONTO,
  )
  await periodos.guardar(periodo)

  const postulacion = postulaciones.sembrar({
    aspiranteId: 'aspirante-1',
    periodoId: periodo.id,
    estado: 'PAGO_PENDIENTE',
    venceEl: new Date(AHORA.getTime() + UN_DIA),
  })
  const pasarela = new PasarelaDePagoFake()
  const acciones = new AccionesDelPersonalFake(postulaciones, periodos, reloj)
  const intenciones = new RepositorioDeIntencionesDePagoFake(() => reloj.ahora())
  await intenciones.crear({
    postulacionId: postulacion.id,
    periodoId: periodo.id,
    institucionId: INSTITUCION,
    montoCentavos: MONTO,
    externalId: EXTERNAL_ID,
    preferenceId: 'pref_1',
    initPoint: 'http://localhost/pagar',
    expiraEl: new Date(AHORA.getTime() + UN_DIA),
  })
  const caso = new ProcesarWebhookMercadoPagoUseCase(
    postulaciones,
    pasarela,
    acciones,
    reloj,
    intenciones,
  )

  return { caso, reloj, postulaciones, periodo, postulacion, pasarela, acciones, intenciones }
}

function pagoAprobado(overrides: Partial<DatosPagoPasarela> = {}): DatosPagoPasarela {
  return {
    paymentId: 'mp_1',
    status: 'approved',
    externalReference: EXTERNAL_ID,
    transactionAmountCentavos: MONTO,
    currencyId: 'ARS',
    dateApproved: AHORA,
    ...overrides,
  }
}

describe('ProcesarWebhookMercadoPago', () => {
  it('acredita un pago aprobado con el monto y la moneda de la intención', async () => {
    const { caso, postulaciones, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado())

    const resultado = await caso.ejecutar({ paymentId: 'mp_1', webhookEventId: 'evt_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: true })
    const confirmada = await postulaciones.obtenerPorId(postulacion.id)
    expect(confirmada?.estado).toBe('VACANTE_CONFIRMADA')
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('COMPLETADA')
    expect(intencion?.paymentIdMp).toBe('mp_1')
    expect(intencion?.pagadoEl).toEqual(AHORA)
  })

  it('es idempotente: un segundo webhook no vuelve a acreditar', async () => {
    const { caso, postulaciones, postulacion, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado())
    await caso.ejecutar({ paymentId: 'mp_1' })

    const segundo = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(segundo).toMatchObject({ procesado: true, yaProcesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('VACANTE_CONFIRMADA')
  })

  it('no acredita un pago con monto distinto', async () => {
    const { caso, postulaciones, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ transactionAmountCentavos: MONTO - 1 }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('PROCESANDO')
    expect(intencion?.paymentIdMp).toBe('mp_1')
  })

  it('no acredita un pago en otra moneda', async () => {
    const { caso, postulaciones, postulacion, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ currencyId: 'USD' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado.acreditado).toBe(false)
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
  })

  it('no acredita un pago aprobado sin monto ni moneda', async () => {
    const primero = await armarMundo()
    primero.pasarela.simularPago(
      pagoAprobado({ transactionAmountCentavos: undefined, currencyId: undefined }),
    )
    const sinDatos = await primero.caso.ejecutar({ paymentId: 'mp_1' })

    expect(sinDatos.acreditado).toBe(false)
    expect(
      (await primero.postulaciones.obtenerPorId(primero.postulacion.id))?.estado,
    ).toBe('PAGO_PENDIENTE')

    const segundo = await armarMundo()
    segundo.pasarela.simularPago(
      pagoAprobado({ transactionAmountCentavos: undefined, currencyId: 'ARS' }),
    )
    const sinMonto = await segundo.caso.ejecutar({ paymentId: 'mp_1' })

    expect(sinMonto.acreditado).toBe(false)
    expect(
      (await segundo.postulaciones.obtenerPorId(segundo.postulacion.id))?.estado,
    ).toBe('PAGO_PENDIENTE')
  })

  it('deja PROCESANDO un pago pendiente, sin acreditar', async () => {
    const { caso, postulaciones, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ status: 'pending' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('PROCESANDO')
    expect(intencion?.paymentIdMp).toBe('mp_1')
  })

  it('propaga errores de infraestructura para que el route responda 5xx', async () => {
    const { caso } = await armarMundo()

    await expect(caso.ejecutar({ paymentId: 'no-existe' })).rejects.toThrow(
      'Pago no encontrado en fake',
    )
  })

  it('completa la intención si el pago ya se había acreditado y el reintento da CONFLICTO', async () => {
    const { caso, acciones, postulacion, pasarela, intenciones } = await armarMundo()
    await acciones.confirmarVacante(postulacion.id)
    pasarela.simularPago(pagoAprobado({ paymentId: 'mp_2' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_2' })

    expect(resultado.acreditado).toBe(true)
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('COMPLETADA')
    expect(intencion?.paymentIdMp).toBe('mp_2')
  })

  it('no completa la intención si no hay cupo', async () => {
    const { caso, postulaciones, periodo, postulacion, pasarela, intenciones } = await armarMundo({
      totalCupos: 1,
    })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })
    pasarela.simularPago(pagoAprobado())

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('PROCESANDO')
  })

  it('descarta un pago sin external_reference', async () => {
    const { caso, postulaciones, postulacion, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ externalReference: undefined }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
  })

  it('descarta un pago con una referencia desconocida', async () => {
    const { caso, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ externalReference: 'int_desconocida' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
  })
})
