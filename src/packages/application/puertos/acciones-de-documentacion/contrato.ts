import { describe, expect, it } from 'vitest'
import type { EstadoPostulacion } from '@tfi/domain'
import type { AccionesDeDocumentacion } from './puerto'

export interface EntornoDeAccionesDeDocumentacion {
  acciones: AccionesDeDocumentacion
  /** Crea una Postulación en el estado pedido y devuelve su id. */
  crearPostulacion: (estado: EstadoPostulacion) => Promise<string>
  /** Estado persistido actual, o null si no existe. */
  estadoDe: (postulacionId: string) => Promise<EstadoPostulacion | null>
}

/** Contrato de las transiciones de documentación de una Postulación. */
export function probarContratoDeAccionesDeDocumentacion(
  crearEntorno: () =>
    | EntornoDeAccionesDeDocumentacion
    | Promise<EntornoDeAccionesDeDocumentacion>,
) {
  describe('contrato: AccionesDeDocumentacion', () => {
    it('mueve ESPERANDO_DOCUMENTACION a DOCUMENTACION_EN_REVISION', async () => {
      const { acciones, crearPostulacion, estadoDe } = await crearEntorno()
      const id = await crearPostulacion('ESPERANDO_DOCUMENTACION')

      expect(await acciones.transicionar(id, 'DOCUMENTACION_EN_REVISION')).toBe('OK')
      expect(await estadoDe(id)).toBe('DOCUMENTACION_EN_REVISION')
    })

    it('mueve DOCUMENTACION_EN_REVISION a OBSERVADO y a VALIDADA', async () => {
      const { acciones, crearPostulacion, estadoDe } = await crearEntorno()
      const observada = await crearPostulacion('DOCUMENTACION_EN_REVISION')
      const validada = await crearPostulacion('DOCUMENTACION_EN_REVISION')

      expect(await acciones.transicionar(observada, 'OBSERVADO')).toBe('OK')
      expect(await estadoDe(observada)).toBe('OBSERVADO')

      expect(await acciones.transicionar(validada, 'DOCUMENTACION_VALIDADA')).toBe('OK')
      expect(await estadoDe(validada)).toBe('DOCUMENTACION_VALIDADA')
    })

    it('rechaza una transición que no está en el grafo', async () => {
      const { acciones, crearPostulacion, estadoDe } = await crearEntorno()
      const id = await crearPostulacion('VACANTE_CONFIRMADA')

      expect(await acciones.transicionar(id, 'DOCUMENTACION_VALIDADA')).toBe(
        'TRANSICION_INVALIDA',
      )
      expect(await estadoDe(id)).toBe('VACANTE_CONFIRMADA')
    })

    it('devuelve NO_ENCONTRADA para una Postulación inexistente', async () => {
      const { acciones } = await crearEntorno()

      expect(await acciones.transicionar('no-existe', 'DOCUMENTACION_EN_REVISION')).toBe(
        'NO_ENCONTRADA',
      )
    })
  })
}
