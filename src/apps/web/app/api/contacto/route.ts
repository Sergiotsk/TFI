import { NextResponse } from 'next/server'
import { CAMPO_TRAMPA, schemaDeConsultaDeContacto } from '@/http/contacto'

/**
 * Recibe el formulario de contacto de la landing (JSON por POST), lo valida con Zod
 * y responde siempre JSON: { ok: bool, ... }.
 *
 * Hoy la consulta solo queda en el log del servidor; el aviso por mail (SMTP) se
 * conecta después, cuando se defina el proveedor.
 */
export const POST = async (request: Request) => {
  const datos = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (datos === null) {
    return NextResponse.json({ ok: false, mensaje: 'Datos inválidos.' }, { status: 400 })
  }

  // Trampa para bots: si el campo oculto viene completo, se descarta en silencio
  // (se responde OK para no delatar la trampa).
  const trampa = datos[CAMPO_TRAMPA]
  if (typeof trampa === 'string' && trampa.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const parseado = schemaDeConsultaDeContacto.safeParse(datos)
  if (!parseado.success) {
    const errores: Record<string, string> = {}
    for (const problema of parseado.error.issues) {
      const campo = String(problema.path[0] ?? '')
      if (campo !== '' && errores[campo] === undefined) {
        errores[campo] = problema.message
      }
    }
    return NextResponse.json(
      { ok: false, mensaje: 'Revisá los campos marcados.', errores },
      { status: 422 },
    )
  }

  console.log('[contacto] nueva consulta recibida, asunto:', parseado.data.asunto)

  return NextResponse.json({ ok: true })
}
