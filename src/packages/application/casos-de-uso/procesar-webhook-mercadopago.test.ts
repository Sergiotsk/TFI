import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, ReferenciaDePago } from '@tfi/domain'
import { PasarelaDePagoFake } from '../puertos/pasarela-de-pago/fake'
import type { DatosPagoPasarela } from '../puertos/pasarela-de-pago/puerto'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDeIntencionesDePagoFake } from '../puertos/repositorio-de-intenciones-de-pago/fake'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
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
  const perfiles = new RepositorioDePerfilesFake()
  const cargas = new RegistroDeCargasFake(reloj)
  const pagos = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)
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
    // El perfil 1 del fake es Juan Pérez, con DNI 10000001.
    aspiranteId: '1',
    periodoId: periodo.id,
    estado: 'PAGO_PENDIENTE',
    venceEl: new Date(AHORA.getTime() + UN_DIA),
  })
  const pasarela = new PasarelaDePagoFake()
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
    periodos,
    perfiles,
    pagos,
    pasarela,
    reloj,
    intenciones,
  )

  return { caso, reloj, postulaciones, periodos, perfiles, pagos, periodo, postulacion, pasarela, intenciones }
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

function referencia(paymentId = 'mp_1'): ReferenciaDePago {
  return new ReferenciaDePago('MERCADOPAGO', paymentId)
}

describe('ProcesarWebhookMercadoPago', () => {
  it('acredita un pago aprobado con el monto y la moneda de la intención', async () => {
    const { caso, postulaciones, pagos, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado())

    const resultado = await caso.ejecutar({ paymentId: 'mp_1', webhookEventId: 'evt_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: true })
    const confirmada = await postulaciones.obtenerPorId(postulacion.id)
    expect(confirmada?.estado).toBe('VACANTE_CONFIRMADA')

    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('ACREDITADO')
    expect(registrado?.referencia.proveedor).toBe('MERCADOPAGO')
    expect(registrado?.postulacionId).toBe(postulacion.id)

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

    expect(segundo).toMatchObject({ procesado: true, yaProcesado: true, acreditado: true })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('VACANTE_CONFIRMADA')
  })

  it('registra como NO_IMPUTADO un pago con monto menor', async () => {
    const { caso, postulaciones, pagos, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ transactionAmountCentavos: MONTO - 1 }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')

    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('NO_IMPUTADO')
    expect(registrado?.motivoNoImputado).toBe('MONTO_INSUFICIENTE')
    expect(registrado?.monto.centavos).toBe(MONTO - 1)

    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('PROCESANDO')
    expect(intencion?.paymentIdMp).toBe('mp_1')
  })

  it('registra como NO_IMPUTADO un pago en otra moneda', async () => {
    const { caso, postulaciones, pagos, postulacion, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ currencyId: 'USD' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado.acreditado).toBe(false)
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('NO_IMPUTADO')
    expect(registrado?.motivoNoImputado).toBe('MONTO_INCORRECTO')
  })

  it('falla si el pago aprobado no trae monto, para que MP reintente', async () => {
    const { caso, pasarela, pagos } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ transactionAmountCentavos: undefined }))

    await expect(caso.ejecutar({ paymentId: 'mp_1' })).rejects.toThrow(
      'está aprobado pero no trae un monto válido',
    )
    expect(await pagos.existe(referencia())).toBeNull()
  })

  it('deja PROCESANDO un pago pendiente, sin acreditar', async () => {
    const { caso, postulaciones, pagos, postulacion, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ status: 'pending' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    expect(await pagos.existe(referencia())).toBeNull()

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

  it('registra el pago aunque la Postulación ya esté confirmada', async () => {
    const { caso, pasarela, pagos, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado())
    await caso.ejecutar({ paymentId: 'mp_1' })

    pasarela.simularPago(pagoAprobado({ paymentId: 'mp_2' }))
    const resultado = await caso.ejecutar({ paymentId: 'mp_2' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    const segundo = await pagos.existe(referencia('mp_2'))
    expect(segundo?.estado).toBe('NO_IMPUTADO')
    expect(segundo?.motivoNoImputado).toBe('YA_TIENE_PAGO')

    // La intención conserva el pago que efectivamente confirmó la vacante.
    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('COMPLETADA')
    expect(intencion?.paymentIdMp).toBe('mp_1')
  })

  it('no baja a PROCESANDO una intención ya completada con una notificación vieja', async () => {
    const { caso, pasarela, intenciones } = await armarMundo()
    pasarela.simularPago(pagoAprobado())
    await caso.ejecutar({ paymentId: 'mp_1' })

    pasarela.simularPago(pagoAprobado({ paymentId: 'mp_3', status: 'pending' }))
    await caso.ejecutar({ paymentId: 'mp_3' })

    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('COMPLETADA')
    expect(intencion?.paymentIdMp).toBe('mp_1')
  })

  it('deja A_DECIDIR el pago si no hay cupo', async () => {
    const { caso, postulaciones, pagos, periodo, postulacion, pasarela, intenciones } =
      await armarMundo({ totalCupos: 1 })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: periodo.id,
      estado: 'VACANTE_CONFIRMADA',
    })
    pasarela.simularPago(pagoAprobado())

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_EN_REVISION')
    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('A_DECIDIR')
    expect(registrado?.motivoRevision).toBe('SIN_CUPO')

    const intencion = await intenciones.obtenerPorExternalId(EXTERNAL_ID)
    expect(intencion?.estado).toBe('PROCESANDO')
  })

  it('registra como NO_IMPUTADO un pago sin external_reference', async () => {
    const { caso, postulaciones, pagos, postulacion, pasarela } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ externalReference: undefined }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('PAGO_PENDIENTE')
    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('NO_IMPUTADO')
    expect(registrado?.motivoNoImputado).toBe('REFERENCIA_DESCONOCIDA')
  })

  it('registra como NO_IMPUTADO un pago con una referencia desconocida', async () => {
    const { caso, pasarela, pagos } = await armarMundo()
    pasarela.simularPago(pagoAprobado({ externalReference: 'int_desconocida' }))

    const resultado = await caso.ejecutar({ paymentId: 'mp_1' })

    expect(resultado).toMatchObject({ procesado: true, acreditado: false })
    const registrado = await pagos.existe(referencia())
    expect(registrado?.estado).toBe('NO_IMPUTADO')
    expect(registrado?.motivoNoImputado).toBe('REFERENCIA_DESCONOCIDA')
  })
})
