import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { Documento } from '@tfi/domain'
import { probarContratoRepositorioDeDocumentos } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import {
  prepararEntornoDeDocumentos,
  prepararEntornoDeDocumentosConSesion,
} from './prueba/entorno'

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

function documentoSubido(postulacionId: string, aspiranteId: string): Documento {
  const ahora = new Date()
  const id = randomUUID()
  return new Documento(
    id,
    postulacionId,
    'DNI',
    `${postulacionId}/${id}.pdf`,
    'dni.pdf',
    'application/pdf',
    2048,
    365,
    'PENDIENTE',
    aspiranteId,
    null,
    null,
    null,
    ahora,
    ahora,
  )
}

/**
 * Con sesiones reales: `authenticated` tiene permisos por columna sobre
 * `documentos` (sin UPDATE de `id`), así que `guardar()` no puede pedir más que eso.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'RepositorioDeDocumentosSupabase con la sesión del usuario',
  () => {
    it('el aspirante sube un documento a su Postulación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)

      await entorno.delAspirante.guardar(documento)

      const guardado = await entorno.delAspirante.obtenerPorId(documento.id)
      expect(guardado?.estado).toBe('PENDIENTE')
      expect(guardado?.subidoPor).toBe(entorno.aspiranteId)
    })

    it('Secretaría revisa un documento de su institución', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)
      await entorno.delAspirante.guardar(documento)

      const revisadoEl = new Date()
      await entorno.delPersonal.guardar(
        new Documento(
          documento.id,
          documento.postulacionId,
          documento.tipo,
          documento.ruta,
          documento.nombreArchivo,
          documento.mimeType,
          documento.tamanioBytes,
          documento.vigencia,
          'APROBADO',
          documento.subidoPor,
          entorno.personalId,
          revisadoEl,
          null,
          documento.creadoEl,
          revisadoEl,
        ),
      )

      const revisado = await entorno.delPersonal.obtenerPorId(documento.id)
      expect(revisado?.estado).toBe('APROBADO')
      expect(revisado?.revisadoPor).toBe(entorno.personalId)
    })
  },
)
