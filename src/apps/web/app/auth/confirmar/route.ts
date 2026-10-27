import { NextResponse, type NextRequest } from 'next/server'
import type { TipoDeEnlaceDeEmail } from '@tfi/application'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { urlBaseDeLaApp } from '@/lib/url-de-app'

/** Tipos de enlace que Supabase puede mandar por email y que sabemos canjear. */
const TIPOS_DE_ENLACE: readonly TipoDeEnlaceDeEmail[] = [
  'recovery',
  'signup',
  'invite',
  'magiclink',
  'email',
]

function esTipoDeEnlace(valor: string): valor is TipoDeEnlaceDeEmail {
  return (TIPOS_DE_ENLACE as readonly string[]).includes(valor)
}

/**
 * `GET /auth/confirmar` → canjea el enlace del email por una sesión.
 *
 * Es el `redirectTo` de los emails de Supabase (confirmación de cuenta y
 * recuperación de contraseña). Acepta las dos formas del enlace:
 * - `?code=` del flujo PKCE (el verificador está en una cookie del navegador
 *   que pidió el enlace);
 * - `?token_hash=&type=` si la plantilla del email usa `{{ .TokenHash }}`.
 *
 * El destino es fijo según `destino=recuperar`, no sale de la URL: así el
 * endpoint no se puede usar como redirect abierto.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const codigo = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const tipo = searchParams.get('type')
  const esRecuperacion = searchParams.get('destino') === 'recuperar'

  const supabase = await crearCliente()
  const { confirmarEnlaceDeEmail } = crearDependencias(supabase)

  let confirmado = false

  if (codigo) {
    confirmado = await confirmarEnlaceDeEmail.ejecutar({ tipo: 'CODIGO', codigo })
  } else if (tokenHash && tipo && esTipoDeEnlace(tipo)) {
    confirmado = await confirmarEnlaceDeEmail.ejecutar({
      tipo: 'TOKEN',
      tokenHash,
      tipoDeEnlace: tipo,
    })
  }

  const destino = confirmado
    ? esRecuperacion
      ? '/recuperar-contrasena/nueva'
      : '/panel'
    : esRecuperacion
      ? '/recuperar-contrasena?error=enlace'
      : '/login?error=enlace'

  return NextResponse.redirect(new URL(destino, urlBaseDeLaApp()))
}
