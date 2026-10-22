export type ResolucionDeDireccion = 'ACEPTAR' | 'RECHAZAR'

// Decisión de Dirección sobre un pago A_DECIDIR (fuera de plazo o sin cupo). Una decisión por pago.
export class DecisionDeDireccion {
  constructor(
    readonly id: string,
    readonly pagoId: string,
    readonly decision: ResolucionDeDireccion,
    /** Perfil DIRECCION que decidió. */
    readonly decididaPor: string,
    readonly decididaEl: Date,
    readonly comentario?: string,
  ) {}
}
