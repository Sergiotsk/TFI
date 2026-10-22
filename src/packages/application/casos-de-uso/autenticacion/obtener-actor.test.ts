import { describe, expect, it } from 'vitest'
import { Perfil } from '@tfi/domain'
import { RepositorioDePerfilesFake } from '../../puertos/repositorio-de-perfiles/fake'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import { ObtenerActorUseCase } from './obtener-actor'

function perfilDePrueba(id: string): Perfil {
  return new Perfil(
    id,
    'aspirante@example.com',
    'Ana',
    'García',
    '30123456',
    '27301234569',
    new Date('2000-05-15'),
    'F',
    null,
    null,
    'ASPIRANTE',
    'inst-1',
    true,
    new Date(),
    new Date(),
  )
}

describe('ObtenerActor', () => {
  it('devuelve SIN_SESION cuando no hay usuario autenticado', async () => {
    const caso = new ObtenerActorUseCase(
      new ServicioDeAutenticacionFake(),
      new RepositorioDePerfilesFake(),
    )

    const resultado = await caso.ejecutar()

    expect(resultado.resultado).toBe('SIN_SESION')
  })

  it('devuelve SIN_PERFIL cuando hay sesión pero el perfil no existe', async () => {
    const auth = new ServicioDeAutenticacionFake()
    await auth.registrarAspirante({
      email: 'aspirante@example.com',
      contrasena: 'contrasenaSegura123',
      nombre: 'Ana',
      apellido: 'García',
      dni: '30123456',
      cuil: '27301234569',
      fechaDeNacimiento: '2000-05-15',
      sexo: 'F',
    })
    const caso = new ObtenerActorUseCase(auth, new RepositorioDePerfilesFake())

    const resultado = await caso.ejecutar()

    expect(resultado.resultado).toBe('SIN_PERFIL')
  })

  it('arma el Actor con el rol y la institución del perfil real', async () => {
    const auth = new ServicioDeAutenticacionFake()
    const registro = await auth.registrarAspirante({
      email: 'aspirante@example.com',
      contrasena: 'contrasenaSegura123',
      nombre: 'Ana',
      apellido: 'García',
      dni: '30123456',
      cuil: '27301234569',
      fechaDeNacimiento: '2000-05-15',
      sexo: 'F',
    })
    const repo = new RepositorioDePerfilesFake()
    repo.agregar(perfilDePrueba(registro.resultado === 'REGISTRADO' ? registro.usuarioId : ''))
    const caso = new ObtenerActorUseCase(auth, repo)

    const resultado = await caso.ejecutar()

    expect(resultado.resultado).toBe('AUTENTICADO')
    if (resultado.resultado === 'AUTENTICADO') {
      expect(resultado.actor.rol).toBe('ASPIRANTE')
      expect(resultado.actor.institucionId).toBe('inst-1')
    }
  })
})
