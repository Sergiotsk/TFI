'use server'

import { revalidatePath } from 'next/cache'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../../sesion-de-panel'
import { leerCambiosDePeriodo } from './esquemas'

const RUTAS_AFECTADAS = ['/personal/periodos', '/personal/postulaciones']

// Dirección edita un período. Las reglas (solo Dirección, cupos no menores a los confirmados, cierre no en el
// pasado) las decide ModificarPeriodo; RLS lo vuelve a exigir en la base.
export async function modificarPeriodoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const lectura = leerCambiosDePeriodo(datos)
  if (!lectura.ok) return { ok: false, mensaje: lectura.mensaje }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ modificarPeriodo }, actor) => {
      const periodo = await modificarPeriodo.ejecutar(actor, lectura.id, lectura.cambios)
      return `Período "${periodo.nombre}" actualizado.`
    }),
  )
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta)

  return estado
}
