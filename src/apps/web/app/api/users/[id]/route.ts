import { NextResponse } from 'next/server'
import { repositorioDeUsuarios } from '@/composition-root'

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const user = await repositorioDeUsuarios.obtenerPorId(id)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: user })
}
