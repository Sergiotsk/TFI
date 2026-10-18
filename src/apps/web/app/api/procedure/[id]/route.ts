import { NextResponse } from 'next/server'
import { repositorioDeProcedure } from '@/composition-root'

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  const procedure = await repositorioDeProcedure.obtenerPorId(id)

  if (!procedure) {
    return NextResponse.json(
      { success: false, error: 'Procedure not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: procedure })
}
