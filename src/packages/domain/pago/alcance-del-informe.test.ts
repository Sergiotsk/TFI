import { describe, expect, test } from 'vitest'
import type { EstadoDePostulacion } from '../postulacion/estados'
import { NumeroDePostulacion } from '../postulacion/numero-de-postulacion'
import { Postulacion } from '../postulacion/postulacion'
import { motivoParaIgnorar } from './alcance-del-informe'

function postulacion(estado: EstadoDePostulacion, id = 'p-1') {
  const venceEl = estado === 'PREINSCRIPTO' ? null : new Date('2027-02-06T10:00:00Z')
  const motivo = estado === 'PAGO_EN_REVISION' ? 'SIN_CUPO' : null
  return new Postulacion(id, new NumeroDePostulacion(1), 'asp-1', 'per-1', estado, venceEl, motivo, new Date(0), new Date(0))
}

describe('motivoParaIgnorar', () => {
  test('sin Postulaciones: SIN_POSTULACION', () => {
    expect(motivoParaIgnorar([])).toBe('SIN_POSTULACION')
  })

  test.each<EstadoDePostulacion>([
    'VACANTE_CONFIRMADA',
    'ESPERANDO_DOCUMENTACION',
    'DOCUMENTACION_EN_REVISION',
    'OBSERVADO',
    'DOCUMENTACION_VALIDADA',
    'CONFIRMADO_PARA_EXPORTAR',
  ])('todas ocupan cupo (%s): YA_ADMITIDO', (estado) => {
    expect(motivoParaIgnorar([postulacion(estado)])).toBe('YA_ADMITIDO')
  })

  test.each<EstadoDePostulacion>(['PREINSCRIPTO', 'PAGO_PENDIENTE', 'VENCIDO', 'PAGO_EN_REVISION'])(
    'una Postulación que todavía espera el pago (%s) no se ignora',
    (estado) => {
      expect(motivoParaIgnorar([postulacion(estado)])).toBeNull()
    },
  )

  test('una admitida y otra con el pago pendiente: no se ignora', () => {
    expect(motivoParaIgnorar([postulacion('VACANTE_CONFIRMADA', 'p-1'), postulacion('PAGO_PENDIENTE', 'p-2')])).toBeNull()
  })
})
