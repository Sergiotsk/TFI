// src/apps/web/app/aspirante/inscripcion/actions.ts
'use server'

import { CargaDatosSchema, type CargaDatosInput } from '@/http/schemas/carga-datos.schema'
// Acá se importa el caso de uso o el composition root configurado
// ej: import { registrarAspiranteUseCase } from '@/composition-root'

export async function guardarDatosInscripcionAction(datos: CargaDatosInput) {
  const validacion = CargaDatosSchema.safeParse(datos)
  if (!validacion.success) {
    return { ok: false, error: 'Datos inválidos' }
  }

  try {
    // Se ejecuta el caso de uso de registro o actualización de perfil
    // await registrarAspiranteUseCase.ejecutar(validacion.data)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Error al guardar los datos' }
  }
}