export type EstadoIntencionDePago = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADA' | 'EXPIRADA' | 'CANCELADA'

export interface IntencionDePago {
  id: string
  postulacionId: string
  periodoId: string
  institucionId: string
  montoCentavos: number
  externalId: string
  preferenceId: string | null
  initPoint: string | null
  sandboxInitPoint: string | null
  estado: EstadoIntencionDePago
  paymentIdMp: string | null
  webhookEventId: string | null
  pagadoEl: Date | null
  creadoEl: Date
  actualizadoEl: Date
  expiraEl: Date | null
}

export interface CrearIntencionDePago {
  postulacionId: string
  periodoId: string
  institucionId: string
  montoCentavos: number
  externalId: string
  preferenceId?: string | null
  initPoint?: string | null
  sandboxInitPoint?: string | null
  expiraEl?: Date | null
}

export interface RepositorioDeIntencionesDePago {
  crear(intencion: CrearIntencionDePago): Promise<IntencionDePago>
  obtenerPorExternalId(externalId: string): Promise<IntencionDePago | null>
  obtenerPorPaymentIdMp(paymentIdMp: string): Promise<IntencionDePago | null>
  /**
   * La intención PENDIENTE más reciente de la Postulación que todavía no venció.
   *
   * Sirve para que un reintento reutilice la preferencia ya creada en lugar de
   * generar otra: si el aspirante abandonó el checkout y vuelve a tocar el
   * botón, no tiene que pagar dos veces.
   */
  obtenerPendientePorPostulacion(
    postulacionId: string,
    ahora: Date,
  ): Promise<IntencionDePago | null>
  marcarProcesada(params: { externalId?: string; paymentIdMp?: string; webhookEventId?: string; pagadoEl?: Date }): Promise<IntencionDePago | null>
  marcarCompletada(params: { externalId?: string; paymentIdMp: string; webhookEventId?: string; pagadoEl?: Date }): Promise<IntencionDePago | null>
}