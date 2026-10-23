import { describe, expect, it } from 'vitest'
import { RepositorioDeDocumentosFake } from './fake'
import { probarContratoRepositorioDeDocumentos } from './contrato'

let contador = 0

function idUnico(prefijo: string): string {
  contador += 1
  return `${prefijo}-${Date.now().toString(36)}-${contador}`
}

// El fake tiene que cumplir el mismo contrato que el adaptador real: por eso
// se corre la misma suite, escrita una sola vez.
probarContratoRepositorioDeDocumentos(() => ({
  repositorio: new RepositorioDeDocumentosFake(),
  crearIdDocumento: () => idUnico('doc'),
  crearPostulacion: async () => idUnico('postulacion'),
}))

describe('contrato: RepositorioDeDocumentosFake', () => {
  it('viene sembrado con documentos', async () => {
    const repositorio = new RepositorioDeDocumentosFake()
    const pagina = await repositorio.listar({}, { pagina: 1, porPagina: 100 })
    expect(pagina.items.length).toBeGreaterThan(0)
  })
})
