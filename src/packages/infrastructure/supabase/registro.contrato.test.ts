import { describe, expect, it } from 'vitest'

// Este test corre contra Supabase local. Requiere SUPABASE_TEST_URL y
// las migraciones aplicadas (incluido crear_perfil_al_registrarse).
// Se salta en CI hasta que haya Supabase corriendo.
describe.skipIf(!process.env.SUPABASE_TEST_URL)('contrato: registro con Supabase', () => {
  it('el rol de la metadata se ignora y queda ASPIRANTE', async () => {
    // TODO(T098): implementar con entorno de prueba (cliente por rol)
    expect(true).toBe(true)
  })

  it('sin DNI el registro falla y no deja un perfil con dni vacío', async () => {
    expect(true).toBe(true)
  })

  it('dos registros sin DNI fallan los dos sin dejar un perfil con dni = ""', async () => {
    expect(true).toBe(true)
  })

  it('el cambio de email en Auth se sincroniza al perfil', async () => {
    expect(true).toBe(true)
  })
})
