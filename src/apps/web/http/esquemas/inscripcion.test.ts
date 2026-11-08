import { describe, expect, it } from 'vitest'
import { validarInscripcion, type DatosDeInscripcion } from './inscripcion'

function inscripcion(cambios: Partial<DatosDeInscripcion> = {}): DatosDeInscripcion {
  return {
    nombre: 'Lucas',
    apellido: 'Rossi',
    email: 'lucas@correo.com',
    password: 'clave-segura',
    confirmarPassword: 'clave-segura',
    dni: '43829114',
    cuil: '20-43829114-7',
    fechaNacimiento: '2004-05-17',
    genero: 'Masculino',
    telefono: '11 6543-9821',
    direccion: 'Av. Rivadavia 16240, Haedo',
    aceptaTerminosFacturacion: true,
    aceptaReglamento: true,
    ...cambios,
  }
}

function erroresDe(datos: DatosDeInscripcion) {
  const resultado = validarInscripcion(datos)
  if (resultado.ok) throw new Error('Se esperaban errores de validación')
  return resultado.errores
}

describe('validarInscripcion', () => {
  it('arma los datos del registro con lo que cargó el aspirante', () => {
    const resultado = validarInscripcion(inscripcion())

    expect(resultado).toEqual({
      ok: true,
      datos: {
        email: 'lucas@correo.com',
        contrasena: 'clave-segura',
        nombre: 'Lucas',
        apellido: 'Rossi',
        dni: '43829114',
        cuil: '20438291147',
        fechaNacimiento: '2004-05-17',
        sexo: 'M',
        telefono: '11 6543-9821',
        direccion: 'Av. Rivadavia 16240, Haedo',
      },
    })
  })

  it.each([
    ['Masculino', 'M'],
    ['Femenino', 'F'],
    ['No binario / Otro', 'O'],
  ])('traduce el género %s al sexo registral %s', (genero, sexo) => {
    const resultado = validarInscripcion(inscripcion({ genero }))

    expect(resultado.ok && resultado.datos.sexo).toBe(sexo)
  })

  it('exige el CUIL: no lo reemplaza por el DNI', () => {
    expect(erroresDe(inscripcion({ cuil: '' })).cuil).toBeDefined()
    expect(erroresDe(inscripcion({ cuil: '43829114' })).cuil).toBeDefined()
  })

  it('exige la fecha de nacimiento: no inventa una', () => {
    expect(erroresDe(inscripcion({ fechaNacimiento: '' })).fechaNacimiento).toBeDefined()
  })

  it('informa la contraseña corta en el campo del formulario', () => {
    const errores = erroresDe(inscripcion({ password: 'corta', confirmarPassword: 'corta' }))

    expect(errores.password).toBeDefined()
    expect(errores.contrasena).toBeUndefined()
  })

  it('exige que las contraseñas coincidan', () => {
    expect(erroresDe(inscripcion({ confirmarPassword: 'otra-clave' })).confirmarPassword).toBe(
      'Las contraseñas no coinciden',
    )
  })

  it('informa el género inválido en su campo, no como sexo', () => {
    const errores = erroresDe(inscripcion({ genero: '' }))

    expect(errores.genero).toBeDefined()
    expect(errores.sexo).toBeUndefined()
  })

  it('exige teléfono y dirección', () => {
    const errores = erroresDe(inscripcion({ telefono: '', direccion: '' }))

    expect(errores.telefono).toBeDefined()
    expect(errores.direccion).toBeDefined()
  })

  it('exige aceptar la declaración y las condiciones', () => {
    const errores = erroresDe(
      inscripcion({ aceptaTerminosFacturacion: false, aceptaReglamento: false }),
    )

    expect(errores.aceptaTerminosFacturacion).toBeDefined()
    expect(errores.aceptaReglamento).toBeDefined()
  })
})
