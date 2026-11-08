import type { Monto } from '@tfi/domain'

export interface PreferenciaPago {
  externalId: string
  postulacionId: string
  titulo: string
  descripcion?: string
  monto: Monto
  moneda?: string
  backUrls: {
    success: string
    pending: string
    failure: string
  }
  notificationUrl: string
  expiresAt?: Date
}

export interface PreferenciaCreada {
  preferenceId: string
  initPoint: string
  sandboxInitPoint?: string
}

export type EstadoPagoPasarela =
  | 'approved'
  | 'authorized'
  | 'pending'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

export interface DatosPagoPasarela {
  paymentId: string
  status: EstadoPagoPasarela
  statusDetail?: string
  externalReference?: string
  transactionAmountCentavos?: number
  currencyId?: string
  payerEmail?: string
  dateApproved?: Date
  dateCreated?: Date
  dateLastUpdated?: Date
}

export interface PasarelaDePago {
  crearPreferencia(preferencia: PreferenciaPago): Promise<PreferenciaCreada>
  obtenerPago(paymentId: string): Promise<DatosPagoPasarela>
}