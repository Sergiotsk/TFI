import { describe } from 'vitest'
import { probarContratoRepositorioDeDocumentos } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { prepararEntornoDeDocumentos } from './prueba/entorno'

/**
 * Contrato del adaptador de documentos contra Supabase.
 *
 * Cada documento se asocia a una Postulación real porque la tabla tiene FK y
 * los ids son UUID. La suite usa la clave de servicio: verifica el mapeo y las
 * restricciones de la base, no RLS.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: RepositorioDeDocumentos contra Supabase',
  () => {
    probarContratoRepositorioDeDocumentos(prepararEntornoDeDocumentos)
  },
)
