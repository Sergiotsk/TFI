import { describe, expect, it } from 'vitest'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import type { DatosDeRegistro } from '../../puertos/servicio-de-autenticacion/puerto'
import { RegistrarAspiranteUseCase } from './registrar-aspirante'

const DATOS: DatosDeRegistro = {
  email: 'aspirante@example.com',
  contrasena: 'contrasenaSegura123',
  nombre: 'Ana',
  apellido: 'García',
  dni: '30123456',
  cuil: '27301234569',
  fechaDeNacimiento: '2000-05-15',
  sexo: 'F',
  telefono: '1122334455',
  direccion: 'Calle Falsa 123',
}

describe('RegistrarAspirante', () => {
  it('registra a la aspirante y devuelve el id', async () => {
    const caso = new RegistrarAspiranteUseCase(new ServicioDeAutenticacionFake())

    const resultado = await caso.ejecutar(DATOS)

    expect(resultado.resultado).toBe('REGISTRADO')
    if (resultado.resultado === 'REGISTRADO') {
      expect(resultado.usuarioId).toBeTruthy()
    }
  })

  it('rechaza el registro si el email ya existe', async () => {
    const caso = new RegistrarAspiranteUseCase(new ServicioDeAutenticacionFake())

    await caso.ejecutar(DATOS)
    const resultado = await caso.ejecutar({ ...DATOS, email: DATOS.email })

    expect(resultado.resultado).toBe('RECHAZADO')
  })
})
