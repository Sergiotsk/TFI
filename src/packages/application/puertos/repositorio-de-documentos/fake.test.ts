import { describe, expect, it } from 'vitest'
import { RepositorioDeDocumentosFake } from './fake'
import { probarContratoRepositorioDeDocumentos } from './contrato'

// El fake tiene que cumplir el mismo contrato que el adaptador real: por eso
// se corre la misma suite, escrita una sola vez.
probarContratoRepositorioDeDocumentos(() => new RepositorioDeDocumentosFake())

describe('contrato: RepositorioDeDocumentosFake', () => {
  it('viene sembrado con documentos', async () => {
    const repositorio = new RepositorioDeDocumentosFake()
    const pagina = await repositorio.listar({}, { pagina: 1, porPagina: 100 })
    expect(pagina.items.length).toBeGreaterThan(0)
  })
})
