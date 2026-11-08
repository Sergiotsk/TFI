import type { EstadoPostulacion } from '@tfi/domain'

/**
 * Resultado de mover la Postulación por el circuito de documentación.
 *
 * La RPC es la que toma el lock y valida la transición y la pertenencia. El
 * caso de uso traduce estos códigos a errores de dominio o de aplicación.
 */
export type ResultadoDeDocumentacion =
  | 'OK'
  | 'CONFLICTO'
  | 'NO_ENCONTRADA'
  | 'NO_AUTORIZADO'
  | 'TRANSICION_INVALIDA'

/**
 * Acciones sobre el estado de documentación de una Postulación.
 *
 * Son transiciones del grafo posterior a `VACANTE_CONFIRMADA`:
 * `ESPERANDO_DOCUMENTACION`, `DOCUMENTACION_EN_REVISION`, `OBSERVADO` y
 * `DOCUMENTACION_VALIDADA`. La autorización la valida la RPC (dueño para
 * iniciar la carga; Secretaría/Dirección para revisar).
 */
export interface AccionesDeDocumentacion {
  transicionar(
    postulacionId: string,
    hacia: EstadoPostulacion,
  ): Promise<ResultadoDeDocumentacion>
}
