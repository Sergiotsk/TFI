import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { Documento } from '@tfi/domain'
import { probarContratoRepositorioDeDocumentos } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import {
  clienteDeServicio,
  prepararEntornoDeDocumentos,
  prepararEntornoDeDocumentosConSesion,
} from './prueba/entorno'
import { AlmacenDeArchivosSupabase } from './almacen-de-archivos'
import { RepositorioDeDocumentosSupabase } from './repositorio-de-documentos'

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

function aprobado(documento: Documento, revisadoPor: string): Documento {
  return new Documento(
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
    revisadoPor,
    documento.creadoEl,
    null,
    documento.creadoEl,
    documento.actualizadoEl,
  )
}

/**
 * La base exige las reglas de SubirDocumento y EliminarDocumento aunque el
 * aspirante llame a la API de Supabase directo, con su sesión y la clave pública.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'RLS de documentos: lo que el aspirante no puede hacer por fuera de la app',
  () => {
    it('no sube un documento ya aprobado', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = aprobado(
        documentoSubido(entorno.postulacionId, entorno.aspiranteId),
        entorno.personalId,
      )

      await expect(entorno.delAspirante.guardar(documento)).rejects.toThrow()
      expect(await entorno.delPersonal.obtenerPorId(documento.id)).toBeNull()
    })

    it('no sube documentos a nombre de otra persona', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = documentoSubido(entorno.postulacionId, entorno.personalId)

      await expect(entorno.delAspirante.guardar(documento)).rejects.toThrow()
    })

    it('no sube documentos si la Postulación no está en la etapa de documentación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion('PAGO_PENDIENTE')
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)

      await expect(entorno.delAspirante.guardar(documento)).rejects.toThrow()
    })

    it('no sube documentos después de la validación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion('DOCUMENTACION_VALIDADA')
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)

      await expect(entorno.delAspirante.guardar(documento)).rejects.toThrow()
    })

    it('no borra documentos después de la validación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion('DOCUMENTACION_VALIDADA')
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)
      await new RepositorioDeDocumentosSupabase(clienteDeServicio()).guardar(documento)

      await entorno.delAspirante.eliminar(documento.id)

      expect(await entorno.delPersonal.obtenerPorId(documento.id)).not.toBeNull()
    })

    it('no borra un documento aprobado aunque la documentación siga abierta', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = aprobado(
        documentoSubido(entorno.postulacionId, entorno.aspiranteId),
        entorno.personalId,
      )
      await new RepositorioDeDocumentosSupabase(clienteDeServicio()).guardar(documento)

      await entorno.delAspirante.eliminar(documento.id)

      expect(await entorno.delPersonal.obtenerPorId(documento.id)).not.toBeNull()
    })

    it('borra los propios mientras la documentación está abierta', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const documento = documentoSubido(entorno.postulacionId, entorno.aspiranteId)
      await entorno.delAspirante.guardar(documento)

      await entorno.delAspirante.eliminar(documento.id)

      expect(await entorno.delPersonal.obtenerPorId(documento.id)).toBeNull()
    })
  },
)

const ARCHIVO_DE_PRUEBA = {
  contenido: new Uint8Array([37, 80, 68, 70]).buffer,
  nombreArchivo: 'dni.pdf',
  mimeType: 'application/pdf',
}

/** Las policies de Storage, con la sesión del aspirante y un archivo real. */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'RLS de los archivos de documentos: lo que el aspirante no puede hacer',
  () => {
    function rutaDe(entorno: { institucionId: string; postulacionId: string }): string {
      return `${entorno.institucionId}/${entorno.postulacionId}/${randomUUID()}-dni.pdf`
    }

    async function existe(ruta: string): Promise<boolean> {
      return new AlmacenDeArchivosSupabase(clienteDeServicio())
        .urlFirmada(ruta, 60)
        .then(() => true)
        .catch(() => false)
    }

    async function sembrarArchivo(
      entorno: Awaited<ReturnType<typeof prepararEntornoDeDocumentosConSesion>>,
      estado: 'PENDIENTE' | 'APROBADO',
    ): Promise<string> {
      const ruta = rutaDe(entorno)
      await new AlmacenDeArchivosSupabase(clienteDeServicio()).subir(ruta, ARCHIVO_DE_PRUEBA)
      const base = documentoSubido(entorno.postulacionId, entorno.aspiranteId)
      const conRuta = new Documento(
        base.id,
        base.postulacionId,
        base.tipo,
        ruta,
        base.nombreArchivo,
        base.mimeType,
        base.tamanioBytes,
        base.vigencia,
        'PENDIENTE',
        base.subidoPor,
        null,
        null,
        null,
        base.creadoEl,
        base.actualizadoEl,
      )
      await new RepositorioDeDocumentosSupabase(clienteDeServicio()).guardar(
        estado === 'APROBADO' ? aprobado(conRuta, entorno.personalId) : conRuta,
      )
      return ruta
    }

    it('no sube archivos después de la validación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion('DOCUMENTACION_VALIDADA')

      await expect(
        entorno.almacenDelAspirante.subir(rutaDe(entorno), ARCHIVO_DE_PRUEBA),
      ).rejects.toThrow()
    })

    it('no sube archivos antes de la etapa de documentación', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion('PAGO_PENDIENTE')

      await expect(
        entorno.almacenDelAspirante.subir(rutaDe(entorno), ARCHIVO_DE_PRUEBA),
      ).rejects.toThrow()
    })

    it('sube archivos con la documentación abierta', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const ruta = rutaDe(entorno)

      await entorno.almacenDelAspirante.subir(ruta, ARCHIVO_DE_PRUEBA)

      expect(await existe(ruta)).toBe(true)
    })

    it('no borra el archivo de un documento aprobado', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const ruta = await sembrarArchivo(entorno, 'APROBADO')

      await entorno.almacenDelAspirante.eliminar(ruta)

      expect(await existe(ruta)).toBe(true)
    })

    it('borra el archivo de un documento pendiente', async () => {
      const entorno = await prepararEntornoDeDocumentosConSesion()
      const ruta = await sembrarArchivo(entorno, 'PENDIENTE')

      await entorno.almacenDelAspirante.eliminar(ruta)

      expect(await existe(ruta)).toBe(false)
    })
  },
)
