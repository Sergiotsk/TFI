import { describe, expect, it } from 'vitest'
import { Perfil, type Rol } from '@tfi/domain'
import { PAGINACION_POR_DEFECTO } from '../../paginacion'
import type { RepositorioDePerfiles } from './puerto'

// Los ids tienen que ser unicos por corrida: contra una base real, guardar dos
// veces el mismo id choca contra la clave primaria.
let contador = 0
let dniContador = 20_000_000

function idUnico(): string {
  contador += 1
  return `perfil-${Date.now().toString(36)}-${contador}`
}

function perfilDePrueba(id: string, rol: Rol): Perfil {
  dniContador += 1
  const dni = String(dniContador)
  const cuil = `20${dni.padStart(8, '0')}3`

  return new Perfil(
    id,
    `perfil.${id}@example.com`,
    'Ana',
    'García',
    dni,
    cuil,
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
    it('listar() devuelve una página de perfiles', async () => {
      const repositorio = crearRepositorio()
      const pagina = await repositorio.listar({}, PAGINACION_POR_DEFECTO)
      expect(Array.isArray(pagina.items)).toBe(true)
      expect(pagina.total).toBeGreaterThanOrEqual(pagina.items.length)
    })

    it('listar() filtra por rol', async () => {
      const repositorio = crearRepositorio()
      const pagina = await repositorio.listar(
        { rol: 'SECRETARIA' },
        PAGINACION_POR_DEFECTO,
      )
      expect(pagina.items.every((p) => p.rol === 'SECRETARIA')).toBe(true)
    })

    it('obtenerPorId() devuelve null cuando el perfil no existe', async () => {
      const repositorio = crearRepositorio()
      const perfil = await repositorio.obtenerPorId(idUnico())
      expect(perfil).toBeNull()
    })

    it('buscarPorDni() devuelve null cuando no existe', async () => {
      const repositorio = crearRepositorio()
      expect(await repositorio.buscarPorDni('00000000')).toBeNull()
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
