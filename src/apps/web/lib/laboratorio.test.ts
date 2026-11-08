import { describe, expect, it } from 'vitest'
import { laboratorioHabilitado } from './laboratorio'

describe('laboratorioHabilitado', () => {
  it('se apaga en el deploy de producción', () => {
    expect(laboratorioHabilitado('production')).toBe(false)
  })

  it.each(['preview', 'development', undefined])('queda disponible con VERCEL_ENV=%s', (entorno) => {
    expect(laboratorioHabilitado(entorno)).toBe(true)
  })
})
