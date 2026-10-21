import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaRegistro } from '@/http/esquemas/registro'
import { jsonError, jsonOk } from '@/http/respuesta'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = esquemaRegistro.safeParse(body)

    if (!parsed.success) {
      return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400)
    }

    const supabase = await crearCliente()
    const { registrarAspirante } = crearDependencias(supabase)
    const resultado = await registrarAspirante.ejecutar({
      email: parsed.data.email,
      contrasena: parsed.data.contrasena,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      dni: parsed.data.dni,
      cuil: parsed.data.cuil,
      fechaDeNacimiento: parsed.data.fechaNacimiento,
      sexo: parsed.data.sexo,
      ...(parsed.data.telefono !== undefined ? { telefono: parsed.data.telefono } : {}),
      ...(parsed.data.direccion !== undefined ? { direccion: parsed.data.direccion } : {}),
    })

    if (resultado.resultado !== 'REGISTRADO') {
      // Mensaje genérico: no revelamos si el email o el DNI ya existen
      return jsonError('REGISTRO_RECHAZADO', 'No pudimos completar el registro. Revisá tus datos o, si ya tenés una cuenta, iniciá sesión', 409)
    }

    return jsonOk(
      {
        usuarioId: resultado.usuarioId,
        requiereConfirmarEmail: resultado.requiereConfirmarEmail,
      },
      201,
    )
  } catch {
    return jsonError('ERROR_INTERNO', 'Ocurrió un error inesperado', 500)
  }
}
