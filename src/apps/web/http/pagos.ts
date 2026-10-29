import type { CargaDeInforme, Pago } from '@tfi/domain'

/** Un pago como lo ve la API y la bandeja: datos planos, sin los value objects del dominio. */
export interface PagoPresentado {
  id: string
  proveedor: string
  referencia: string
  montoCentavos: number
  pagadoEl: string
  registradoEl: string
  estado: Pago['estado']
  motivoRevision: string | null
  motivoNoImputado: string | null
  postulacionId: string | null
  cargaId: string | null
  dniInformado: string | null
  numeroInformado: number | null
}

export function presentarPago(pago: Pago): PagoPresentado {
  return {
    id: pago.id,
    proveedor: pago.referencia.proveedor,
    referencia: pago.referencia.referenciaExterna,
    montoCentavos: pago.monto.centavos,
    pagadoEl: pago.pagadoEl.toISOString(),
    registradoEl: pago.registradoEl.toISOString(),
    estado: pago.estado,
    motivoRevision: pago.motivoRevision ?? null,
    motivoNoImputado: pago.motivoNoImputado ?? null,
    postulacionId: pago.postulacionId ?? null,
    cargaId: pago.cargaId ?? null,
    dniInformado: pago.dniInformado?.valor ?? null,
    numeroInformado: pago.numeroInformado?.valor ?? null,
  }
}

export interface CargaPresentada {
  id: string
  nombreArchivo: string
  cargadaEl: string
  cargadaPor: string
  acreditados: number
  aDecidir: number
  noImputados: number
  duplicados: number
}

export function presentarCarga(carga: CargaDeInforme): CargaPresentada {
  return {
    id: carga.id,
    nombreArchivo: carga.nombreArchivo,
    cargadaEl: carga.cargadaEl.toISOString(),
    cargadaPor: carga.cargadaPor,
    ...carga.resumen,
  }
}
