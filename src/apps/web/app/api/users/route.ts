import { NextRequest, NextResponse } from 'next/server'
import { repositorioDePerfiles } from '@/composition-root'

export const GET = async (req: NextRequest) => {
  const rol = req.nextUrl.searchParams.get('rol')

  const perfiles = rol
    ? await repositorioDePerfiles.obtenerPorRol(rol)
    : await repositorioDePerfiles.obtenerTodos()

  return NextResponse.json({ success: true, data: perfiles })
}

// No hay POST: el perfil lo crea el trigger crear_perfil_al_registrarse, en la
// misma transacción que el usuario de Supabase Auth. La app no inserta en
// public.perfiles (ADR-0004 y migración 20261021000300).
