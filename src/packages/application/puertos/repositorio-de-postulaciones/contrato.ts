import { describe, expect, it } from 'vitest'
import { NumeroDePostulacion, PostulacionDuplicada } from '@tfi/domain'
import type { PeriodoDeIngreso, Postulacion } from '@tfi/domain'
import type { DatosDePostulacionSembrada } from './fake'
import type { RepositorioDePostulaciones } from './puerto'

export interface DatosDePeriodoDePrueba {
  nombre?: string
  institucionId?: string
  totalCupos?: number
  cierraEl?: Date
  diasPlazoPago?: number
  montoMatriculaCentavos?: number
}

/**
 * Lo que necesita la suite para armar sus datos: el repositorio, un aspirante
 * con DNI y un período. El fake lo resuelve en memoria; el adaptador, contra
 * Supabase con la clave de servicio.
 */
export interface EntornoDePostulaciones {
  repositorio: RepositorioDePostulaciones
  /** Crea un aspirante con ese DNI y devuelve su id (el de `perfiles`). */
  crearAspirante: (dni: string) => Promise<string>
  /** Crea un período abierto por defecto y lo devuelve. */
  crearPeriodo: (datos?: DatosDePeriodoDePrueba) => Promise<PeriodoDeIngreso>
  /** Deja una Postulación en el estado pedido, salteando la máquina (fixture). */
  sembrarPostulacion: (datos: DatosDePostulacionSembrada) => Promise<Postulacion>
}

let contador = 0

function dniUnico(): string {
  contador += 1
  return String(10_000_000 + ((Date.now() + contador) % 89_000_000))
}

function unDiaDespues(ahora: Date): Date {
  return new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * Contrato de `RepositorioDePostulaciones`. Corre contra el fake y contra el
 * adaptador de Supabase (T035/T046).
 */
export function probarContratoDeRepositorioDePostulaciones(
  crearEntorno: () => EntornoDePostulaciones | Promise<EntornoDePostulaciones>,
) {
  describe('contrato: RepositorioDePostulaciones', () => {
    it('obtenerPorId() devuelve null cuando la Postulación no existe', async () => {
      const { repositorio } = await crearEntorno()

      expect(await repositorio.obtenerPorId('no-existe')).toBeNull()
    })

    it('obtenerPorNumero() devuelve null cuando la Postulación no existe', async () => {
      const { repositorio } = await crearEntorno()

      expect(await repositorio.obtenerPorNumero(NumeroDePostulacion.desde(1))).toBeNull()
    })

    it('crear() deja la Postulación en PREINSCRIPTO, con número y sin vencimiento', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const aspiranteId = await crearAspirante(dniUnico())
      const periodo = await crearPeriodo()

      const creada = await repositorio.crear(aspiranteId, periodo.id)

      expect(creada.estado).toBe('PREINSCRIPTO')
      expect(creada.venceEl).toBeNull()
      expect(creada.numero.valor).toBeGreaterThan(0)
      expect(creada.aspiranteId).toBe(aspiranteId)
      expect(creada.periodoId).toBe(periodo.id)
    })

    it('crear() asigna números únicos y crecientes', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const periodo = await crearPeriodo()

      const primera = await repositorio.crear(await crearAspirante(dniUnico()), periodo.id)
      const segunda = await repositorio.crear(await crearAspirante(dniUnico()), periodo.id)

      expect(segunda.numero.valor).toBeGreaterThan(primera.numero.valor)
    })

    it('crear() dos veces para el mismo aspirante y período falla', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const aspiranteId = await crearAspirante(dniUnico())
      const periodo = await crearPeriodo()
      await repositorio.crear(aspiranteId, periodo.id)

      await expect(repositorio.crear(aspiranteId, periodo.id)).rejects.toThrow(PostulacionDuplicada)
    })

    it('crear() deja crear otra Postulación si la anterior está VENCIDA', async () => {
      const { repositorio, crearAspirante, crearPeriodo, sembrarPostulacion } = await crearEntorno()
      const aspiranteId = await crearAspirante(dniUnico())
      const periodo = await crearPeriodo()
      await sembrarPostulacion({
        aspiranteId,
        periodoId: periodo.id,
        estado: 'VENCIDO',
        venceEl: unDiaDespues(new Date('2020-01-01T00:00:00.000Z')),
      })

      const creada = await repositorio.crear(aspiranteId, periodo.id)

      expect(creada.estado).toBe('PREINSCRIPTO')
    })

    it('guardarTransicion() persiste el estado y el vencimiento', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const aspiranteId = await crearAspirante(dniUnico())
      const periodo = await crearPeriodo()
      const creada = await repositorio.crear(aspiranteId, periodo.id)
      const venceEl = periodo.calcularVencimiento(new Date())

      const resultado = await repositorio.guardarTransicion(
        creada,
        creada.iniciarPago(venceEl, new Date()),
      )

      expect(resultado).toBe('ok')
      const guardada = await repositorio.obtenerPorId(creada.id)
      expect(guardada?.estado).toBe('PAGO_PENDIENTE')
      expect(guardada?.venceEl?.getTime()).toBe(venceEl.getTime())
    })

    it('guardarTransicion() con un antes desactualizado devuelve conflicto y no escribe', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const creada = await repositorio.crear(await crearAspirante(dniUnico()), (await crearPeriodo()).id)
      const venceEl = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      const enPago = creada.iniciarPago(venceEl, new Date())
      await repositorio.guardarTransicion(creada, enPago)

      const reintento = await repositorio.guardarTransicion(creada, enPago)

      expect(reintento).toBe('conflicto')
      expect((await repositorio.obtenerPorId(creada.id))?.estado).toBe('PAGO_PENDIENTE')
    })

    it('listar() filtra por período, aspirante y estado', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const periodoA = await crearPeriodo()
      const periodoB = await crearPeriodo()
      const aspirante = await crearAspirante(dniUnico())
      const otroAspirante = await crearAspirante(dniUnico())
      await repositorio.crear(aspirante, periodoA.id)
      await repositorio.crear(aspirante, periodoB.id)
      await repositorio.crear(otroAspirante, periodoA.id)

      const delPeriodo = await repositorio.listar({ periodoId: periodoA.id })
      expect(delPeriodo).toHaveLength(2)
      expect(delPeriodo.every((p) => p.periodoId === periodoA.id)).toBe(true)

      const delAspirante = await repositorio.listar({
        periodoId: periodoA.id,
        aspiranteId: aspirante,
      })
      expect(delAspirante).toHaveLength(1)
      expect(delAspirante[0]?.id).toBeDefined()

      const preinscriptos = await repositorio.listar({
        periodoId: periodoA.id,
        estado: 'PREINSCRIPTO',
      })
      expect(preinscriptos).toHaveLength(2)

      const confirmadas = await repositorio.listar({
        periodoId: periodoA.id,
        estado: 'VACANTE_CONFIRMADA',
      })
      expect(confirmadas).toHaveLength(0)
    })

    it('listar() devuelve ordenado por número ascendente', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const periodo = await crearPeriodo()
      const primera = await repositorio.crear(await crearAspirante(dniUnico()), periodo.id)
      const segunda = await repositorio.crear(await crearAspirante(dniUnico()), periodo.id)

      const lista = await repositorio.listar({ periodoId: periodo.id })

      expect(lista.map((p) => p.id)).toEqual([primera.id, segunda.id])
    })

    it('listar() filtra por motivo de revisión', async () => {
      const { repositorio, crearAspirante, crearPeriodo, sembrarPostulacion } = await crearEntorno()
      const periodo = await crearPeriodo()
      const aspiranteId = await crearAspirante(dniUnico())
      await sembrarPostulacion({
        aspiranteId,
        periodoId: periodo.id,
        estado: 'PAGO_EN_REVISION',
        motivoRevision: 'SIN_CUPO',
      })
      await sembrarPostulacion({
        aspiranteId: await crearAspirante(dniUnico()),
        periodoId: periodo.id,
        estado: 'PAGO_EN_REVISION',
        motivoRevision: 'FUERA_DE_PLAZO',
      })

      const sinCupo = await repositorio.listar({ periodoId: periodo.id, motivoRevision: 'SIN_CUPO' })

      expect(sinCupo).toHaveLength(1)
      expect(sinCupo[0]?.motivoRevision).toBe('SIN_CUPO')
    })

    it('buscarPorDni() devuelve cualquier estado y respeta el período', async () => {
      const { repositorio, crearAspirante, crearPeriodo } = await crearEntorno()
      const dni = dniUnico()
      const aspiranteId = await crearAspirante(dni)
      const periodoA = await crearPeriodo()
      const periodoB = await crearPeriodo()
      const enA = await repositorio.crear(aspiranteId, periodoA.id)
      await repositorio.crear(aspiranteId, periodoB.id)

      const todas = await repositorio.buscarPorDni(dni)
      expect(todas).toHaveLength(2)

      const soloA = await repositorio.buscarPorDni(dni, periodoA.id)
      expect(soloA).toHaveLength(1)
      expect(soloA[0]?.id).toBe(enA.id)

      expect(await repositorio.buscarPorDni(dniUnico())).toHaveLength(0)
    })
  })
}
