import { describe, expect, it } from 'vitest'
import type { EstadoPostulacion } from '@tfi/domain'
import type { AccionesDelPersonal } from './puerto'

export interface DatosDeSiembraDeAccion {
  estado: Extract<EstadoPostulacion, 'PREINSCRIPTO' | 'PAGO_PENDIENTE' | 'VENCIDO'>
  totalCupos?: number
  cierraEl?: Date
  venceEl?: Date | null
}

export interface EntornoDeAccionesDelPersonal {
  acciones: AccionesDelPersonal
  /** Deja una Postulación en el estado pedido y devuelve los ids. */
  sembrar: (datos: DatosDeSiembraDeAccion) => Promise<{
    postulacionId: string
    periodoId: string
  }>
  /** Llena un período con Postulaciones confirmadas (para probar el cupo). */
  sembrarOcupados: (periodoId: string, cantidad: number) => Promise<void>
  ahora: () => Date
}

/**
 * Contrato de `AccionesDelPersonal`.
 *
 * Corre contra el fake. El adaptador de Supabase necesita una sesión real de un
 * usuario del personal para resolver `auth.uid()` y el rol, así que su
 * verificación queda para el entorno de integración.
 */
export function probarContratoDeAccionesDelPersonal(
  crearEntorno: () => EntornoDeAccionesDelPersonal | Promise<EntornoDeAccionesDelPersonal>,
) {
  describe('contrato: AccionesDelPersonal', () => {
    it('confirmarVacante() acredita una PAGO_PENDIENTE con cupo', async () => {
      const { acciones, sembrar } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE', totalCupos: 10 })

      const resultado = await acciones.confirmarVacante(postulacionId)

      expect(resultado.resultado).toBe('OK')
      if (resultado.resultado === 'OK') {
        expect(resultado.postulacion.estado).toBe('VACANTE_CONFIRMADA')
      }
    })

    it('confirmarVacante() también acredita una VENCIDO', async () => {
      const { acciones, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({
        estado: 'VENCIDO',
        venceEl: new Date(ahora().getTime() - 1000),
      })

      const resultado = await acciones.confirmarVacante(postulacionId)

      expect(resultado.resultado).toBe('OK')
      if (resultado.resultado === 'OK') {
        expect(resultado.postulacion.estado).toBe('VACANTE_CONFIRMADA')
      }
    })

    it('confirmarVacante() devuelve SIN_CUPO si el período está lleno', async () => {
      const { acciones, sembrar, sembrarOcupados } = await crearEntorno()
      const { postulacionId, periodoId } = await sembrar({
        estado: 'PAGO_PENDIENTE',
        totalCupos: 1,
      })
      await sembrarOcupados(periodoId, 1)

      expect(await acciones.confirmarVacante(postulacionId)).toEqual({ resultado: 'SIN_CUPO' })
    })

    it('confirmarVacante() devuelve CONFLICTO desde un estado que no se confirma', async () => {
      const { acciones, sembrar } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PREINSCRIPTO' })

      expect(await acciones.confirmarVacante(postulacionId)).toEqual({ resultado: 'CONFLICTO' })
    })

    it('confirmarVacante() devuelve NO_ENCONTRADA para un id inexistente', async () => {
      const { acciones } = await crearEntorno()

      expect(await acciones.confirmarVacante('no-existe')).toEqual({
        resultado: 'NO_ENCONTRADA',
      })
    })

    it('prorrogarPlazo() extiende una PAGO_PENDIENTE', async () => {
      const { acciones, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE' })
      const nuevo = new Date(ahora().getTime() + 20 * 24 * 60 * 60 * 1000)

      const resultado = await acciones.prorrogarPlazo(postulacionId, nuevo)

      expect(resultado.resultado).toBe('OK')
      if (resultado.resultado === 'OK') {
        expect(resultado.postulacion.estado).toBe('PAGO_PENDIENTE')
        expect(resultado.postulacion.venceEl).toEqual(nuevo)
      }
    })

    it('prorrogarPlazo() reactiva una VENCIDO', async () => {
      const { acciones, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({
        estado: 'VENCIDO',
        venceEl: new Date(ahora().getTime() - 1000),
      })
      const nuevo = new Date(ahora().getTime() + 2 * 24 * 60 * 60 * 1000)

      const resultado = await acciones.prorrogarPlazo(postulacionId, nuevo)

      expect(resultado.resultado).toBe('OK')
      if (resultado.resultado === 'OK') {
        expect(resultado.postulacion.estado).toBe('PAGO_PENDIENTE')
        expect(resultado.postulacion.venceEl).toEqual(nuevo)
      }
    })

    it('prorrogarPlazo() no acepta un vencimiento posterior al cierre', async () => {
      const { acciones, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({
        estado: 'PAGO_PENDIENTE',
        cierraEl: new Date(ahora().getTime() + 24 * 60 * 60 * 1000),
      })
      const nuevo = new Date(ahora().getTime() + 3 * 24 * 60 * 60 * 1000)

      expect(await acciones.prorrogarPlazo(postulacionId, nuevo)).toEqual({
        resultado: 'PERIODO_CERRADO',
      })
    })

    it('prorrogarPlazo() devuelve CONFLICTO desde un estado que no se prorroga', async () => {
      const { acciones, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PREINSCRIPTO' })

      expect(
        await acciones.prorrogarPlazo(postulacionId, new Date(ahora().getTime() + 1000)),
      ).toEqual({ resultado: 'CONFLICTO' })
    })
  })
}
