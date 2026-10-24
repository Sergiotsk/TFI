'use server'

import { revalidatePath } from 'next/cache'
import { esquemaDecision, esquemaParametrosDePago } from '@/http/esquemas/pagos'
import { conActorDePanel, resolverAccion, type EstadoDeAccion } from '../../../sesion-de-panel'

const RUTAS_AFECTADAS = [
  '/direccion/casos',
  '/personal/pagos/devoluciones',
  '/personal/postulaciones',
  '/personal/periodos',
]

// Aceptar o rechazar un caso (US5). El botón que se apretó viaja como `decision`.
export async function decidirCasoAccion(
  _anterior: EstadoDeAccion,
  datos: FormData,
): Promise<EstadoDeAccion> {
  const id = esquemaParametrosDePago.safeParse({ id: datos.get('id') })
  const decision = esquemaDecision.safeParse({
    decision: datos.get('decision'),
    comentario: datos.get('comentario') ?? undefined,
  })
  if (!id.success) return { ok: false, mensaje: id.error.issues[0]?.message ?? 'Dato inválido' }
  if (!decision.success) {
    return { ok: false, mensaje: decision.error.issues[0]?.message ?? 'Dato inválido' }
  }

  const estado = await resolverAccion(() =>
    conActorDePanel(async ({ decidirPagoExcepcional }, actor) => {
      await decidirPagoExcepcional.ejecutar(actor, id.data.id, decision.data.decision, decision.data.comentario)
      return decision.data.decision === 'ACEPTAR'
        ? 'Pago aceptado: la vacante quedó confirmada.'
        : 'Pago rechazado: Tesorería tiene que devolver la matrícula.'
    }),
  )
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta)
  // El contador de casos de la barra lateral lo calcula el layout.
  revalidatePath('/', 'layout')

  return estado
}
