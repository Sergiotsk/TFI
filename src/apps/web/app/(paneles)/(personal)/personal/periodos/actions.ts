'use server'

import { revalidatePath } from 'next/cache'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../../sesion-de-panel'
import { leerCambiosDePeriodo, leerNuevoPeriodo } from './esquemas'

const RUTAS_AFECTADAS = ['/personal/periodos', '/personal/postulaciones']

// Dirección da de alta un período. Las reglas (solo Dirección, cierre en el futuro, nombre único en la
// institución) las deciden CrearPeriodo y la base; la institución es la del actor.
export async function crearPeriodoAccion(_anterior: EstadoDeAccion, datos: FormData): Promise<EstadoDeAccion> {
  const lectura = leerNuevoPeriodo(datos)
  if (!lectura.ok) return { ok: false, mensaje: lectura.mensaje }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ crearPeriodo }, actor) => {
      const periodo = await crearPeriodo.ejecutar(actor, lectura.datos)
      return `Período "${periodo.nombre}" creado.`
    }),
  )
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta)

  return estado
}

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
