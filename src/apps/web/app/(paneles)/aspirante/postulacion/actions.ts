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

  if (estado && estado.ok) {
    revalidatePath(RUTA)
    redirect('/aspirante/postulacion/requisitos')
  }

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

  if (estado && estado.ok) {
    revalidatePath(RUTA)
    redirect('/aspirante/postulacion/pago')
  }

  return estado
}