import { cookies } from 'next/headers'
import { crearClienteSupabase } from '@tfi/infrastructure/supabase/servidor'

export async function crearCliente() {
  const cookieStore = await cookies()
  // @ts-expect-error - Next.js cookies overload vs supabase types
  return crearClienteSupabase(cookieStore)
}
