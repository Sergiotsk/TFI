import { NextResponse, type NextRequest } from 'next/server'
import {
  crearClienteSupabase,
  type AlmacenDeCookies,
} from '@tfi/infrastructure/supabase/servidor'
import { leerEntorno } from '@/config/entorno'
import { redireccionValida } from '@/lib/redireccion'

const RUTAS_PROTEGIDAS_POR_PREFIJO = ['/panel']

function esRutaProtegida(pathname: string): boolean {
  return RUTAS_PROTEGIDAS_POR_PREFIJO.some((prefijo) => pathname.startsWith(prefijo))
}

export async function proxy(request: NextRequest) {
  const entorno = leerEntorno()

  // Las cookies que Supabase escribe (refresh del token) se acumulan aca y se
  // aplican al final, sobre la respuesta.
  const cookiesActualizadas: { name: string; value: string; options: object }[] = []

  const almacen: AlmacenDeCookies = {
    getAll: () => request.cookies.getAll(),
    setAll: (nuevas) => {
      cookiesActualizadas.push(...nuevas)
    },
  }

  const supabase = crearClienteSupabase(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    almacen,
  )

  // Una sola llamada: la misma sesion sirve para refrescar el token y para
  // decidir si la ruta esta protegida.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (esRutaProtegida(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    const redirect = request.nextUrl.pathname + request.nextUrl.search
    if (redireccionValida(redirect)) {
      loginUrl.searchParams.set('redirect', redirect)
    }
    return NextResponse.redirect(loginUrl)
  }

  for (const { name, value } of cookiesActualizadas) {
    request.cookies.set(name, value)
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  for (const { name, value, options } of cookiesActualizadas) {
    response.cookies.set({ name, value, ...options })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
