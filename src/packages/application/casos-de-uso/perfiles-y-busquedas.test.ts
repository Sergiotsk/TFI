import { describe, expect, it } from 'vitest'
import type { Actor } from './actor'
import { ActualizarPerfilPropioUseCase } from './actualizar-perfil-propio'
import { BuscarPostulacionesPorDniUseCase } from './buscar-postulaciones-por-dni'
import { DatosDuplicados, NoAutorizado, NoEncontrado } from './errores'
import { ListarPerfilesUseCase } from './listar-perfiles'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const INSTITUCION = '00000000-0000-0000-0000-000000000001'

const aspirante: Actor = {
  perfilId: '1',
  rol: 'ASPIRANTE',
  institucionId: INSTITUCION,
}

const secretaria: Actor = {
  perfilId: '2',
  rol: 'SECRETARIA',
  institucionId: INSTITUCION,
}

describe('ActualizarPerfilPropio', () => {
  it('cambia los datos personales y conserva DNI, rol, email e institución', async () => {
    const perfiles = new RepositorioDePerfilesFake()
    const caso = new ActualizarPerfilPropioUseCase(perfiles)
    const antes = await perfiles.obtenerPorId('1')

    const actualizado = await caso.ejecutar(aspirante, {
      nombre: 'Juan Carlos',
      telefono: '3511234567',
      direccion: null,
    })

    expect(actualizado.nombre).toBe('Juan Carlos')
    expect(actualizado.telefono).toBe('3511234567')
    expect(actualizado.direccion).toBeNull()
    expect(actualizado.dni).toBe(antes?.dni)
    expect(actualizado.email).toBe(antes?.email)
    expect(actualizado.rol).toBe(antes?.rol)
    expect(actualizado.institucionId).toBe(antes?.institucionId)
  })

  it('no deja duplicar el CUIL de otra persona', async () => {
    const perfiles = new RepositorioDePerfilesFake()
    const caso = new ActualizarPerfilPropioUseCase(perfiles)

    await expect(
      caso.ejecutar(aspirante, { cuil: '27100000024' }),
    ).rejects.toThrow(DatosDuplicados)
  })

  it('falla si el perfil del actor no existe', async () => {
    const perfiles = new RepositorioDePerfilesFake()
    const caso = new ActualizarPerfilPropioUseCase(perfiles)
    const fantasma: Actor = { ...aspirante, perfilId: 'no-existe' }

    await expect(caso.ejecutar(fantasma, { nombre: 'Otro' })).rejects.toThrow(NoEncontrado)
  })
})

describe('ListarPerfiles', () => {
  it('el personal lista y pagina, con filtros por rol y DNI', async () => {
    const perfiles = new RepositorioDePerfilesFake()
    const caso = new ListarPerfilesUseCase(perfiles)

    const pagina = await caso.ejecutar(secretaria, {}, { pagina: 1, porPagina: 2 })
    expect(pagina.items).toHaveLength(2)
    expect(pagina.total).toBe(4)
    expect(pagina.totalPaginas).toBe(2)

    const porRol = await caso.ejecutar(
      secretaria,
      { rol: 'DIRECCION' },
      { pagina: 1, porPagina: 20 },
    )
    expect(porRol.items.map((p) => p.id)).toEqual(['3'])

    const porDni = await caso.ejecutar(
      secretaria,
      { dni: '10000004' },
      { pagina: 1, porPagina: 20 },
    )
    expect(porDni.items.map((p) => p.id)).toEqual(['4'])
  })

  it('un aspirante no puede listar perfiles', async () => {
    const caso = new ListarPerfilesUseCase(new RepositorioDePerfilesFake())

    await expect(
      caso.ejecutar(aspirante, {}, { pagina: 1, porPagina: 20 }),
    ).rejects.toThrow(NoAutorizado)
  })
})

describe('BuscarPostulacionesPorDni', () => {
  function armar() {
    const postulaciones = new RepositorioDePostulacionesFake()
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
      dni: '30123456',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-2',
      estado: 'VACANTE_CONFIRMADA',
      dni: '30123456',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'VENCIDO',
      dni: '30123456',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-4',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
      dni: '40999999',
    })

    return {
      caso: new BuscarPostulacionesPorDniUseCase(postulaciones, new RelojFijo(AHORA)),
    }
  }

  it('devuelve todo el historial de la persona, en cualquier estado', async () => {
    const { caso } = armar()

    const pagina = await caso.ejecutar(secretaria, '30.123.456')

    expect(pagina.total).toBe(3)
    expect(pagina.items.map((p) => p.estado).sort()).toEqual(
      ['PREINSCRIPTO', 'VACANTE_CONFIRMADA', 'VENCIDO'].sort(),
    )
  })

  it('filtra por período y pagina', async () => {
    const { caso } = armar()

    const pagina = await caso.ejecutar(secretaria, '30123456', 'periodo-1', {
      pagina: 1,
      porPagina: 1,
    })

    expect(pagina.total).toBe(2)
    expect(pagina.items).toHaveLength(1)
    expect(pagina.totalPaginas).toBe(2)
  })

  it('un aspirante no puede buscar por DNI', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar(aspirante, '30123456')).rejects.toThrow(NoAutorizado)
  })
})
