import { z } from 'zod'
import type { CambiosDePeriodo, DatosDeNuevoPeriodo } from '@tfi/application'

// Argentina no tiene horario de verano: la hora de la institución es siempre UTC-3.
const DESFASE_DE_LA_INSTITUCION_HORAS = 3
// El valor de un <input type="datetime-local">: "2026-11-10T00:00".
const HORA_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

// Los campos que comparten el alta y la edición.
const camposDelPeriodo = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'El nombre es demasiado largo'),
  totalCupos: z.coerce.number().int('Los cupos tienen que ser un número entero').min(0, 'El total de cupos no puede ser negativo'),
  diasPlazoPago: z.coerce.number().int('El plazo tiene que ser un número entero de días').min(1, 'El plazo debe ser de al menos un día'),
  montoPesos: z.coerce.number().positive('El monto debe ser mayor que cero'),
  cierraEl: z.string().regex(HORA_LOCAL, 'La fecha de cierre no es válida'),
}

const esquemaDelAlta = z.object(camposDelPeriodo)

const esquemaDelFormulario = z.object({
  ...camposDelPeriodo,
  id: z.string().uuid('El período no es válido'),
  cierraElOriginal: z.string().optional(),
})

export type LecturaDeNuevoPeriodo = { ok: true; datos: DatosDeNuevoPeriodo } | { ok: false; mensaje: string }

/**
 * Traduce el formulario de alta a los datos de `CrearPeriodo`. El monto llega en pesos y el cierre en hora de
 * la institución. Que el cierre no esté en el pasado lo decide el caso de uso, con su reloj.
 */
export function leerNuevoPeriodo(datos: FormData): LecturaDeNuevoPeriodo {
  const parsed = esquemaDelAlta.safeParse(Object.fromEntries(datos))
  if (!parsed.success) return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Dato inválido' }

  const { nombre, totalCupos, diasPlazoPago, montoPesos, cierraEl } = parsed.data
  return {
    ok: true,
    datos: {
      nombre,
      totalCupos,
      diasPlazoPago,
      montoMatriculaCentavos: Math.round(montoPesos * 100),
      cierraEl: desdeHoraDeLaInstitucion(cierraEl),
    },
  }
}

export type LecturaDeCambiosDePeriodo =
  | { ok: true; id: string; cambios: CambiosDePeriodo }
  | { ok: false; mensaje: string }

/**
 * Traduce el formulario de edición de un período a los cambios de `ModificarPeriodo`. El monto llega en pesos
 * y el cierre en hora de la institución. El cierre se manda solo si cambió: el caso de uso rechaza un cierre en
 * el pasado, y así un período ya cerrado se puede corregir sin tocar su fecha.
 */
export function leerCambiosDePeriodo(datos: FormData): LecturaDeCambiosDePeriodo {
  const parsed = esquemaDelFormulario.safeParse(Object.fromEntries(datos))
  if (!parsed.success) return { ok: false, mensaje: parsed.error.issues[0]?.message ?? 'Dato inválido' }

  const { id, nombre, totalCupos, diasPlazoPago, montoPesos, cierraEl, cierraElOriginal } = parsed.data
  const cambios: CambiosDePeriodo = {
    nombre,
    totalCupos,
    diasPlazoPago,
    montoMatriculaCentavos: Math.round(montoPesos * 100),
  }
  if (cierraEl !== cierraElOriginal) cambios.cierraEl = desdeHoraDeLaInstitucion(cierraEl)

  return { ok: true, id, cambios }
}

/** El valor de un datetime-local con la fecha en hora de la institución. */
export function aHoraDeLaInstitucion(fecha: Date): string {
  return new Date(fecha.getTime() - DESFASE_DE_LA_INSTITUCION_HORAS * 60 * 60 * 1000).toISOString().slice(0, 16)
}

function desdeHoraDeLaInstitucion(valor: string): Date {
  const [, anio, mes, dia, hora, minuto] = HORA_LOCAL.exec(valor)?.map(Number) ?? []
  return new Date(
    Date.UTC(anio ?? 0, (mes ?? 1) - 1, dia ?? 1, (hora ?? 0) + DESFASE_DE_LA_INSTITUCION_HORAS, minuto ?? 0),
  )
}
