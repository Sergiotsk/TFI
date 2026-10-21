'use server'

import { redirect } from 'next/navigation'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearCliente()
  const { cerrarSesion: casoDeCierreDeSesion } = crearDependencias(supabase)
  await casoDeCierreDeSesion.ejecutar()
  redirect('/login')
}
