import {
  Dni,
  Monto,
  ReferenciaDePago,
  evaluarPago,
  type Candidata,
  type DecisionDeAcreditacion,
  type Pago,
  type PagoInformado,
} from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RegistroDePagos, ResultadoDeAcreditacion } from '../puertos/registro-de-pagos/puerto'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { PasarelaDePago, DatosPagoPasarela } from '../puertos/pasarela-de-pago/puerto'
import type {
  IntencionDePago,
  RepositorioDeIntencionesDePago,
} from '../puertos/repositorio-de-intenciones-de-pago/puerto'
import { ConflictoDeEstado } from './errores'

/** Reintentos ante un conflicto de concurrencia (research R2). */
const INTENTOS = 3

export interface ResultadoWebhookPago {
  procesado: boolean
  yaProcesado: boolean
  acreditado: boolean
  postulacionId?: string
}

/**
 * Procesa un webhook de MercadoPago de forma idempotente.
 *
 * La notificación no acredita nada por sí sola: se consulta el pago a MP y se
 * reutiliza el mismo circuito que el informe (`evaluarPago` + `acreditar_pago`).
 * Eso deja registrado **todo** pago aprobado, incluso cuando no confirma la
 * vacante (duplicado, monto distinto, fuera de plazo o sin cupo), y mantiene
 * una única implementación de las reglas de cupo y estados.
 *
 * Los errores de infraestructura se propagan para que el route handler
 * responda 5xx y MercadoPago reintente. Solo se responde 200 cuando la
 * notificación quedó resuelta (acreditada, ya procesada o descartada por
 * negocio).
 */
export class ProcesarWebhookMercadoPagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly perfiles: RepositorioDePerfiles,
    private readonly pagos: RegistroDePagos,
    private readonly pasarela: PasarelaDePago,
    private readonly reloj: Reloj,
    private readonly intenciones: RepositorioDeIntencionesDePago,
  ) {}

  async ejecutar(params: { paymentId: string; webhookEventId?: string }): Promise<ResultadoWebhookPago> {
    if (!params.paymentId) {
      return { procesado: false, yaProcesado: false, acreditado: false }
    }

    const referencia = new ReferenciaDePago('MERCADOPAGO', params.paymentId)

    // La referencia es única: si el pago ya está registrado, el webhook es un
    // reintento y no hay que volver a tocar cupos ni estados.
    const existente = await this.pagos.existe(referencia)
    if (existente) {
      return {
        procesado: true,
        yaProcesado: true,
        acreditado: existente.estado === 'ACREDITADO',
        postulacionId: existente.postulacionId,
      }
    }

    const datos = await this.pasarela.obtenerPago(params.paymentId)

    if (datos.status !== 'approved') {
      if (datos.externalReference) {
        const intencion = await this.intenciones.obtenerPorExternalId(datos.externalReference)
        // Una notificación vieja (pending) no debe bajar una intención ya
        // completada por un pago aprobado.
        if (intencion && intencion.estado !== 'COMPLETADA') {
          await this.marcarProcesada(intencion, params, datos)
        }
      }
      return { procesado: true, yaProcesado: false, acreditado: false }
    }

    const pago = this.aPagoInformado(referencia, datos)
    if (!pago) {
      // Un pago aprobado sin monto no se puede registrar con fidelidad. Se
      // devuelve error para que MP reintente y quede visible en los logs.
      throw new Error(`El pago ${params.paymentId} está aprobado pero no trae un monto válido`)
    }

    const externalReference = datos.externalReference
    if (!externalReference) {
      await this.registrarNoImputado(pago, { motivo: 'REFERENCIA_DESCONOCIDA' })
      return { procesado: true, yaProcesado: false, acreditado: false }
    }

    const intencion = await this.intenciones.obtenerPorExternalId(externalReference)
    if (!intencion) {
      await this.registrarNoImputado(pago, { motivo: 'REFERENCIA_DESCONOCIDA' })
      return { procesado: true, yaProcesado: false, acreditado: false }
    }

    // La intención fija el monto y la moneda de la preferencia. Si el pago no
    // coincide, se registra como no imputado en lugar de perderlo.
    if (datos.currencyId !== 'ARS' || pago.monto.centavos !== intencion.montoCentavos) {
      await this.registrarNoImputado(pago, {
        motivo:
          pago.monto.centavos < intencion.montoCentavos ? 'MONTO_INSUFICIENTE' : 'MONTO_INCORRECTO',
        postulacionId: intencion.postulacionId,
      })
      await this.marcarProcesada(intencion, params, datos)
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: false,
        postulacionId: intencion.postulacionId,
      }
    }

    const postulacion = await this.postulaciones.obtenerPorId(intencion.postulacionId)
    if (!postulacion) {
      await this.registrarNoImputado(pago, { motivo: 'REFERENCIA_DESCONOCIDA' })
      await this.marcarProcesada(intencion, params, datos)
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: false,
        postulacionId: intencion.postulacionId,
      }
    }

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (
      !periodo ||
      periodo.id !== intencion.periodoId ||
      periodo.institucionId !== intencion.institucionId
    ) {
      await this.registrarNoImputado(pago, {
        motivo: 'REFERENCIA_DESCONOCIDA',
        postulacionId: postulacion.id,
      })
      await this.marcarProcesada(intencion, params, datos)
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: false,
        postulacionId: postulacion.id,
      }
    }

    const perfil = await this.perfiles.obtenerPorId(postulacion.aspiranteId)
    if (!perfil) {
      await this.registrarNoImputado(pago, {
        motivo: 'REFERENCIA_DESCONOCIDA',
        postulacionId: postulacion.id,
      })
      await this.marcarProcesada(intencion, params, datos)
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: false,
        postulacionId: postulacion.id,
      }
    }

    const resultado = await this.acreditarConReintentos(
      pago,
      postulacion.id,
      new Dni(perfil.dni),
    )

    if (resultado.tipo === 'DUPLICADO') {
      const registrado = resultado.pagoExistente
      await this.marcarSegunPago(intencion, params, datos, registrado)
      return {
        procesado: true,
        yaProcesado: true,
        acreditado: registrado.estado === 'ACREDITADO',
        postulacionId: registrado.postulacionId,
      }
    }

    if (resultado.tipo !== 'REGISTRADO') {
      throw new ConflictoDeEstado(
        `No se pudo acreditar el pago ${pago.referencia.referenciaExterna}`,
      )
    }

    const registrado = resultado.pago
    await this.marcarSegunPago(intencion, params, datos, registrado)
    return {
      procesado: true,
      yaProcesado: false,
      acreditado: registrado.estado === 'ACREDITADO',
      postulacionId: registrado.postulacionId,
    }
  }

  private aPagoInformado(
    referencia: ReferenciaDePago,
    datos: DatosPagoPasarela,
  ): PagoInformado | null {
    const centavos = datos.transactionAmountCentavos
    if (centavos === undefined || centavos <= 0) return null

    return {
      referencia,
      monto: new Monto(centavos),
      pagadoEl: datos.dateApproved ?? this.reloj.ahora(),
    }
  }

  private async registrarNoImputado(
    pago: PagoInformado,
    decision: Omit<Extract<DecisionDeAcreditacion, { tipo: 'NO_IMPUTAR' }>, 'tipo'>,
  ): Promise<void> {
    const resultado = await this.pagos.registrarAcreditacion(pago, {
      tipo: 'NO_IMPUTAR',
      ...decision,
    })
    if (resultado.tipo === 'CONFLICTO') {
      throw new ConflictoDeEstado(
        `No se pudo registrar el pago ${pago.referencia.referenciaExterna} como no imputado`,
      )
    }
  }

  private async acreditarConReintentos(
    pago: PagoInformado,
    postulacionId: string,
    dni: Dni,
  ): Promise<ResultadoDeAcreditacion> {
    for (let intento = 0; intento < INTENTOS; intento += 1) {
      const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
      if (!postulacion) {
        return this.pagos.registrarAcreditacion(pago, {
          tipo: 'NO_IMPUTAR',
          motivo: 'REFERENCIA_DESCONOCIDA',
        })
      }

      const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
      if (!periodo) {
        return this.pagos.registrarAcreditacion(pago, {
          tipo: 'NO_IMPUTAR',
          motivo: 'REFERENCIA_DESCONOCIDA',
          postulacionId: postulacion.id,
        })
      }

      const candidata: Candidata = { postulacion, dniDelAspirante: dni }
      const ocupados = await this.periodos.contarOcupados(periodo.id)
      const decision = evaluarPago(
        pago,
        { via: 'NUMERO', candidatas: [candidata] },
        periodo,
        ocupados,
      )
      const resultado = await this.pagos.registrarAcreditacion(pago, decision)
      if (resultado.tipo !== 'CONFLICTO') return resultado
    }

    throw new ConflictoDeEstado(
      `No se pudo acreditar el pago ${pago.referencia.referenciaExterna} después de ${INTENTOS} intentos`,
    )
  }

  private async marcarProcesada(
    intencion: IntencionDePago,
    params: { paymentId: string; webhookEventId?: string },
    datos: DatosPagoPasarela,
  ): Promise<void> {
    if (intencion.estado === 'COMPLETADA') return

    await this.intenciones.marcarProcesada({
      externalId: intencion.externalId,
      paymentIdMp: params.paymentId,
      webhookEventId: params.webhookEventId,
      pagadoEl: datos.dateApproved ?? this.reloj.ahora(),
    })
  }

  private async marcarSegunPago(
    intencion: IntencionDePago,
    params: { paymentId: string; webhookEventId?: string },
    datos: DatosPagoPasarela,
    pago: Pago,
  ): Promise<void> {
    // Si la intención ya se completó con otro pago, no se pisa el vínculo.
    if (intencion.estado === 'COMPLETADA') return

    if (pago.estado === 'ACREDITADO') {
      await this.intenciones.marcarCompletada({
        externalId: intencion.externalId,
        paymentIdMp: params.paymentId,
        webhookEventId: params.webhookEventId,
        pagadoEl: datos.dateApproved ?? this.reloj.ahora(),
      })
      return
    }

    await this.marcarProcesada(intencion, params, datos)
  }
}
