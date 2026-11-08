import type { CargaDeInforme, ResumenDeCarga } from '@tfi/domain'

/**
 * Las cargas del informe de pagos que hace Tesorería.
 *
 * - `iniciar` abre la carga con el resumen en cero; los pagos de esa carga la
 *   referencian por id.
 * - `cerrar` guarda el resumen final.
 * - `listar` devuelve las cargas de la institución, de la más reciente a la más vieja.
 */
export interface RegistroDeCargas {
  iniciar(institucionId: string, cargadaPor: string, nombreArchivo: string): Promise<CargaDeInforme>
  cerrar(cargaId: string, resumen: ResumenDeCarga): Promise<void>
  listar(institucionId: string): Promise<CargaDeInforme[]>
}
