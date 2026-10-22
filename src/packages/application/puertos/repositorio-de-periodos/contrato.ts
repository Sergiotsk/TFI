import { describe, expect, it } from 'vitest'
import type { PeriodoDeIngreso, Postulacion } from '@tfi/domain'
import type { DatosDePostulacionSembrada } from '../repositorio-de-postulaciones/fake'
import type { DatosDePeriodoDePrueba } from '../repositorio-de-postulaciones/contrato'
import type { RepositorioDePeriodos } from './puerto'

/**
 * Lo que necesita la suite de períodos. Reusa el entorno de Postulaciones
 * porque la ocupación no se puede verificar sin Postulaciones de verdad.
 */
export interface EntornoDePeriodos {
  repositorio: RepositorioDePeriodos
  /** Institución cuyos períodos se listan en los tests. */
  institucionId: string
  /** Otra institución, para verificar que el listado no mezcla. */
  otraInstitucionId: string
  crearAspirante: (dni: string) => Promise<string>
  crearPeriodo: (datos?: DatosDePeriodoDePrueba) => Promise<PeriodoDeIngreso>
  sembrarPostulacion: (datos: DatosDePostulacionSembrada) => Promise<Postulacion>
}

const UN_DIA = 24 * 60 * 60 * 1000

let contador = 0

function dniUnico(): string {
  contador += 1
  return String(30_000_000 + ((Date.now() + contador) % 69_000_000))
}

/**
 * Contrato de `RepositorioDePeriodos`. Corre contra el fake y contra el
 * adaptador de Supabase (T046).
 */
export function probarContratoDeRepositorioDePeriodos(
  crearEntorno: () => EntornoDePeriodos | Promise<EntornoDePeriodos>,
) {
  describe('contrato: RepositorioDePeriodos', () => {
    it('obtenerPorId() devuelve null cuando el período no existe', async () => {
      const { repositorio } = await crearEntorno()

      expect(await repositorio.obtenerPorId('no-existe')).toBeNull()
    })

    it('guardar() y obtenerPorId() hacen round-trip', async () => {
      const { repositorio, crearPeriodo } = await crearEntorno()
      const periodo = await crearPeriodo({ totalCupos: 37 })
      await repositorio.guardar(periodo)

      const guardado = await repositorio.obtenerPorId(periodo.id)

      expect(guardado?.totalCupos).toBe(37)
      expect(guardado?.nombre).toBe(periodo.nombre)
    })

    it('listarAbiertos() devuelve solo los abiertos de esa institución', async () => {
      const { repositorio, institucionId, otraInstitucionId, crearPeriodo } = await crearEntorno()
      const ahora = new Date()
      const abierto = await crearPeriodo({ institucionId })
      const cerrado = await crearPeriodo({
        institucionId,
        cierraEl: new Date(ahora.getTime() - UN_DIA),
      })
      const otraInstitucion = await crearPeriodo({ institucionId: otraInstitucionId })

      const abiertos = await repositorio.listarAbiertos(institucionId, ahora)

      expect(abiertos.map((p) => p.id)).toEqual([abierto.id])
      expect(abiertos.map((p) => p.id)).not.toContain(cerrado.id)
      expect(abiertos.map((p) => p.id)).not.toContain(otraInstitucion.id)
    })

    it('contarOcupados() cuenta las vacantes confirmadas y posteriores', async () => {
      const { repositorio, crearPeriodo, crearAspirante, sembrarPostulacion } = await crearEntorno()
      const periodo = await crearPeriodo()
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'VACANTE_CONFIRMADA',
      })
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'ESPERANDO_DOCUMENTACION',
      })
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'PAGO_PENDIENTE',
        venceEl: new Date(Date.now() + UN_DIA),
      })
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'PAGO_EN_REVISION',
        motivoRevision: 'SIN_CUPO',
      })

      expect(await repositorio.contarOcupados(periodo.id)).toBe(2)
    })

    it('contarPendientesVigentes() no cuenta las que ya vencieron', async () => {
      const { repositorio, crearPeriodo, crearAspirante, sembrarPostulacion } = await crearEntorno()
      const periodo = await crearPeriodo()
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'PAGO_PENDIENTE',
        venceEl: new Date(Date.now() + UN_DIA),
      })
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'PAGO_PENDIENTE',
        venceEl: new Date(Date.now() - UN_DIA),
      })

      expect(await repositorio.contarPendientesVigentes(periodo.id, new Date())).toBe(1)
    })

    it('contarOcupados() no mezcla períodos', async () => {
      const { repositorio, crearPeriodo, crearAspirante, sembrarPostulacion } = await crearEntorno()
      const periodoA = await crearPeriodo()
      const periodoB = await crearPeriodo()
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodoA.id,
        estado: 'VACANTE_CONFIRMADA',
      })

      expect(await repositorio.contarOcupados(periodoA.id)).toBe(1)
      expect(await repositorio.contarOcupados(periodoB.id)).toBe(0)
    })
  })
}
