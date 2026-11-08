import { describe, expect, it } from 'vitest'
import {
  Monto,
  ReferenciaDePago,
  type EstadoPostulacion,
  type PagoInformado,
} from '@tfi/domain'
import type { RegistroDePagos } from './puerto'

const UN_DIA = 24 * 60 * 60 * 1000

/** Matrícula de los períodos que siembra el entorno. */
export const MATRICULA_DE_PRUEBA_CENTAVOS = 1_500_000

export interface DatosDeSiembraDePago {
  estado: Extract<EstadoPostulacion, 'PREINSCRIPTO' | 'PAGO_PENDIENTE' | 'VENCIDO' | 'VACANTE_CONFIRMADA'>
  venceEl?: Date | null
  totalCupos?: number
  /** Reusa un período ya sembrado (para probar el último cupo). */
  periodoId?: string
}

export interface EntornoDeRegistroDePagos {
  registro: RegistroDePagos
  /** El mismo registro con la sesión de Dirección, la única que decide los casos A_DECIDIR. */
  registroDeDireccion: RegistroDePagos
  /** Perfil DIRECCION de esa sesión. */
  direccionId: string
  institucionId: string
  /** Deja una Postulación en el estado pedido, en un período con matrícula `MATRICULA_DE_PRUEBA_CENTAVOS`. */
  sembrar: (datos: DatosDeSiembraDePago) => Promise<{ postulacionId: string; periodoId: string }>
  /** Abre una carga de informe en la institución (para los pagos no imputados). */
  sembrarCarga: () => Promise<string>
  estadoDe: (postulacionId: string) => Promise<EstadoPostulacion>
  contarOcupados: (periodoId: string) => Promise<number>
  ahora: () => Date
}

let secuencia = 0

/** Referencias únicas por corrida: el adaptador real persiste entre tests. */
function referenciaNueva(): ReferenciaDePago {
  secuencia += 1
  const sufijo = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${secuencia}`
  return new ReferenciaDePago('INFORME_SYSADMIN', `contrato-${sufijo}`)
}

function pagoInformado(pagadoEl: Date, referencia = referenciaNueva()): PagoInformado {
  return { referencia, monto: new Monto(MATRICULA_DE_PRUEBA_CENTAVOS), pagadoEl }
}

/**
 * Un caso para Dirección: una Postulación pendiente en un período con el cupo ya lleno, cuyo pago quedó
 * A_DECIDIR con el motivo SIN_CUPO.
 */
async function sembrarCasoSinCupo(entorno: EntornoDeRegistroDePagos) {
  const { registro, sembrar, ahora } = entorno
  const caso = await sembrar({ estado: 'PAGO_PENDIENTE', totalCupos: 1 })
  await sembrar({ estado: 'VACANTE_CONFIRMADA', periodoId: caso.periodoId })

  const resultado = await registro.registrarAcreditacion(pagoInformado(ahora()), {
    tipo: 'REVISION',
    postulacionId: caso.postulacionId,
    estadoEsperado: 'PAGO_PENDIENTE',
    motivo: 'SIN_CUPO',
  })
  if (resultado.tipo !== 'REGISTRADO') throw new Error(`No se pudo sembrar el caso: ${resultado.tipo}`)

  return { ...caso, pagoId: resultado.pago.id }
}

/**
 * Contrato de `RegistroDePagos` (contracts/puertos.md). Corre contra el fake y
 * contra las RPC `acreditar_pago` (sesión de Tesorería) y `decidir_pago_excepcional`
 * (sesión de Dirección).
 */
export function probarContratoDeRegistroDePagos(
  crearEntorno: () => EntornoDeRegistroDePagos | Promise<EntornoDeRegistroDePagos>,
) {
  describe('contrato: RegistroDePagos', () => {
    it('CONFIRMAR acredita el pago y confirma la vacante', async () => {
      const { registro, sembrar, estadoDe, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE' })

      const resultado = await registro.registrarAcreditacion(pagoInformado(ahora()), {
        tipo: 'CONFIRMAR',
        postulacionId,
        estadoEsperado: 'PAGO_PENDIENTE',
      })

      expect(resultado.tipo).toBe('REGISTRADO')
      if (resultado.tipo === 'REGISTRADO') {
        expect(resultado.pago.estado).toBe('ACREDITADO')
        expect(resultado.pago.postulacionId).toBe(postulacionId)
      }
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
    })

    it('compara contra el estado persistido: una PAGO_PENDIENTE ya vencida pasa a revisión', async () => {
      const { registro, sembrar, estadoDe, ahora } = await crearEntorno()
      const venceEl = new Date(ahora().getTime() - UN_DIA)
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE', venceEl })

      const resultado = await registro.registrarAcreditacion(pagoInformado(ahora()), {
        tipo: 'REVISION',
        postulacionId,
        estadoEsperado: 'PAGO_PENDIENTE',
        motivo: 'FUERA_DE_PLAZO',
      })

      expect(resultado.tipo).toBe('REGISTRADO')
      if (resultado.tipo === 'REGISTRADO') {
        expect(resultado.pago.estado).toBe('A_DECIDIR')
        expect(resultado.pago.motivoRevision).toBe('FUERA_DE_PLAZO')
      }
      expect(await estadoDe(postulacionId)).toBe('PAGO_EN_REVISION')
    })

    it('CONFIRMAR desde VENCIDO confirma la vacante', async () => {
      const { registro, sembrar, estadoDe, ahora } = await crearEntorno()
      const venceEl = new Date(ahora().getTime() - UN_DIA)
      const { postulacionId } = await sembrar({ estado: 'VENCIDO', venceEl })

      const resultado = await registro.registrarAcreditacion(
        pagoInformado(new Date(venceEl.getTime() - 1000)),
        { tipo: 'CONFIRMAR', postulacionId, estadoEsperado: 'VENCIDO' },
      )

      expect(resultado.tipo).toBe('REGISTRADO')
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
    })

    it('el último cupo en paralelo: una sola acreditación pasa', async () => {
      const { registro, sembrar, contarOcupados, ahora } = await crearEntorno()
      const primera = await sembrar({ estado: 'PAGO_PENDIENTE', totalCupos: 1 })
      const segunda = await sembrar({ estado: 'PAGO_PENDIENTE', periodoId: primera.periodoId })

      const resultados = await Promise.all(
        [primera, segunda].map(({ postulacionId }) =>
          registro.registrarAcreditacion(pagoInformado(ahora()), {
            tipo: 'CONFIRMAR',
            postulacionId,
            estadoEsperado: 'PAGO_PENDIENTE',
          }),
        ),
      )

      expect(resultados.map((r) => r.tipo).sort()).toEqual(['CONFLICTO', 'REGISTRADO'])
      expect(await contarOcupados(primera.periodoId)).toBe(1)
    })

    it('la misma referencia dos veces da DUPLICADO y no tiene efectos', async () => {
      const { registro, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE' })
      const pago = pagoInformado(ahora())
      const decision = { tipo: 'CONFIRMAR', postulacionId, estadoEsperado: 'PAGO_PENDIENTE' } as const

      const primera = await registro.registrarAcreditacion(pago, decision)
      const segunda = await registro.registrarAcreditacion(pago, decision)

      expect(primera.tipo).toBe('REGISTRADO')
      expect(segunda.tipo).toBe('DUPLICADO')
      if (primera.tipo === 'REGISTRADO' && segunda.tipo === 'DUPLICADO') {
        expect(segunda.pagoExistente.id).toBe(primera.pago.id)
      }
    })

    it('la misma referencia en paralelo deja un solo pago', async () => {
      const { registro, sembrar, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE' })
      const pago = pagoInformado(ahora())
      const decision = { tipo: 'CONFIRMAR', postulacionId, estadoEsperado: 'PAGO_PENDIENTE' } as const

      const resultados = await Promise.all([
        registro.registrarAcreditacion(pago, decision),
        registro.registrarAcreditacion(pago, decision),
      ])

      expect(resultados.map((r) => r.tipo).sort()).toEqual(['DUPLICADO', 'REGISTRADO'])
      expect(await registro.existe(pago.referencia)).not.toBeNull()
    })

    it('si la Postulación ya no está en el estado esperado da CONFLICTO y no guarda el pago', async () => {
      const { registro, sembrar, estadoDe, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'VACANTE_CONFIRMADA' })
      const pago = pagoInformado(ahora())

      const resultado = await registro.registrarAcreditacion(pago, {
        tipo: 'CONFIRMAR',
        postulacionId,
        estadoEsperado: 'PAGO_PENDIENTE',
      })

      expect(resultado).toEqual({ tipo: 'CONFLICTO' })
      expect(await registro.existe(pago.referencia)).toBeNull()
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
    })

    it('NO_IMPUTAR guarda el pago con su motivo y no toca la Postulación', async () => {
      const { registro, sembrar, sembrarCarga, estadoDe, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'VACANTE_CONFIRMADA' })
      const cargaId = await sembrarCarga()

      const resultado = await registro.registrarAcreditacion(
        pagoInformado(ahora()),
        { tipo: 'NO_IMPUTAR', motivo: 'YA_TIENE_PAGO', postulacionId },
        cargaId,
      )

      expect(resultado.tipo).toBe('REGISTRADO')
      if (resultado.tipo === 'REGISTRADO') {
        expect(resultado.pago.estado).toBe('NO_IMPUTADO')
        expect(resultado.pago.motivoNoImputado).toBe('YA_TIENE_PAGO')
        expect(resultado.pago.cargaId).toBe(cargaId)
      }
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
    })

    it('NO_IMPUTAR sin Postulación guarda el pago colgado de la carga', async () => {
      const { registro, sembrarCarga, ahora } = await crearEntorno()
      const cargaId = await sembrarCarga()

      const resultado = await registro.registrarAcreditacion(
        pagoInformado(ahora()),
        { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' },
        cargaId,
      )

      expect(resultado.tipo).toBe('REGISTRADO')
      if (resultado.tipo === 'REGISTRADO') {
        expect(resultado.pago.postulacionId).toBeUndefined()
      }
    })

    it('listarPorEstado devuelve los pagos de la institución en ese estado', async () => {
      const { registro, sembrar, sembrarCarga, institucionId, ahora } = await crearEntorno()
      const { postulacionId } = await sembrar({ estado: 'PAGO_PENDIENTE' })
      const cargaId = await sembrarCarga()
      const acreditado = pagoInformado(ahora())
      const noImputado = pagoInformado(ahora())

      await registro.registrarAcreditacion(acreditado, {
        tipo: 'CONFIRMAR',
        postulacionId,
        estadoEsperado: 'PAGO_PENDIENTE',
      })
      await registro.registrarAcreditacion(
        noImputado,
        { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' },
        cargaId,
      )

      const noImputados = await registro.listarPorEstado(institucionId, 'NO_IMPUTADO')
      const referencias = noImputados.map((p) => p.referencia.referenciaExterna)

      expect(referencias).toContain(noImputado.referencia.referenciaExterna)
      expect(referencias).not.toContain(acreditado.referencia.referenciaExterna)
      expect(noImputados.every((p) => p.estado === 'NO_IMPUTADO')).toBe(true)
    })

    it('registrarDecision ACEPTAR confirma la vacante aunque exceda el cupo', async () => {
      const entorno = await crearEntorno()
      const { registroDeDireccion, direccionId, estadoDe, contarOcupados } = entorno
      const { postulacionId, periodoId, pagoId } = await sembrarCasoSinCupo(entorno)

      const resultado = await registroDeDireccion.registrarDecision(pagoId, 'ACEPTAR', direccionId, 'Se amplía el cupo')

      expect(resultado.tipo).toBe('REGISTRADA')
      if (resultado.tipo === 'REGISTRADA') {
        expect(resultado.pago.id).toBe(pagoId)
        expect(resultado.pago.estado).toBe('ACREDITADO')
        expect(resultado.pago.motivoRevision).toBe('SIN_CUPO')
      }
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
      expect(await contarOcupados(periodoId)).toBe(2)
    })

    it('registrarDecision RECHAZAR deja la Postulación VENCIDO y el pago DEVUELTO', async () => {
      const entorno = await crearEntorno()
      const { registroDeDireccion, direccionId, estadoDe, institucionId } = entorno
      const { postulacionId, pagoId } = await sembrarCasoSinCupo(entorno)

      const resultado = await registroDeDireccion.registrarDecision(pagoId, 'RECHAZAR', direccionId)

      expect(resultado.tipo).toBe('REGISTRADA')
      if (resultado.tipo === 'REGISTRADA') expect(resultado.pago.estado).toBe('DEVUELTO')
      expect(await estadoDe(postulacionId)).toBe('VENCIDO')
      const devueltos = await registroDeDireccion.listarPorEstado(institucionId, 'DEVUELTO')
      expect(devueltos.map((p) => p.id)).toContain(pagoId)
    })

    it('registrarDecision dos veces sobre el mismo pago: la segunda da CONFLICTO', async () => {
      const entorno = await crearEntorno()
      const { registroDeDireccion, direccionId, estadoDe } = entorno
      const { postulacionId, pagoId } = await sembrarCasoSinCupo(entorno)

      const primera = await registroDeDireccion.registrarDecision(pagoId, 'ACEPTAR', direccionId)
      const segunda = await registroDeDireccion.registrarDecision(pagoId, 'RECHAZAR', direccionId)

      expect(primera.tipo).toBe('REGISTRADA')
      expect(segunda).toEqual({ tipo: 'CONFLICTO' })
      expect(await estadoDe(postulacionId)).toBe('VACANTE_CONFIRMADA')
    })

    it('registrarDecision en paralelo sobre el mismo pago: una sola pasa', async () => {
      const entorno = await crearEntorno()
      const { registroDeDireccion, direccionId } = entorno
      const { pagoId } = await sembrarCasoSinCupo(entorno)

      const resultados = await Promise.all([
        registroDeDireccion.registrarDecision(pagoId, 'ACEPTAR', direccionId),
        registroDeDireccion.registrarDecision(pagoId, 'RECHAZAR', direccionId),
      ])

      expect(resultados.map((r) => r.tipo).sort()).toEqual(['CONFLICTO', 'REGISTRADA'])
    })

    it('existe devuelve null para una referencia que nunca llegó', async () => {
      const { registro } = await crearEntorno()

      expect(await registro.existe(referenciaNueva())).toBeNull()
    })
  })
}
