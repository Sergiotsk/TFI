import { describe } from 'vitest'
import { probarContratoDeAlmacenDeArchivos } from '@tfi/application/contratos'
import { AlmacenDeArchivosSupabase } from './almacen-de-archivos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { clienteDeServicio } from './prueba/entorno'

/**
 * Contrato del almacén contra el bucket privado `documentos` de Supabase.
 *
 * Usa la clave de servicio: el objetivo es verificar subida, URL firmada y
 * borrado. Las policies de Storage por rol se cubren en el smoke manual.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: AlmacenDeArchivos contra Supabase',
  () => {
    probarContratoDeAlmacenDeArchivos(
      () => new AlmacenDeArchivosSupabase(clienteDeServicio()),
    )
  },
)
