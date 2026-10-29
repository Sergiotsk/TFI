import { describe, expect, it } from 'vitest'
import { verificarMigraciones, type Migracion } from './reglas.ts'

function migracion(archivo: string, contenido = `-- ${archivo}`): Migracion {
  return { archivo, contenido }
}

const BASE = [migracion('20261021000100_renombrar_a_espanol.sql'), migracion('20261024120000_rpc_decidir_pago.sql')]

describe('verificarMigraciones', () => {
  it('acepta la rama sin cambios en las migraciones', () => {
    expect(verificarMigraciones(BASE, BASE)).toEqual([])
  })

  it('acepta una migración nueva posterior a la última de la base', () => {
    const cabeza = [...BASE, migracion('20261024150000_intenciones_de_pago.sql')]

    expect(verificarMigraciones(BASE, cabeza)).toEqual([])
  })

  it('rechaza una migración nueva anterior a la última de la base', () => {
    const cabeza = [...BASE, migracion('20261023120000_intenciones_de_pago.sql')]

    expect(verificarMigraciones(BASE, cabeza)).toEqual([
      {
        archivo: '20261023120000_intenciones_de_pago.sql',
        motivo: expect.stringContaining('20261024120000') as string,
      },
    ])
  })

  it('rechaza una migración nueva con la misma versión que la última de la base', () => {
    const cabeza = [...BASE, migracion('20261024120000_confirmar_vacante.sql')]

    const problemas = verificarMigraciones(BASE, cabeza)

    expect(problemas.map((p) => p.archivo)).toContain('20261024120000_confirmar_vacante.sql')
    expect(problemas.some((p) => p.motivo.includes('versión repetida'))).toBe(true)
  })

  it('rechaza dos migraciones nuevas con la misma versión', () => {
    const cabeza = [...BASE, migracion('20261025000000_a.sql'), migracion('20261025000000_b.sql')]

    expect(verificarMigraciones(BASE, cabeza)).toEqual([
      { archivo: '20261025000000_b.sql', motivo: expect.stringContaining('versión repetida') as string },
    ])
  })

  it('rechaza editar una migración que ya está en la base', () => {
    const cabeza = [BASE[0]!, migracion('20261024120000_rpc_decidir_pago.sql', '-- otra cosa')]

    expect(verificarMigraciones(BASE, cabeza)).toEqual([
      { archivo: '20261024120000_rpc_decidir_pago.sql', motivo: expect.stringContaining('editada') as string },
    ])
  })

  it('no confunde finales de línea CRLF con una edición', () => {
    const base = [migracion('20261024120000_rpc.sql', 'select 1;\nselect 2;\n')]
    const cabeza = [migracion('20261024120000_rpc.sql', 'select 1;\r\nselect 2;\r\n')]

    expect(verificarMigraciones(base, cabeza)).toEqual([])
  })

  it('rechaza borrar o renombrar una migración que ya está en la base', () => {
    const cabeza = [BASE[0]!, migracion('20261024120000_rpc_decidir_pago_v2.sql', BASE[1]!.contenido)]

    const problemas = verificarMigraciones(BASE, cabeza)

    expect(problemas).toContainEqual({
      archivo: '20261024120000_rpc_decidir_pago.sql',
      motivo: expect.stringContaining('borrada') as string,
    })
  })

  it('rechaza un nombre que Supabase CLI no aplicaría', () => {
    const cabeza = [...BASE, migracion('2026-10-25_nueva.sql'), migracion('20261025000000_Nueva Tabla.sql')]

    const problemas = verificarMigraciones(BASE, cabeza)

    expect(problemas.map((p) => p.archivo)).toEqual(['2026-10-25_nueva.sql', '20261025000000_Nueva Tabla.sql'])
    expect(problemas.every((p) => p.motivo.includes('formato'))).toBe(true)
  })

  it('acepta cualquier versión cuando la base todavía no tiene migraciones', () => {
    expect(verificarMigraciones([], [migracion('20261017000000_init_schema.sql')])).toEqual([])
  })
})
