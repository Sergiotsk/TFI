import { describe, expect, it } from 'vitest'
import { Documento } from './documento'
import {
  ObservacionDeDocumentoRequerida,
  TransicionDeDocumentoInvalida,
} from './errores'

const CREADO = new Date('2026-10-20T00:00:00.000Z')

function documento(observaciones: string | null = null): Documento {
  return new Documento(
    'doc-1',
    'postulacion-1',
    'DNI',
    'institucion/postulacion/doc-1-dni.pdf',
    'dni.pdf',
    'application/pdf',
    1024,
    365,
    'PENDIENTE',
    'aspirante-1',
    null,
    null,
    observaciones,
    CREADO,
    CREADO,
  )
}

describe('Documento', () => {
  it('aprobar registra revisor y fecha, y limpia observaciones', () => {
    const aprobado = documento().revisar('APROBADO', 'secretaria-1', CREADO)

    expect(aprobado.estado).toBe('APROBADO')
    expect(aprobado.revisadoPor).toBe('secretaria-1')
    expect(aprobado.revisadoEl).toEqual(CREADO)
    expect(aprobado.observaciones).toBeNull()
  })

  it('observar exige un motivo', () => {
    expect(() => documento().revisar('OBSERVADO', 'secretaria-1', CREADO)).toThrow(
      ObservacionDeDocumentoRequerida,
    )
    expect(() =>
      documento().revisar('OBSERVADO', 'secretaria-1', CREADO, '   '),
    ).toThrow(ObservacionDeDocumentoRequerida)
  })

  it('observar guarda el motivo recortado', () => {
    const observado = documento().revisar(
      'OBSERVADO',
      'secretaria-1',
      CREADO,
      '  Falta la firma  ',
    )

    expect(observado.estado).toBe('OBSERVADO')
    expect(observado.observaciones).toBe('Falta la firma')
  })

  it('no permite quedarse en el mismo estado', () => {
    expect(() => documento().revisar('PENDIENTE', 'secretaria-1', CREADO)).toThrow(
      TransicionDeDocumentoInvalida,
    )
  })

  it('reabrir vuelve a PENDIENTE y borra la marca de revisión', () => {
    const aprobado = documento().revisar('APROBADO', 'secretaria-1', CREADO)
    const reabierto = aprobado.revisar('PENDIENTE', 'secretaria-1', CREADO)

    expect(reabierto.estado).toBe('PENDIENTE')
    expect(reabierto.revisadoPor).toBeNull()
    expect(reabierto.revisadoEl).toBeNull()
    expect(reabierto.observaciones).toBeNull()
  })

  it('conMetadatos cambia tipo, vigencia y nombre sin tocar el estado', () => {
    const aprobado = documento().revisar('APROBADO', 'secretaria-1', CREADO)
    const actualizado = aprobado.conMetadatos(
      { tipo: 'CONSTANCIA_CUIL', vigencia: 30, nombreArchivo: 'cuil.pdf' },
      CREADO,
    )

    expect(actualizado.tipo).toBe('CONSTANCIA_CUIL')
    expect(actualizado.vigencia).toBe(30)
    expect(actualizado.nombreArchivo).toBe('cuil.pdf')
    expect(actualizado.estado).toBe('APROBADO')
  })
})
