export type ProveedorDePago = 'INFORME_SYSADMIN' | 'PAGOS360'

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
