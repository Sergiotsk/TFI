import type { Dni } from '../perfil/dni'
import type { MotivoDeRevision } from '../postulacion/estados'
import type { NumeroDePostulacion } from '../postulacion/numero-de-postulacion'
import type { Monto } from './monto'
import type { ReferenciaDePago } from './referencia-de-pago'

export const ESTADOS_DE_PAGO = ['ACREDITADO', 'NO_IMPUTADO', 'A_DECIDIR', 'DEVUELTO'] as const

export type EstadoDePago = (typeof ESTADOS_DE_PAGO)[number]

export const MOTIVOS_NO_IMPUTADO = [
  'REFERENCIA_DESCONOCIDA',
  'AMBIGUA',
  'DNI_NO_COINCIDE',
  'MONTO_INSUFICIENTE',
  'YA_TIENE_PAGO',
  'SIN_PAGO_INICIADO',
] as const

export type MotivoNoImputado = (typeof MOTIVOS_NO_IMPUTADO)[number]

/** Un pago tal como llega de afuera (informe de SysAdmin o Pagos360), ya validado en el borde. */
export interface PagoInformado {
  readonly referencia: ReferenciaDePago
  readonly monto: Monto
  readonly pagadoEl: Date
  readonly dni?: Dni
  readonly numero?: NumeroDePostulacion
}

export interface DatosOpcionalesDePago {
  readonly motivoRevision?: MotivoDeRevision
  readonly motivoNoImputado?: MotivoNoImputado
  readonly postulacionId?: string
  readonly cargaId?: string
  readonly dniInformado?: Dni
  readonly numeroInformado?: NumeroDePostulacion
}

// Un pago registrado. Las combinaciones válidas de estado, motivo y postulación son las de los CHECK del esquema.
export class Pago {
  readonly motivoRevision?: MotivoDeRevision
  readonly motivoNoImputado?: MotivoNoImputado
  readonly postulacionId?: string
  readonly cargaId?: string
  readonly dniInformado?: Dni
  readonly numeroInformado?: NumeroDePostulacion

  constructor(
    readonly id: string,
    readonly referencia: ReferenciaDePago,
    readonly monto: Monto,
    readonly pagadoEl: Date,
    readonly registradoEl: Date,
    readonly estado: EstadoDePago,
    opcionales: DatosOpcionalesDePago = {},
  ) {
    const { motivoRevision, motivoNoImputado, postulacionId } = opcionales

    if (monto.centavos === 0) {
      throw new Error('Un pago debe tener un monto mayor a 0 centavos.')
    }
    if (estado !== 'NO_IMPUTADO' && postulacionId === undefined) {
      throw new Error(`Un pago ${estado} requiere postulacionId.`)
    }
    if ((estado === 'A_DECIDIR') !== (motivoRevision !== undefined)) {
      throw new Error('motivoRevision es obligatorio en A_DECIDIR y solo se admite en ese estado.')
    }
    if ((estado === 'NO_IMPUTADO') !== (motivoNoImputado !== undefined)) {
      throw new Error('motivoNoImputado es obligatorio en NO_IMPUTADO y solo se admite en ese estado.')
    }

    this.motivoRevision = motivoRevision
    this.motivoNoImputado = motivoNoImputado
    this.postulacionId = postulacionId
    this.cargaId = opcionales.cargaId
    this.dniInformado = opcionales.dniInformado
    this.numeroInformado = opcionales.numeroInformado
  }
}
