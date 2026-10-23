'use server'

import { redirect } from 'next/navigation'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaRegistro } from '@/http/esquemas/registro'
import { detallesDeZod } from '@/http/esquemas/errores'
import { textoDelCampo, textoOpcionalDelCampo } from '@/lib/form-data'

export type EstadoDeRegistro = {
  mensaje?: string
  errores?: Record<string, string>
}

export async function registrar(
  _estado: EstadoDeRegistro,
  datos: FormData,
): Promise<EstadoDeRegistro> {
  const parsed = esquemaRegistro.safeParse({
    email: textoDelCampo(datos, 'email'),
    contrasena: textoDelCampo(datos, 'contrasena'),
    nombre: textoDelCampo(datos, 'nombre'),
    apellido: textoDelCampo(datos, 'apellido'),
    dni: textoDelCampo(datos, 'dni'),
    cuil: textoDelCampo(datos, 'cuil'),
    fechaNacimiento: textoDelCampo(datos, 'fechaNacimiento'),
    sexo: textoDelCampo(datos, 'sexo'),
    telefono: textoOpcionalDelCampo(datos, 'telefono'),
    direccion: textoOpcionalDelCampo(datos, 'direccion'),
  })

  if (!parsed.success) {
    return {
      mensaje: 'Revisá los datos marcados',
      errores: detallesDeZod(parsed.error),
    }
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
    // Mensaje generico: no revelamos si el email o el DNI ya existen.
    return {
      mensaje:
        'No pudimos completar el registro. Revisá tus datos o, si ya tenés una cuenta, iniciá sesión.',
    }
  }

  if (resultado.requiereConfirmarEmail) {
    return {
      mensaje:
        'Te enviamos un email para confirmar tu cuenta. Cuando lo confirmes, vas a poder iniciar sesión.',
    }
  }

  redirect('/panel')
}
