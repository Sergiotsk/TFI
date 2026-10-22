import { describe, expect, it } from 'vitest'
import { Perfil, type Rol } from '@tfi/domain'
import type { RepositorioDePerfiles } from './puerto'

// Los ids tienen que ser unicos por corrida: contra una base real, guardar dos
// veces el mismo id choca contra la clave primaria.
let contador = 0

function idUnico(): string {
  contador += 1
  return `perfil-${Date.now().toString(36)}-${contador}`
}

function perfilDePrueba(id: string, rol: Rol): Perfil {
  return new Perfil(
    id,
    `perfil.${id}@example.com`,
    'Ana',
    'García',
    '10000001',
    '20100000013',
    new Date('1990-05-15'),
    'F',
    '1122334455',
    'Calle Falsa 123',
    rol,
    '00000000-0000-0000-0000-000000000001',
    true,
    new Date(),
    new Date(),
  )
}

/**
 * Contrato del puerto de perfiles.
 *
 * `escritura` viene en false para el adaptador real: el alta del perfil la hace
 * el trigger `crear_perfil_al_registrarse`, en la misma transacción que el
 * usuario de Supabase Auth. RLS y los GRANT no permiten escribir la fila desde
 * la app, así que el adaptador real no implementa `guardar()` (tarea T045b).
 */
export function probarContratoRepositorioDePerfiles(
  crearRepositorio: () => RepositorioDePerfiles,
  opciones: { escritura?: boolean } = {},
) {
  const escritura = opciones.escritura ?? true

  describe('contrato: RepositorioDePerfiles', () => {
    it('obtenerTodos() devuelve una lista', async () => {
      const repositorio = crearRepositorio()
      const perfiles = await repositorio.obtenerTodos()
      expect(Array.isArray(perfiles)).toBe(true)
    })

    it('obtenerPorId() devuelve null cuando el perfil no existe', async () => {
      const repositorio = crearRepositorio()
      const perfil = await repositorio.obtenerPorId(idUnico())
      expect(perfil).toBeNull()
    })

    it('obtenerPorRol() devuelve solo perfiles con ese rol', async () => {
      const repositorio = crearRepositorio()
      const porRol = await repositorio.obtenerPorRol('SECRETARIA')
      expect(Array.isArray(porRol)).toBe(true)
      expect(porRol?.every((p) => p.rol === 'SECRETARIA')).toBe(true)
    })

    it.runIf(escritura)('guardar() y obtenerPorId() devuelven el mismo perfil', async () => {
      const repositorio = crearRepositorio()
      const id = idUnico()
      const perfil = perfilDePrueba(id, 'ASPIRANTE')

      await repositorio.guardar(perfil)

      const guardado = await repositorio.obtenerPorId(id)
      expect(guardado).not.toBeNull()
      expect(guardado?.email).toBe(perfil.email)
      expect(guardado?.rol).toBe('ASPIRANTE')
      expect(guardado?.institucionId).toBe(perfil.institucionId)
    })
  })
}
