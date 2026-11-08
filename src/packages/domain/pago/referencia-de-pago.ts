// MANUAL: el personal acreditó a mano un pago verificado fuera del sistema (ADR 0009).
// MERCADOPAGO: pago online de la demo/MVP (ADR-0012); no es la pasarela de producción.
export const PROVEEDORES_DE_PAGO = ['INFORME_SYSADMIN', 'PAGOS360', 'MANUAL', 'MERCADOPAGO'] as const

export type ProveedorDePago = (typeof PROVEEDORES_DE_PAGO)[number]

// El par (proveedor, referenciaExterna) identifica un pago de forma única: es la base de la idempotencia.
export class ReferenciaDePago {
  constructor(
    readonly proveedor: ProveedorDePago,
    readonly referenciaExterna: string,
  ) {
    if (referenciaExterna.trim() === '') {
      throw new Error('La referencia externa del pago no puede estar vacía.')
    }
  }

  igualA(otra: ReferenciaDePago): boolean {
    return this.proveedor === otra.proveedor && this.referenciaExterna === otra.referenciaExterna
  }
}
