import { describe, expect, it } from 'vitest'
import { esquemaCambioDeContrasena, esquemaSolicitudDeRecuperacion } from './recuperacion'

describe('esquemaSolicitudDeRecuperacion', () => {
  it('normaliza el email con espacios alrededor', () => {
    const parsed = esquemaSolicitudDeRecuperacion.safeParse({ email: '  persona@example.com ' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('persona@example.com')
  })

  it('rechaza un email inválido', () => {
    expect(esquemaSolicitudDeRecuperacion.safeParse({ email: 'no-es-un-email' }).success).toBe(false)
  })

  it('rechaza campos extra', () => {
    const parsed = esquemaSolicitudDeRecuperacion.safeParse({
      email: 'persona@example.com',
      perfilId: 'otro',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('esquemaCambioDeContrasena', () => {
  it('acepta dos contraseñas iguales y suficientemente largas', () => {
    const parsed = esquemaCambioDeContrasena.safeParse({
      contrasena: 'contrasenaSegura123',
      confirmacion: 'contrasenaSegura123',
    })
    expect(parsed.success).toBe(true)
  })

  it('rechaza la contraseña corta', () => {
    const parsed = esquemaCambioDeContrasena.safeParse({
      contrasena: 'corta',
      confirmacion: 'corta',
    })
    expect(parsed.success).toBe(false)
  })

  it('marca la confirmación cuando las contraseñas no coinciden', () => {
    const parsed = esquemaCambioDeContrasena.safeParse({
      contrasena: 'contrasenaSegura123',
      confirmacion: 'otraContrasena123',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['confirmacion'])
      expect(parsed.error.issues[0]?.message).toBe('Las contraseñas no coinciden')
    }
  })
})
