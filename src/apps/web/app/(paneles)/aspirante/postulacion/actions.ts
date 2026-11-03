'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { esquemaCrearPostulacion, esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../sesion-de-panel'

const RUTA = '/aspirante/postulacion'

export async function crearPostulacionAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const parsed = esquemaCrearPostulacion.safeParse({ periodoId: datos.get('periodoId') })
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ crearPostulacion }, actor) => {
      await crearPostulacion.ejecutar(actor, parsed.data.periodoId)
      return 'Postulación creada.'
    }),
  )
  revalidatePath(RUTA)

  return estado
}

// Demo: desde Requisitos, aceptar las condiciones crea la Postulación y vuelve al panel, donde sigue el pago.
// El redirect va fuera de resolverAccion porque Next lo implementa lanzando una excepción.
export async function aceptarCondicionesAccion(
  anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const estado = await crearPostulacionAccion(anterior, datos)
  if (estado?.ok) redirect(RUTA)

  return estado
}

export async function iniciarPagoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const parsed = esquemaParametrosDePostulacion.safeParse({ id: datos.get('id') })
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ iniciarPago }, actor) => {
      await iniciarPago.ejecutar(actor, parsed.data.id)
      return 'Pago iniciado.'
    }),
  )
  revalidatePath(RUTA)

  return estado
}
