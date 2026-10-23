import type { CargaDeInforme, PagoInformado, ResumenDeCarga } from '@tfi/domain'
import type { RegistroDeCargas } from '../puertos/registro-de-cargas/puerto'
import type { AcreditarPagoUseCase } from './acreditar-pago'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { SolicitudInvalida } from './errores'

/** Qué pasó con cada fila. `ERROR` es una fila que hay que reprocesar (la idempotencia lo hace seguro). */
export interface FilaImportada {
  referencia: string
  resultado: 'ACREDITADO' | 'A_DECIDIR' | 'NO_IMPUTADO' | 'DUPLICADO' | 'ERROR'
  motivo?: string
}

export interface ResultadoDeImportacion {
  carga: CargaDeInforme
  resumen: ResumenDeCarga
  filas: FilaImportada[]
  conError: number
}

/**
 * Importa el informe de pagos del día (US1).
 *
 * Abre una carga, acredita cada fila con `AcreditarPago` y cierra la carga con
 * el resumen. Las filas van de a una: dos filas del mismo informe pueden
 * competir por el último cupo, y el orden del informe decide. Una fila que
 * falla no corta el resto; queda como `ERROR` para reprocesar.
 *
 * Recibe las filas ya leídas: el formato del archivo es asunto del adaptador
 * que lo lee.
 */
export class ImportarInformeDePagosUseCase {
  constructor(
    private readonly cargas: RegistroDeCargas,
    private readonly acreditarPago: AcreditarPagoUseCase,
  ) {}

  async ejecutar(actor: Actor, nombreArchivo: string, pagos: readonly PagoInformado[]): Promise<ResultadoDeImportacion> {
    exigirRol(actor, 'TESORERIA')
    if (pagos.length === 0) throw new SolicitudInvalida('El informe no tiene pagos')

    const carga = await this.cargas.iniciar(actor.institucionId, actor.perfilId, nombreArchivo)
    const resumen = { acreditados: 0, aDecidir: 0, noImputados: 0, duplicados: 0 }
    const filas: FilaImportada[] = []

    for (const pago of pagos) {
      const referencia = pago.referencia.referenciaExterna
      try {
        const { resultado, pago: registrado } = await this.acreditarPago.ejecutar(actor, pago, carga.id)
        filas.push({ referencia, resultado, motivo: registrado.motivoNoImputado ?? registrado.motivoRevision })

        if (resultado === 'ACREDITADO') resumen.acreditados += 1
        else if (resultado === 'A_DECIDIR') resumen.aDecidir += 1
        else if (resultado === 'NO_IMPUTADO') resumen.noImputados += 1
        else resumen.duplicados += 1
      } catch (error) {
        filas.push({
          referencia,
          resultado: 'ERROR',
          motivo: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    await this.cargas.cerrar(carga.id, resumen)

    return {
      carga: carga.conResumen(resumen),
      resumen,
      filas,
      conError: filas.filter((f) => f.resultado === 'ERROR').length,
    }
  }
}
