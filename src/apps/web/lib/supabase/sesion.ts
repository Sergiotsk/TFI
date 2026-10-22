import { crearCliente } from './servidor'

/**
 * Dice si hay una sesion activa. La identidad sale de `getUser()` (que valida
 * el JWT contra el servidor de Auth), nunca del contenido de una cookie.
 */
export async function haySesion(): Promise<boolean> {
  const supabase = await crearCliente()
  const { data } = await supabase.auth.getUser()
  return Boolean(data.user)
}
