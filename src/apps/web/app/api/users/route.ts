import { NextRequest, NextResponse } from 'next/server'
import { repositorioDeUsuarios } from '@/composition-root'
import { User } from '@tfi/domain'

export const GET = async (req: NextRequest) => {
  const role = req.nextUrl.searchParams.get('role')

  const users = role
    ? await repositorioDeUsuarios.obtenerPorRol(role)
    : await repositorioDeUsuarios.obtenerTodos()

  return NextResponse.json({ success: true, data: users })
}

export const POST = async (request: Request) => {
  const body = await request.json()
  const newUser = new User(
    String(Date.now()),
    body.name,
    body.lastname,
    body.email,
    body.password,
    body.dni,
    body.cuil,
    new Date(body.birthdate),
    body.sex,
    body.phone,
    body.address,
    body.role,
    body.timestamp,
    body.verified,
  )
  await repositorioDeUsuarios.guardar(newUser)
  return NextResponse.json({ success: true, data: newUser }, { status: 201 })
}
