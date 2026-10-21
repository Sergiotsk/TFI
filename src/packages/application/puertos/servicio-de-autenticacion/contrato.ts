import { describe, expect, it } from 'vitest'
import type { ServicioDeAutenticacion, DatosDeRegistro } from './puerto'

const DATOS_DE_REGISTRO_VALIDOS: DatosDeRegistro = {
  email: 'aspirante.test@example.com',
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

export function probarContratoServicioDeAutenticacion(
  crearServicio: () => Promise<ServicioDeAutenticacion> | ServicioDeAutenticacion,
) {
  describe('contrato: ServicioDeAutenticacion', () => {
    it('usuarioAutenticado() devuelve null cuando no hay sesión', async () => {
      const servicio = await crearServicio()
      const sesion = await servicio.usuarioAutenticado()
      expect(sesion).toBeNull()
    })

    it('registrarAspirante() registra y deja una sesión activa', async () => {
      const servicio = await crearServicio()
      const resultado = await servicio.registrarAspirante(DATOS_DE_REGISTRO_VALIDOS)
      expect(resultado.resultado).toBe('REGISTRADO')
      if (resultado.resultado === 'REGISTRADO') {
        expect(resultado.usuarioId).toBeTruthy()
      }
      const sesion = await servicio.usuarioAutenticado()
      expect(sesion?.id).toBeTruthy()
    })

    it('iniciarSesion() devuelve CREDENCIALES_INVALIDAS con datos incorrectos', async () => {
      const servicio = await crearServicio()
      const resultado = await servicio.iniciarSesion('no-existe@example.com', 'mal')
      expect(resultado.resultado).toBe('CREDENCIALES_INVALIDAS')
      expect(await servicio.usuarioAutenticado()).toBeNull()
    })

    it('iniciarSesion() devuelve INICIADA con credenciales correctas', async () => {
      const servicio = await crearServicio()
      await servicio.registrarAspirante(DATOS_DE_REGISTRO_VALIDOS)
      await servicio.cerrarSesion()
      const resultado = await servicio.iniciarSesion(DATOS_DE_REGISTRO_VALIDOS.email, DATOS_DE_REGISTRO_VALIDOS.contrasena)
      expect(resultado.resultado).toBe('INICIADA')
      if (resultado.resultado === 'INICIADA') {
        expect(resultado.usuarioId).toBeTruthy()
      }
    })

    it('cerrarSesion() limpia la sesión', async () => {
      const servicio = await crearServicio()
      await servicio.registrarAspirante(DATOS_DE_REGISTRO_VALIDOS)
      await servicio.cerrarSesion()
      expect(await servicio.usuarioAutenticado()).toBeNull()
    })
  })
}

