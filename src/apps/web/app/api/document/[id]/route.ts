import { NextResponse } from 'next/server'
import { repositorioDeDocument } from '@/composition-root'

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const document = await repositorioDeDocument.obtenerPorId(id)

  if (!document) {
    return NextResponse.json(
      { success: false, error: 'Document not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: document })
}
