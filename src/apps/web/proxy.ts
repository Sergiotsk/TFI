
import { NextResponse, type NextRequest } from 'next/server'
import { crearClienteSupabase } from '@tfi/infrastructure/supabase/servidor'

const RUTAS_PROTEGIDAS_POR_PREFIJO = ['/panel']

function esRutaProtegida(pathname: string): boolean {
  return RUTAS_PROTEGIDAS_POR_PREFIJO.some((prefijo) => pathname.startsWith(prefijo))
}

function redireccionValida(destino: string): boolean {
  if (!destino.startsWith('/')) return false
  if (destino.startsWith('//')) return false
  return true
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const cookieStore = {
    getAll() {
      return request.cookies.getAll()
    },
    set(name: string, value: string, options?: { path?: string; domain?: string; maxAge?: number; expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' }) {
      request.cookies.set({ name, value, ...(options ?? {}) })
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      response.cookies.set({ name, value, ...(options ?? {}) })
    },
    delete(name: string, options?: { path?: string; domain?: string }) {
      request.cookies.delete(name)
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      response.cookies.delete({ name, ...(options ?? {}) })
    },
  }

  const supabase = crearClienteSupabase(cookieStore)
  await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (esRutaProtegida(pathname)) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      const redirect = request.nextUrl.pathname + request.nextUrl.search
      if (redireccionValida(redirect)) {
        loginUrl.searchParams.set('redirect', redirect)
      }
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
