import { z } from 'zod'

export const esquemaIniciarPagoConPasarela = z.object({
  postulacionId: z.string().uuid({ message: 'postulacionId debe ser un UUID válido' }),
})