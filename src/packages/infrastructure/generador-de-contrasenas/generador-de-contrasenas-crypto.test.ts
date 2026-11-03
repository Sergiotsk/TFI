import { describe, expect, it } from 'vitest'
import { probarContratoDeGeneradorDeContrasenas } from '@tfi/application/contratos'
import { GeneradorDeContrasenasCrypto } from './generador-de-contrasenas-crypto'

probarContratoDeGeneradorDeContrasenas(() => new GeneradorDeContrasenasCrypto())

describe('GeneradorDeContrasenasCrypto', () => {
  it('incluye mayúscula, minúscula, dígito y símbolo', () => {
    const contrasena = new GeneradorDeContrasenasCrypto().temporal()

    expect(contrasena).toMatch(/[A-Z]/)
    expect(contrasena).toMatch(/[a-z]/)
    expect(contrasena).toMatch(/\d/)
    expect(contrasena).toMatch(/[!@#$%&*]/)
  })

  it('respeta la longitud configurada', () => {
    expect(new GeneradorDeContrasenasCrypto(20).temporal()).toHaveLength(20)
  })

  it('nunca baja de 12 caracteres', () => {
    expect(new GeneradorDeContrasenasCrypto(4).temporal()).toHaveLength(12)
  })
})
