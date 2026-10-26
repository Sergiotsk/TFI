import { NextResponse } from 'next/server'
import { esquemaParametrosDeDocumento } from '@/http/esquemas/documentos'
import { conActorDePanel } from '../../../../sesion-de-panel'
import type { DocumentoConUrl } from '@tfi/application'

// Abre el archivo de un documento: ConsultarDocumento valida el acceso y firma una URL de corta duración
// (el bucket es privado).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = esquemaParametrosDeDocumento.safeParse(await params)
  if (!id.success) return new NextResponse('Documento inválido', { status: 400 })

  const { urlFirmada } = await conActorDePanel<DocumentoConUrl>(({ consultarDocumento }, actor) =>
    consultarDocumento.ejecutar(actor, id.data.id),
  )

  return NextResponse.redirect(urlFirmada)
}
