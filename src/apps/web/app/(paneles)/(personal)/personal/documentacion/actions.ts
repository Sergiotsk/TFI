'use server'

import { revalidatePath } from 'next/cache'
import { esquemaParametrosDeDocumento, esquemaRevisionDeDocumento } from '@/http/esquemas/documentos'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../../sesion-de-panel'

const MENSAJES = {
  APROBADO: 'Documento aprobado.',
  OBSERVADO: 'Documento observado: el aspirante va a ver el motivo.',
  PENDIENTE: 'Documento vuelto a pendiente.',
} as const

// Revisión de un documento (RevisarDocumento): aprobar u observar con motivo. La etapa de la Postulación la
// recalcula el caso de uso.
export async function revisarDocumentoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const id = esquemaParametrosDeDocumento.safeParse({ id: datos.get('id') })
  const revision = esquemaRevisionDeDocumento.safeParse({
    estado: datos.get('estado'),
    observaciones: datos.get('observaciones') || undefined,
  })
  if (!id.success) return { ok: false, mensaje: id.error.issues[0]?.message ?? 'Dato inválido' }
  if (!revision.success) {
    return { ok: false, mensaje: revision.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ revisarDocumento }, actor) => {
      await revisarDocumento.ejecutar(actor, id.data.id, revision.data)
      return MENSAJES[revision.data.estado]
    }),
  )
  revalidatePath('/personal/documentacion')

  return estado
}
