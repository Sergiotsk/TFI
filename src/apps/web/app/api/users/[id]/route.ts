import { NextResponse } from 'next/server'
import { repositorioDePerfiles } from '@/composition-root'

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const perfil = await repositorioDePerfiles.obtenerPorId(id)

  if (!perfil) {
    return NextResponse.json(
      { success: false, error: 'Perfil not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: perfil })
}
