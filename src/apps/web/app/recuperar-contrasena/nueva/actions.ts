'use server'

import { redirect } from 'next/navigation'
import { NoAutorizado, SolicitudInvalida } from '@tfi/application'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaCambioDeContrasena } from '@/http/esquemas/recuperacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { textoDelCampo } from '@/lib/form-data'

export type EstadoDeCambioDeContrasena = {
  mensaje?: string
  errores?: Record<string, string>
}

export async function cambiarContrasena(
  _estado: EstadoDeCambioDeContrasena,
  datos: FormData,
): Promise<EstadoDeCambioDeContrasena> {
  const parsed = esquemaCambioDeContrasena.safeParse({
    contrasena: textoDelCampo(datos, 'contrasena'),
    confirmacion: textoDelCampo(datos, 'confirmacion'),
  })

  if (!parsed.success) {
    return {
      mensaje: 'Revisá los datos marcados',
      errores: detallesDeZod(parsed.error),
    }
  }

  const supabase = await crearCliente()
  const { cambiarContrasena: casoDeCambio } = crearDependencias(supabase)

  try {
    await casoDeCambio.ejecutar(parsed.data.contrasena)
  } catch (error) {
    // `redirect` va en el catch a propósito: tira una excepción propia y no
    // tiene que quedar adentro del try que atrapa los errores del caso de uso.
    if (error instanceof NoAutorizado) {
      redirect('/recuperar-contrasena?error=enlace')
    }
    if (error instanceof SolicitudInvalida) {
      return { mensaje: error.message }
    }
    throw error
  }

  redirect('/panel')
}
