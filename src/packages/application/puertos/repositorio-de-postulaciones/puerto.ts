import type {
  EstadoPostulacion,
  MotivoRevision,
  NumeroDePostulacion,
  Postulacion,
} from '@tfi/domain'
import type { Pagina, Paginacion } from '../../paginacion'

/**
 * Filtros de lectura. `estado` filtra por el estado **persistido**, no por el
 * efectivo: una Postulación en `PAGO_PENDIENTE` con el plazo vencido se sigue
 * listando como `PAGO_PENDIENTE` hasta que alguien persista el `VENCIDO`.
 */
export interface FiltrosDePostulacion {
  aspiranteId?: string
  periodoId?: string
  estado?: EstadoPostulacion
  motivoRevision?: MotivoRevision
}

/**
 * Puerta de acceso a las Postulaciones.
 *
 * - `crear` asigna id y número, y deja la Postulación en `PREINSCRIPTO`.
 * - `guardarTransicion` es concurrencia optimista: escribe solo si el estado
 *   persistido sigue siendo `antes.estado`. Si no, devuelve `'conflicto'` y no
 *   toca nada. Solo sirve para las transiciones que la base permite escribir
 *   directo (`iniciarPago` y la persistencia de `VENCIDO`); las demás van por
 *   las RPC de acreditación y decisión.
 * - `buscarPorDni` busca en el perfil del aspirante, no en la Postulación, y
 *   devuelve cualquier estado (no solo las pendientes).
 * - `listar` y `buscarPorDni` paginan en la base.
 */
export interface RepositorioDePostulaciones {
  obtenerPorId(id: string): Promise<Postulacion | null>
  obtenerPorNumero(numero: NumeroDePostulacion): Promise<Postulacion | null>
  listar(
    filtros: FiltrosDePostulacion,
    paginacion: Paginacion,
  ): Promise<Pagina<Postulacion>>
  buscarPorDni(
    dni: string,
    paginacion: Paginacion,
    periodoId?: string,
  ): Promise<Pagina<Postulacion>>
  crear(aspiranteId: string, periodoId: string): Promise<Postulacion>
  guardarTransicion(antes: Postulacion, despues: Postulacion): Promise<'ok' | 'conflicto'>
}
