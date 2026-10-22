import { z } from 'zod'
import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { jsonError, jsonOk } from '@/http/respuesta'

// aca se va a implementar las cosas para el manejo de postulaciones SIN ID, VER TODOS, VER TODOS POR ESTADO, VER TODOS POR MOTIVO REVISION
const esquemaEstado = z.enum(
  [
    'PREINSCRIPTO',
    'PAGO_PENDIENTE',
    'PAGO_EN_REVISION',
    'VACANTE_CONFIRMADA',
    'VENCIDO',
    'ESPERANDO_DOCUMENTACION',
    'DOCUMENTACION_EN_REVISION',
    'OBSERVADO',
    'DOCUMENTACION_VALIDADA',
    'CONFIRMADO_PARA_EXPORTAR',
  ],
  {
    errorMap: () => ({ message: 'Estado desconocido' }),
  },
)

// const esquemaMotivoRevision = z.enum(['FUERA_DE_PLAZO', 'SIN_CUPO'], {
//   errorMap: () => ({ message: 'Motivo de la Revision desconocido' }),
// })

export async function GET(request: Request) {
  const supabase = await crearCliente()

  const { obtenerActorUseCase, repoPostulaciones } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  if (!ROLES_DEL_PERSONAL.includes(actor.actor.rol)) {
    return jsonError(
      'NO_AUTORIZADO',
      'No tenés permisos para listar perfiles',
      403,
    )
  }

  const estado = new URL(request.url).searchParams.get('estado')

  if (estado !== null) {
    const parsed = esquemaEstado.safeParse(estado)
    if (!parsed.success) {
      return jsonError(
        'DATOS_INVALIDOS',
        'Los datos ingresados no son válidos',
        400,
        {
          rol: parsed.error.issues[0]?.message ?? 'Estado desconocido',
        },
      )
    }

    const postulaciones = await repoPostulaciones.obtenerPorEstado(parsed.data)
    return jsonOk(postulaciones)
  }

  const numeroParam = new URL(request.url).searchParams.get('numero')

  if (numeroParam !== null) {
    const numero = Number(numeroParam)
    if (!Number.isInteger(numero)) {
      return jsonError(
        'DATOS_INVALIDOS',
        'Los datos ingresados no son válidos',
        400,
        { numero: 'Debe ser un número entero' },
      )
    }

    const postulaciones = await repoPostulaciones.obtenerPorNumero(numero)
    return jsonOk(postulaciones)
  }

  const postulaciones = await repoPostulaciones.obtenerTodos()
  return jsonOk(postulaciones)
}
