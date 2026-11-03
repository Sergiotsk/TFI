import { describe } from 'vitest'
import { probarContratoDeRepositorioDeIntencionesDePago } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { prepararEntornoDeIntenciones } from './prueba/entorno'

/**
 * El mismo contrato que corre contra el fake, pero contra la base de verdad.
 *
 * Requiere `SUPABASE_TEST_URL` y `SUPABASE_TEST_SERVICE_ROLE_KEY`: la
 * Postulación y el período se siembran con la clave de servicio.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: RepositorioDeIntencionesDePago contra Supabase',
  () => {
    probarContratoDeRepositorioDeIntencionesDePago(prepararEntornoDeIntenciones)
  },
)
