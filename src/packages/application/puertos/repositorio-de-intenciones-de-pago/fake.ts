import type {
  CrearIntencionDePago,
  IntencionDePago,
  RepositorioDeIntencionesDePago,
} from './puerto'

type ParamsDeMarcado = {
  externalId?: string
  paymentIdMp?: string
  webhookEventId?: string
  pagadoEl?: Date
}

/**
 * Repositorio de intenciones en memoria: el mismo contrato que el adaptador de
 * Supabase, sin base ni red. Lo usan los tests de los casos de uso y la suite
 * de contrato.
 */
export class RepositorioDeIntencionesDePagoFake implements RepositorioDeIntencionesDePago {
  private readonly intenciones = new Map<string, IntencionDePago>()
  private siguienteId = 1

  constructor(private readonly ahora: () => Date = () => new Date()) {}

  async crear(intencion: CrearIntencionDePago): Promise<IntencionDePago> {
    const repetida = [...this.intenciones.values()].find(
      (otra) => otra.externalId === intencion.externalId,
    )
    if (repetida) throw new Error(`Ya existe una intención con externalId ${intencion.externalId}`)

    const fecha = this.ahora()
    const creada: IntencionDePago = {
      id: `intencion-fake-${this.siguienteId}`,
      postulacionId: intencion.postulacionId,
      periodoId: intencion.periodoId,
      institucionId: intencion.institucionId,
      montoCentavos: intencion.montoCentavos,
      externalId: intencion.externalId,
      preferenceId: intencion.preferenceId ?? null,
      initPoint: intencion.initPoint ?? null,
      sandboxInitPoint: intencion.sandboxInitPoint ?? null,
      estado: 'PENDIENTE',
      paymentIdMp: null,
      webhookEventId: null,
      pagadoEl: null,
      creadoEl: fecha,
      actualizadoEl: fecha,
      expiraEl: intencion.expiraEl ?? null,
    }
    this.siguienteId += 1
    this.intenciones.set(creada.id, creada)

    return { ...creada }
  }

  async obtenerPorExternalId(externalId: string): Promise<IntencionDePago | null> {
    const encontrada = [...this.intenciones.values()].find(
      (intencion) => intencion.externalId === externalId,
    )

    return encontrada ? { ...encontrada } : null
  }

  async obtenerPorPaymentIdMp(paymentIdMp: string): Promise<IntencionDePago | null> {
    const encontrada = [...this.intenciones.values()].find(
      (intencion) => intencion.paymentIdMp === paymentIdMp,
    )

    return encontrada ? { ...encontrada } : null
  }

  async obtenerPendientePorPostulacion(
    postulacionId: string,
    ahora: Date,
  ): Promise<IntencionDePago | null> {
    const pendientes = [...this.intenciones.values()].filter(
      (intencion) =>
        intencion.postulacionId === postulacionId && intencion.estado === 'PENDIENTE',
    )

    // El Map conserva el orden de inserción: la última creada es la más nueva.
    for (let indice = pendientes.length - 1; indice >= 0; indice -= 1) {
      const pendiente = pendientes[indice]
      if (
        pendiente !== undefined &&
        (pendiente.expiraEl === null || pendiente.expiraEl.getTime() > ahora.getTime())
      ) {
        return { ...pendiente }
      }
    }

    return null
  }

  async marcarProcesada(params: ParamsDeMarcado): Promise<IntencionDePago | null> {
    return this.marcar(params, 'PROCESANDO')
  }

  async marcarCompletada(params: ParamsDeMarcado): Promise<IntencionDePago | null> {
    return this.marcar({ ...params, pagadoEl: params.pagadoEl ?? this.ahora() }, 'COMPLETADA')
  }

  /** Solo para fixtures y asserts de tests: no forma parte del puerto. */
  todas(): IntencionDePago[] {
    return [...this.intenciones.values()].map((intencion) => ({ ...intencion }))
  }

  private marcar(
    params: ParamsDeMarcado,
    estado: IntencionDePago['estado'],
  ): IntencionDePago | null {
    const encontrada = [...this.intenciones.values()].find((intencion) =>
      params.externalId !== undefined
        ? intencion.externalId === params.externalId
        : intencion.paymentIdMp === params.paymentIdMp,
    )
    if (!encontrada) return null

    const actualizada: IntencionDePago = {
      ...encontrada,
      estado,
      paymentIdMp: params.paymentIdMp ?? encontrada.paymentIdMp,
      webhookEventId: params.webhookEventId ?? encontrada.webhookEventId,
      pagadoEl: params.pagadoEl ?? encontrada.pagadoEl,
      actualizadoEl: this.ahora(),
    }
    this.intenciones.set(actualizada.id, actualizada)

    return { ...actualizada }
  }
}
