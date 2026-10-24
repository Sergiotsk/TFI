import { describe, expect, it } from 'vitest'
import type { RegistroDeCargas } from './puerto'

export interface EntornoDeRegistroDeCargas {
  cargas: RegistroDeCargas
  institucionId: string
  /** Perfil de Tesorería de la institución. */
  cargadaPor: string
}

/** Contrato de `RegistroDeCargas` (contracts/puertos.md). */
export function probarContratoDeRegistroDeCargas(
  crearEntorno: () => EntornoDeRegistroDeCargas | Promise<EntornoDeRegistroDeCargas>,
) {
  describe('contrato: RegistroDeCargas', () => {
    it('iniciar() abre la carga con el resumen en cero', async () => {
      const { cargas, institucionId, cargadaPor } = await crearEntorno()

      const carga = await cargas.iniciar(institucionId, cargadaPor, 'informe.csv')

      expect(carga.institucionId).toBe(institucionId)
      expect(carga.cargadaPor).toBe(cargadaPor)
      expect(carga.nombreArchivo).toBe('informe.csv')
      expect(carga.resumen).toEqual({ acreditados: 0, aDecidir: 0, noImputados: 0, duplicados: 0 })
    })

    it('cerrar() persiste el resumen', async () => {
      const { cargas, institucionId, cargadaPor } = await crearEntorno()
      const carga = await cargas.iniciar(institucionId, cargadaPor, 'informe.csv')
      const resumen = { acreditados: 3, aDecidir: 1, noImputados: 2, duplicados: 4 }

      await cargas.cerrar(carga.id, resumen)

      const guardada = (await cargas.listar(institucionId)).find((c) => c.id === carga.id)
      expect(guardada?.resumen).toEqual(resumen)
    })

    it('listar() ordena de la más reciente a la más vieja', async () => {
      const { cargas, institucionId, cargadaPor } = await crearEntorno()
      const vieja = await cargas.iniciar(institucionId, cargadaPor, 'vieja.csv')
      const nueva = await cargas.iniciar(institucionId, cargadaPor, 'nueva.csv')

      const ids = (await cargas.listar(institucionId)).map((c) => c.id)

      expect(ids.indexOf(nueva.id)).toBeLessThan(ids.indexOf(vieja.id))
    })
  })
}
