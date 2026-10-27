import { describe, expect, it } from 'vitest'
import { Documento, PeriodoDeIngreso } from '@tfi/domain'
import type { Actor } from '../actor'
import { ActualizarDocumentoUseCase } from './actualizar-documento'
import { ConsultarDocumentoUseCase } from './consultar-documento'
import { EliminarDocumentoUseCase } from './eliminar-documento'
import { ListarDocumentosUseCase } from './listar-documentos'
import { RevisarDocumentoUseCase } from './revisar-documento'
import { SubirDocumentoUseCase } from './subir-documento'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from '../errores'
import { SEGUNDOS_DE_URL_FIRMADA } from './comun'
import { AlmacenDeArchivosFake } from '../../puertos/almacen-de-archivos/fake'
import { AccionesDeDocumentacionFake } from '../../puertos/acciones-de-documentacion/fake'
import { GeneradorDeIdsFake } from '../../puertos/generador-de-ids/fake'
import { RelojFijo } from '../../puertos/reloj/fake'
import { RepositorioDeDocumentosFake } from '../../puertos/repositorio-de-documentos/fake'
import { RepositorioDePeriodosFake } from '../../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../../puertos/repositorio-de-postulaciones/fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const INSTITUCION = 'institucion-1'
const PERIODO = 'periodo-1'

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: INSTITUCION,
}

const secretaria: Actor = {
  perfilId: 'secretaria-1',
  rol: 'SECRETARIA',
  institucionId: INSTITUCION,
}

const tesoreria: Actor = {
  perfilId: 'tesoreria-1',
  rol: 'TESORERIA',
  institucionId: INSTITUCION,
}

const direccion: Actor = {
  perfilId: 'direccion-1',
  rol: 'DIRECCION',
  institucionId: INSTITUCION,
}

const otroAspirante: Actor = {
  perfilId: 'aspirante-2',
  rol: 'ASPIRANTE',
  institucionId: INSTITUCION,
}

function armar(estadoInicial: 'VACANTE_CONFIRMADA' | 'ESPERANDO_DOCUMENTACION' | 'PREINSCRIPTO') {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const documentos = new RepositorioDeDocumentosFake()
  documentos.reset()
  const almacen = new AlmacenDeArchivosFake()
  const acciones = new AccionesDeDocumentacionFake(postulaciones, reloj)
  const generador = new GeneradorDeIdsFake('doc')

  const postulacion = postulaciones.sembrar({
    aspiranteId: aspirante.perfilId,
    periodoId: PERIODO,
    estado: estadoInicial,
  })

  return {
    reloj,
    postulaciones,
    periodos,
    documentos,
    almacen,
    acciones,
    postulacion,
    subir: new SubirDocumentoUseCase(
      documentos,
      postulaciones,
      periodos,
      acciones,
      almacen,
      generador,
      reloj,
    ),
    revisar: new RevisarDocumentoUseCase(
      documentos,
      postulaciones,
      periodos,
      acciones,
      reloj,
    ),
    listar: new ListarDocumentosUseCase(documentos, postulaciones, periodos),
    consultar: new ConsultarDocumentoUseCase(
      documentos,
      postulaciones,
      periodos,
      almacen,
    ),
    actualizar: new ActualizarDocumentoUseCase(
      documentos,
      postulaciones,
      periodos,
      reloj,
    ),
    eliminar: new EliminarDocumentoUseCase(
      documentos,
      postulaciones,
      periodos,
      almacen,
      reloj,
    ),
  }
}

async function armarConPeriodo(
  estadoInicial: 'VACANTE_CONFIRMADA' | 'ESPERANDO_DOCUMENTACION' | 'PREINSCRIPTO' = 'VACANTE_CONFIRMADA',
) {
  const mundo = armar(estadoInicial)
  await mundo.periodos.guardar(
    new PeriodoDeIngreso(
      PERIODO,
      INSTITUCION,
      'Primer cuatrimestre 2027',
      10,
      new Date('2027-03-01T00:00:00.000Z'),
      3,
      9_400_000,
    ),
  )
  return mundo
}

function archivo() {
  return {
    contenido: new Uint8Array([37, 80, 68, 70]).buffer,
    nombreArchivo: 'dni.pdf',
    mimeType: 'application/pdf',
  }
}

describe('SubirDocumento', () => {
  it('sube el archivo, guarda los metadatos y pasa a ESPERANDO_DOCUMENTACION', async () => {
    const { subir, documentos, almacen, postulacion, postulaciones } =
      await armarConPeriodo('VACANTE_CONFIRMADA')

    const documento = await subir.ejecutar(aspirante, {
      postulacionId: postulacion.id,
      tipo: 'DNI',
      vigencia: 365,
      archivo: archivo(),
    })

    expect(documento.estado).toBe('PENDIENTE')
    expect(documento.subidoPor).toBe(aspirante.perfilId)
    expect(almacen.obtener(documento.ruta)).toBeDefined()
    expect((await documentos.obtenerPorPostulacion(postulacion.id)).length).toBe(1)
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe(
      'ESPERANDO_DOCUMENTACION',
    )
  })

  it('rechaza un archivo que no es PDF, JPG o PNG', async () => {
    const { subir, postulacion } = await armarConPeriodo()

    await expect(
      subir.ejecutar(aspirante, {
        postulacionId: postulacion.id,
        tipo: 'DNI',
        vigencia: 365,
        archivo: { ...archivo(), mimeType: 'text/plain' },
      }),
    ).rejects.toThrow('Solo se aceptan archivos PDF, JPG o PNG')
  })

  it('no deja que un aspirante suba a una Postulación ajena', async () => {
    const { subir, postulacion } = await armarConPeriodo()
    const otro: Actor = { ...aspirante, perfilId: 'aspirante-2' }

    await expect(
      subir.ejecutar(otro, {
        postulacionId: postulacion.id,
        tipo: 'DNI',
        vigencia: 365,
        archivo: archivo(),
      }),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no deja subir documentación antes de la vacante confirmada', async () => {
    const { subir, postulacion } = await armarConPeriodo('PREINSCRIPTO')

    await expect(
      subir.ejecutar(aspirante, {
        postulacionId: postulacion.id,
        tipo: 'DNI',
        vigencia: 365,
        archivo: archivo(),
      }),
    ).rejects.toThrow(ConflictoDeEstado)
  })
})

describe('RevisarDocumento', () => {
  async function conUnDocumento() {
    const mundo = await armarConPeriodo('ESPERANDO_DOCUMENTACION')
    const documento = await mundo.subir.ejecutar(aspirante, {
      postulacionId: mundo.postulacion.id,
      tipo: 'DNI',
      vigencia: 365,
      archivo: archivo(),
    })
    return { ...mundo, documento }
  }

  it('aprobar el único documento valida la documentación de la Postulación', async () => {
    const { revisar, documento, postulacion, postulaciones } = await conUnDocumento()

    const revisado = await revisar.ejecutar(secretaria, documento.id, {
      estado: 'APROBADO',
    })

    expect(revisado.estado).toBe('APROBADO')
    expect(revisado.revisadoPor).toBe(secretaria.perfilId)
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe(
      'DOCUMENTACION_VALIDADA',
    )
  })

  it('observar un documento deja la Postulación OBSERVADA', async () => {
    const { revisar, documento, postulacion, postulaciones } = await conUnDocumento()

    await revisar.ejecutar(secretaria, documento.id, {
      estado: 'OBSERVADO',
      observaciones: 'Falta la firma',
    })

    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe('OBSERVADO')
  })

  it('solo Secretaría y Dirección pueden revisar', async () => {
    const { revisar, documento } = await conUnDocumento()

    await expect(
      revisar.ejecutar(aspirante, documento.id, { estado: 'APROBADO' }),
    ).rejects.toThrow(NoAutorizado)
    await expect(
      revisar.ejecutar(tesoreria, documento.id, { estado: 'APROBADO' }),
    ).rejects.toThrow(NoAutorizado)
  })
})

describe('ListarDocumentos', () => {
  it('el aspirante tiene que indicar la Postulación y solo ve la propia', async () => {
    const { listar, postulacion, documentos } = await armarConPeriodo(
      'ESPERANDO_DOCUMENTACION',
    )
    await documentos.guardar(
      new Documento(
        'doc-propio',
        postulacion.id,
        'DNI',
        'ruta/dni.pdf',
        'dni.pdf',
        'application/pdf',
        10,
        365,
        'PENDIENTE',
        aspirante.perfilId,
        null,
        null,
        null,
        AHORA,
        AHORA,
      ),
    )

    await expect(
      listar.ejecutar(aspirante, {}, { pagina: 1, porPagina: 20 }),
    ).rejects.toThrow(NoAutorizado)

    const pagina = await listar.ejecutar(
      aspirante,
      { postulacionId: postulacion.id },
      { pagina: 1, porPagina: 20 },
    )
    expect(pagina.items).toHaveLength(1)
    expect(pagina.items[0]?.id).toBe('doc-propio')
  })

  it('Tesorería no participa del circuito de documentación', async () => {
    const { listar } = await armarConPeriodo()

    await expect(
      listar.ejecutar(tesoreria, {}, { pagina: 1, porPagina: 20 }),
    ).rejects.toThrow(NoAutorizado)
  })
})

describe('ConsultarDocumento, ActualizarDocumento y EliminarDocumento', () => {
  async function conUnDocumento() {
    const mundo = await armarConPeriodo('ESPERANDO_DOCUMENTACION')
    const documento = await mundo.subir.ejecutar(aspirante, {
      postulacionId: mundo.postulacion.id,
      tipo: 'DNI',
      vigencia: 365,
      archivo: archivo(),
    })
    return { ...mundo, documento }
  }

  it('consultar devuelve una URL firmada para el dueño', async () => {
    const { consultar, documento } = await conUnDocumento()

    const resultado = await consultar.ejecutar(aspirante, documento.id)

    expect(resultado.documento.id).toBe(documento.id)
    expect(resultado.urlFirmada).toContain('almacen.fake')
    expect(resultado.expiraEnSegundos).toBeGreaterThan(0)
  })

  it('la URL firmada vence en el menor tiempo posible', async () => {
    const { consultar, documento } = await conUnDocumento()

    const resultado = await consultar.ejecutar(aspirante, documento.id)

    expect(resultado.expiraEnSegundos).toBe(SEGUNDOS_DE_URL_FIRMADA)
    expect(resultado.expiraEnSegundos).toBeLessThanOrEqual(60)
    expect(resultado.urlFirmada).toContain(`expira=${SEGUNDOS_DE_URL_FIRMADA}`)
  })

  it('Secretaría y Dirección pueden ver la URL de un documento ajeno', async () => {
    const { consultar, documento } = await conUnDocumento()

    const porSecretaria = await consultar.ejecutar(secretaria, documento.id)
    const porDireccion = await consultar.ejecutar(direccion, documento.id)

    expect(porSecretaria.urlFirmada).toContain('almacen.fake')
    expect(porDireccion.urlFirmada).toContain('almacen.fake')
  })

  it('otro aspirante no puede ver la URL del documento', async () => {
    const { consultar, documento } = await conUnDocumento()

    await expect(consultar.ejecutar(otroAspirante, documento.id)).rejects.toBeInstanceOf(
      NoAutorizado,
    )
  })

  it('Tesorería no puede ver la URL de un documento', async () => {
    const { consultar, documento } = await conUnDocumento()

    await expect(consultar.ejecutar(tesoreria, documento.id)).rejects.toBeInstanceOf(NoAutorizado)
  })

  it('un documento inexistente responde NoEncontrado', async () => {
    const { consultar } = await conUnDocumento()

    await expect(consultar.ejecutar(aspirante, 'documento-que-no-existe')).rejects.toBeInstanceOf(
      NoEncontrado,
    )
  })

  it('el personal puede corregir los metadatos', async () => {
    const { actualizar, documento } = await conUnDocumento()

    const actualizado = await actualizar.ejecutar(secretaria, documento.id, {
      tipo: 'CONSTANCIA_CUIL',
      vigencia: 30,
      nombreArchivo: 'cuil.pdf',
    })

    expect(actualizado.tipo).toBe('CONSTANCIA_CUIL')
    expect(actualizado.vigencia).toBe(30)
    expect(actualizado.nombreArchivo).toBe('cuil.pdf')
  })

  it('el dueño puede borrar su documento y se borra el archivo', async () => {
    const { eliminar, documento, documentos, almacen } = await conUnDocumento()

    await eliminar.ejecutar(aspirante, documento.id)

    expect(await documentos.obtenerPorId(documento.id)).toBeNull()
    await expect(almacen.urlFirmada(documento.ruta, 60)).rejects.toThrow()
  })
})
