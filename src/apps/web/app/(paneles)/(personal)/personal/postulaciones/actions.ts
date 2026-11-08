'use server'

import { revalidatePath } from 'next/cache'
import { esquemaProrrogaDePlazo } from '@/http/esquemas/acciones'
import { esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../../sesion-de-panel'

const RUTAS_AFECTADAS = ['/personal/postulaciones', '/personal/periodos']

function refrescar(): void {
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta)
}

export async function acreditarPagoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const parsed = esquemaParametrosDePostulacion.safeParse({ id: datos.get('id') })
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ acreditarPagoManual }, actor) => {
      await acreditarPagoManual.ejecutar(actor, parsed.data.id)
      return 'Pago acreditado: la vacante quedó confirmada.'
    }),
  )
  refrescar()

  return estado
}

export async function prorrogarPlazoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const id = esquemaParametrosDePostulacion.safeParse({ id: datos.get('id') })
  const prorroga = esquemaProrrogaDePlazo.safeParse({ dias: datos.get('dias') })
  if (!id.success) return { ok: false, mensaje: id.error.issues[0]?.message ?? 'Dato inválido' }
  if (!prorroga.success) {
    return { ok: false, mensaje: prorroga.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ prorrogarPlazoDePago }, actor) => {
      await prorrogarPlazoDePago.ejecutar(actor, id.data.id, prorroga.data.dias)
      return `Plazo prorrogado ${prorroga.data.dias} día(s).`
    }),
  )
  refrescar()

  return estado
}
