import { NextRequest, NextResponse } from 'next/server'
import { repositorioDeDocument } from '../../../composition-root'
import { Document } from '../../../../../packages/domain/document/document'

export const GET = async (req: NextRequest) => {
  const procedure = req.nextUrl.searchParams.get('procedureId')

  const documents = procedure
    ? await repositorioDeDocument.obtenerPorProcedure(procedure)
    : await repositorioDeDocument.obtenerTodos()

  return NextResponse.json({ success: true, data: documents })
}

export const POST = async (request: Request) => {
  const body = await request.json()
  const newDocument = new Document(
    String(Date.now()),
    body.procedureId,
    body.rute,
    body.validity,
  )
  await repositorioDeDocument.guardar(newDocument)
  return NextResponse.json(
    { success: true, data: newDocument },
    { status: 201 },
  )
}
