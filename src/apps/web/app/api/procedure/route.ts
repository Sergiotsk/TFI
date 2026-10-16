import { NextRequest, NextResponse } from 'next/server'
import { repositorioDeProcedure } from '../../../composition-root'
import { Procedure } from '../../../../../packages/domain/procedure/procedure'

export const GET = async (req: NextRequest) => {
  const state = req.nextUrl.searchParams.get('state') as
    | 'INICIADO'
    | 'EN PROCESO'
    | 'APROBADO'
    | 'RECHAZADO'
    | null

  const procedures = state
    ? await repositorioDeProcedure.obtenerPorEstado(state)
    : await repositorioDeProcedure.obtenerTodos()

  return NextResponse.json({ success: true, data: procedures })
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json()

    if (!body.userId || !body.state) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan campos obligatorios: userId y state',
        },
        { status: 400 },
      )
    }

    const newProcedure = new Procedure(
      String(Date.now()),
      body.userId,
      body.state,
    )
    await repositorioDeProcedure.guardar(newProcedure)

    return NextResponse.json(
      { success: true, data: newProcedure },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud', error },
      { status: 500 },
    )
  }
}
