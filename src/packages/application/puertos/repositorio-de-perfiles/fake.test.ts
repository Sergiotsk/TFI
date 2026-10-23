import { describe, expect, it } from 'vitest'
import { RepositorioDePerfilesFake } from './fake'
import { probarContratoRepositorioDePerfiles } from './contrato'

// El fake tiene que cumplir el mismo contrato que el adaptador real: por eso
// se corre la misma suite, escrita una sola vez.
probarContratoRepositorioDePerfiles(() => new RepositorioDePerfilesFake())

describe('contrato: RepositorioDePerfilesFake', () => {
  it('viene sembrado con un perfil por rol del personal', async () => {
    const repositorio = new RepositorioDePerfilesFake()
    const todos = await repositorio.listar({}, { pagina: 1, porPagina: 100 })
    expect(todos.items.length).toBeGreaterThan(0)

    const porRol = await repositorio.listar(
      { rol: 'TESORERIA' },
      { pagina: 1, porPagina: 100 },
    )
    expect(porRol.items.length).toBe(1)
    expect(porRol.items[0]?.rol).toBe('TESORERIA')
  })
})
