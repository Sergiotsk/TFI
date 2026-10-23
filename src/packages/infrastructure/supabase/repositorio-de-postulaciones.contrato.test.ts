import { describe } from 'vitest'
import { probarContratoDeRepositorioDePostulaciones } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { prepararEntornoDePostulaciones } from './prueba/entorno'

/**
 * El mismo contrato que corre contra el fake, pero contra la base de verdad.
 *
 * Requiere `SUPABASE_TEST_URL` y `SUPABASE_TEST_SERVICE_ROLE_KEY`: los fixtures
 * (períodos, aspirantes y Postulaciones sembradas) se arman con la clave de
 * servicio. RLS y el trigger guardián se cubren en las migraciones y el smoke.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: RepositorioDePostulaciones contra Supabase',
  () => {
    probarContratoDeRepositorioDePostulaciones(prepararEntornoDePostulaciones)
  },
)
