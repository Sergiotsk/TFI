import { describe, expect, it } from 'vitest'
import type { ServicioDeAutenticacion, DatosDeRegistro } from './puerto'

const CONTRASENA = 'contrasenaSegura123'

// El DNI y el CUIL son UNIQUE en public.perfiles: si dos registros de la suite
// usan el mismo, el segundo choca contra el trigger y no se crea el usuario.
// Cada registro necesita entonces su propia identidad.
let contadorDeIdentidad = 0

function digitosUnicos(): string {
  contadorDeIdentidad += 1
  return `${Date.now().toString().slice(-6)}${contadorDeIdentidad.toString().padStart(2, '0')}`
}

function datosDe(email: string): DatosDeRegistro {
  const digitos = digitosUnicos()

  return {
    email,
    contrasena: CONTRASENA,
    nombre: 'Ana',
    apellido: 'García',
    dni: digitos,
    cuil: `20${digitos}5`,
    fechaDeNacimiento: '2000-05-15',
    sexo: 'F',
    telefono: '1122334455',
    direccion: 'Calle Falsa 123',
  }
}

export function probarContratoServicioDeAutenticacion(
  crearServicio: () => Promise<ServicioDeAutenticacion> | ServicioDeAutenticacion,
  opciones: { emailDePrueba?: () => string } = {},
) {
  // Cada test usa un email distinto: contra una base real el mismo usuario no
  // se puede registrar dos veces.
  const emailDePrueba = opciones.emailDePrueba ?? (() => 'aspirante.test@example.com')

  describe('contrato: ServicioDeAutenticacion', () => {
    it('usuarioAutenticado() devuelve null cuando no hay sesión', async () => {
      const servicio = await crearServicio()
      const sesion = await servicio.usuarioAutenticado()
      expect(sesion).toBeNull()
    })

    it('registrarAspirante() registra y deja una sesión activa', async () => {
      const servicio = await crearServicio()
      const resultado = await servicio.registrarAspirante(datosDe(emailDePrueba()))
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
      const email = emailDePrueba()
      await servicio.registrarAspirante(datosDe(email))
      await servicio.cerrarSesion()
      const resultado = await servicio.iniciarSesion(email, CONTRASENA)
      expect(resultado.resultado).toBe('INICIADA')
      if (resultado.resultado === 'INICIADA') {
        expect(resultado.usuarioId).toBeTruthy()
      }
    })

    it('cerrarSesion() limpia la sesión', async () => {
      const servicio = await crearServicio()
      await servicio.registrarAspirante(datosDe(emailDePrueba()))
      await servicio.cerrarSesion()
      expect(await servicio.usuarioAutenticado()).toBeNull()
    })
  })
}
