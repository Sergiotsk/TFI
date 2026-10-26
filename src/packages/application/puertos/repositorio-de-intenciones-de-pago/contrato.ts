import { describe, expect, it } from 'vitest'
import type { RepositorioDeIntencionesDePago } from './puerto'

const UN_DIA = 24 * 60 * 60 * 1000
const MONTO = 1_500_000

/**
 * Lo que necesita la suite para armar sus datos: el repositorio y una
 * Postulación válida (con su período e institución). El fake lo resuelve en
 * memoria; el adaptador, contra Supabase con la clave de servicio.
 */
export interface EntornoDeIntencionesDePago {
  repositorio: RepositorioDeIntencionesDePago
  postulacionId: string
  periodoId: string
  institucionId: string
  /** Un `external_id` único por corrida. */
  crearExternalId: () => string
  ahora: () => Date
}

/**
 * Contrato de `RepositorioDeIntencionesDePago`. Corre contra el fake y contra
 * el adaptador de Supabase.
 */
export function probarContratoDeRepositorioDeIntencionesDePago(
  crearEntorno: () => EntornoDeIntencionesDePago | Promise<EntornoDeIntencionesDePago>,
) {
  describe('contrato: RepositorioDeIntencionesDePago', () => {
    it('crear() deja la intención PENDIENTE y se puede leer por externalId', async () => {
      const entorno = await crearEntorno()
      const externalId = entorno.crearExternalId()

      const creada = await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId,
        preferenceId: 'pref-1',
        initPoint: 'https://example.com/pagar',
        expiraEl: new Date(entorno.ahora().getTime() + UN_DIA),
      })

      expect(creada.estado).toBe('PENDIENTE')
      expect(creada.externalId).toBe(externalId)
      expect(creada.montoCentavos).toBe(MONTO)
      expect(creada.paymentIdMp).toBeNull()

      const leida = await entorno.repositorio.obtenerPorExternalId(externalId)
      expect(leida?.id).toBe(creada.id)
      expect(leida?.preferenceId).toBe('pref-1')
    })

    it('obtenerPendientePorPostulacion() devuelve la más reciente no vencida', async () => {
      const entorno = await crearEntorno()
      const primera = await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId: entorno.crearExternalId(),
        expiraEl: new Date(entorno.ahora().getTime() + UN_DIA),
      })
      const segunda = await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId: entorno.crearExternalId(),
        expiraEl: new Date(entorno.ahora().getTime() + UN_DIA),
      })

      const pendiente = await entorno.repositorio.obtenerPendientePorPostulacion(
        entorno.postulacionId,
        entorno.ahora(),
      )

      expect(pendiente?.id).toBe(segunda.id)
      expect(pendiente?.id).not.toBe(primera.id)
    })

    it('obtenerPendientePorPostulacion() ignora las vencidas', async () => {
      const entorno = await crearEntorno()
      await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId: entorno.crearExternalId(),
        expiraEl: new Date(entorno.ahora().getTime() - 1_000),
      })

      expect(
        await entorno.repositorio.obtenerPendientePorPostulacion(
          entorno.postulacionId,
          entorno.ahora(),
        ),
      ).toBeNull()
    })

    it('marcarProcesada() guarda el pago y el evento', async () => {
      const entorno = await crearEntorno()
      const creada = await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId: entorno.crearExternalId(),
      })
      const paymentId = `mp_${entorno.crearExternalId()}`
      const webhookEventId = entorno.crearExternalId()

      const actualizada = await entorno.repositorio.marcarProcesada({
        externalId: creada.externalId,
        paymentIdMp: paymentId,
        webhookEventId,
      })

      expect(actualizada?.estado).toBe('PROCESANDO')
      expect(actualizada?.paymentIdMp).toBe(paymentId)
      expect(actualizada?.webhookEventId).toBe(webhookEventId)

      const porPago = await entorno.repositorio.obtenerPorPaymentIdMp(paymentId)
      expect(porPago?.id).toBe(creada.id)
    })

    it('marcarCompletada() deja la intención COMPLETADA y con fecha de pago', async () => {
      const entorno = await crearEntorno()
      const creada = await entorno.repositorio.crear({
        postulacionId: entorno.postulacionId,
        periodoId: entorno.periodoId,
        institucionId: entorno.institucionId,
        montoCentavos: MONTO,
        externalId: entorno.crearExternalId(),
      })
      const paymentId = `mp_${entorno.crearExternalId()}`

      const actualizada = await entorno.repositorio.marcarCompletada({
        externalId: creada.externalId,
        paymentIdMp: paymentId,
      })

      expect(actualizada?.estado).toBe('COMPLETADA')
      expect(actualizada?.paymentIdMp).toBe(paymentId)
      expect(actualizada?.pagadoEl).not.toBeNull()
    })
  })
}
