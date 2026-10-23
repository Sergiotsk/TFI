import { describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  claveDeServicioDePrueba,
  clavePublicaDePrueba,
  emailDePrueba,
  hayEntornoDePruebaConServicio,
  urlDePrueba,
} from './entorno-de-prueba'

const CONTRASENA = 'contrasenaSegura123'

const METADATA_BASE = {
  nombre: 'Ana',
  apellido: 'García',
  dni: '30123456',
  cuil: '27301234569',
  fecha_nacimiento: '2000-05-15',
  sexo: 'F',
}

let contador = 0

/**
 * DNI y CUIL únicos por test: contra una base real, el perfil tiene ambos
 * campos únicos y reusar los mismos datos entre tests hace fallar el segundo
 * registro.
 */
function metadataUnica() {
  contador += 1
  const dni = String(20_000_000 + ((Date.now() + contador * 7919) % 79_000_000))

  return { ...METADATA_BASE, dni, cuil: `27${dni}9` }
}

function metadataSinDni() {
  return {
    nombre: METADATA_BASE.nombre,
    apellido: METADATA_BASE.apellido,
    cuil: '27000000009',
    fecha_nacimiento: METADATA_BASE.fecha_nacimiento,
    sexo: METADATA_BASE.sexo,
  }
}

// Estos tests hablan con la base de verdad: verifican el trigger
// crear_perfil_al_registrarse y el de sincronizacion del email, que ninguna
// suite con fakes puede cubrir.
//
// Requieren SUPABASE_TEST_URL, SUPABASE_TEST_PUBLISHABLE_KEY y
// SUPABASE_TEST_SERVICE_ROLE_KEY. Ademas el proyecto de prueba necesita la
// migracion 20261021000300 aplicada y exactamente una institucion activa.
describe.skipIf(!hayEntornoDePruebaConServicio())('contrato: registro con Supabase', () => {
  it('el rol de la metadata se ignora y queda ASPIRANTE', async () => {
    const anon = clientePublico()
    const admin = clienteDeServicio()
    const email = emailDePrueba('rol')

    const { data, error } = await anon.auth.signUp({
      email,
      password: CONTRASENA,
      options: {
        data: {
          ...metadataUnica(),
          // El usuario intenta autoasignarse un rol de la facultad.
          rol: 'SECRETARIA',
        },
      },
    })

    expect(error).toBeNull()
    if (!data?.user) throw new Error('el registro debería haber creado el usuario')

    const { data: perfil } = await admin
      .from('perfiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle()

    expect(perfil?.rol).toBe('ASPIRANTE')
  })

  it('sin DNI el registro falla y no deja un perfil con dni vacío', async () => {
    const anon = clientePublico()
    const admin = clienteDeServicio()
    const email = emailDePrueba('sin-dni')

    const { error } = await anon.auth.signUp({
      email,
      password: CONTRASENA,
      options: {
        data: metadataSinDni(),
      },
    })

    expect(error).not.toBeNull()

    const { data: perfiles } = await admin.from('perfiles').select('id').eq('email', email)
    expect(perfiles ?? []).toHaveLength(0)
  })

  it('dos registros sin DNI fallan los dos sin dejar un perfil con dni = ""', async () => {
    const anon = clientePublico()
    const admin = clienteDeServicio()

    for (const sufijo of ['a', 'b']) {
      const { error } = await anon.auth.signUp({
        email: emailDePrueba(`sin-dni-${sufijo}`),
        password: CONTRASENA,
        options: {
          data: metadataSinDni(),
        },
      })

      expect(error).not.toBeNull()
    }

    const { data: conDniVacio } = await admin.from('perfiles').select('id').eq('dni', '')
    expect(conDniVacio ?? []).toHaveLength(0)
  })

  it('el cambio de email en Auth se sincroniza al perfil', async () => {
    const anon = clientePublico()
    const admin = clienteDeServicio()
    const email = emailDePrueba('email')

    const { data } = await anon.auth.signUp({
      email,
      password: CONTRASENA,
      options: { data: metadataUnica() },
    })
    if (!data?.user) throw new Error('el registro debería haber creado el usuario')

    const nuevoEmail = emailDePrueba('email-nuevo')
    const { error } = await admin.auth.admin.updateUserById(data.user.id, {
      email: nuevoEmail,
      email_confirm: true,
    })
    expect(error).toBeNull()

    const { data: perfil } = await admin
      .from('perfiles')
      .select('email')
      .eq('id', data.user.id)
      .maybeSingle()

    expect(perfil?.email).toBe(nuevoEmail)
  })
})

function clientePublico(): SupabaseClient {
  return createClient(urlDePrueba(), clavePublicaDePrueba(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function clienteDeServicio(): SupabaseClient {
  return createClient(urlDePrueba(), claveDeServicioDePrueba(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
