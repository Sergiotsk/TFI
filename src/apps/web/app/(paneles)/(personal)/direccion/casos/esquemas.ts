import { z } from 'zod'

// Aviso después de decidir un caso: la acción redirige con la decisión y el número en el query string, porque el caso
// desaparece de la lista y con él su formulario. Solo se muestra si los dos valores son válidos.
const esquemaAvisoDeDecision = z.object({
  decision: z.enum(['ACEPTAR', 'RECHAZAR']),
  numero: z.string().regex(/^[0-9]{1,12}$/),
})

export function avisoDeDecision(parametros: Record<string, unknown>): string | null {
  const parsed = esquemaAvisoDeDecision.safeParse(parametros)
  if (!parsed.success) return null

  const { decision, numero } = parsed.data
  return decision === 'ACEPTAR'
    ? `Pago de la Postulación Nº ${numero} aceptado: la vacante quedó confirmada.`
    : `Pago de la Postulación Nº ${numero} rechazado: Tesorería tiene que devolver la matrícula.`
}
