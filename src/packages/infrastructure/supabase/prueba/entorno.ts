import { randomInt, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PeriodoDeIngreso, Postulacion } from '@tfi/domain'
import type { DatosDePostulacionSembrada } from '@tfi/application'
import {
  MATRICULA_DE_PRUEBA_CENTAVOS,
  type DatosDePeriodoDePrueba,
  type EntornoDeDocumentos,
  type EntornoDePostulaciones,
  type EntornoDePeriodos,
  type EntornoDeRegistroDeCargas,
  type EntornoDeRegistroDePagos,
} from '@tfi/application/contratos'
import {
  claveDeServicioDePrueba,
  clavePublicaDePrueba,
  emailDePrueba,
  urlDePrueba,
} from '../entorno-de-prueba'
import { mapearPeriodo } from '../mapeadores/periodo'
import { mapearPostulacion } from '../mapeadores/postulacion'
import { RepositorioDeDocumentosSupabase } from '../repositorio-de-documentos'
import { RepositorioDePeriodosSupabase } from '../repositorio-de-periodos'
import { RegistroDeCargasSupabase } from '../registro-de-cargas'
import { RegistroDePagosSupabase } from '../registro-de-pagos'
import { RepositorioDePostulacionesSupabase } from '../repositorio-de-postulaciones'

/**
 * Entorno de los contratos de Postulaciones y Períodos contra Supabase.
 *
 * Usa la clave de servicio: los contratos verifican el mapeo fila↔entidad y las
 * restricciones de la base, no RLS. Eso último se cubre con las migraciones y
 * el smoke manual. Los datos son únicos por corrida (DNI, nombre de período,
 * institución), así que los tests no se pisan entre sí.
 */

const UN_DIA = 24 * 60 * 60 * 1000

// Al azar y no con Date.now() + un contador: vitest corre cada archivo en su propio worker, cada uno con su
// contador desde 0, y dos workers en el mismo milisegundo generaban el mismo código o DNI.

/** 12 caracteres hex: entra en `instituciones.codigo` (VARCHAR(20)) con el prefijo `PRUEBA-`. */
function marcaUnica(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

function dniUnico(): string {
  return String(randomInt(10_000_000, 99_000_000))
}

export function clienteDeServicio(): SupabaseClient {
  return createClient(urlDePrueba(), claveDeServicioDePrueba(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function idDeLaInstitucionFrh(cliente: SupabaseClient): Promise<string> {
  const { data, error } = await cliente
    .from('instituciones')
    .select('id')
    .eq('codigo', 'FRH')
    .single()
  if (error || !data) {
    throw new Error(`No está la institución FRH en la base de prueba: ${error?.message ?? ''}`)
  }

  return data.id as string
}

/**
 * Institución inactiva para verificar que `listarAbiertos` no mezcla
 * instituciones. Inactiva para no romper el trigger de registro, que exige
 * exactamente una institución activa.
 */
async function crearInstitucionInactiva(cliente: SupabaseClient): Promise<string> {
  const marca = marcaUnica()
  const { data, error } = await cliente
    .from('instituciones')
    .insert({
      codigo: `PRUEBA-${marca}`,
      nombre: `Institución de prueba ${marca}`,
      activa: false,
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`No se pudo crear la institución de prueba: ${error?.message ?? ''}`)
  }

  return data.id as string
}

const CLAVE_DE_PRUEBA = 'solo-local-123'

async function crearAspirante(cliente: SupabaseClient, dni: string): Promise<string> {
  const { id } = await crearUsuario(cliente, dni)
  return id
}

async function crearUsuario(
  cliente: SupabaseClient,
  dni: string,
): Promise<{ id: string; email: string }> {
  const email = emailDePrueba('aspirante')
  const { data, error } = await cliente.auth.admin.createUser({
    email,
    password: CLAVE_DE_PRUEBA,
    email_confirm: true,
    user_metadata: {
      nombre: 'Aspirante',
      apellido: `De Prueba ${marcaUnica()}`,
      dni,
      cuil: `20${dni}0`,
      fecha_nacimiento: '2000-01-01',
      sexo: 'O',
    },
  })
  if (error || !data.user) {
    throw new Error(`No se pudo crear el aspirante: ${error?.message ?? ''}`)
  }

  // El perfil lo crea el trigger `crear_perfil_al_registrarse`.
  return { id: data.user.id, email }
}

/** Cliente con la sesión del usuario: pasa por los grants y RLS de `authenticated`. */
async function clienteConSesion(email: string): Promise<SupabaseClient> {
  const cliente = createClient(urlDePrueba(), clavePublicaDePrueba(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await cliente.auth.signInWithPassword({ email, password: CLAVE_DE_PRUEBA })
  if (error) throw new Error(`No se pudo iniciar sesión: ${error.message}`)

  return cliente
}

async function crearPeriodo(
  cliente: SupabaseClient,
  institucionPorDefecto: string,
  datos?: DatosDePeriodoDePrueba,
): Promise<PeriodoDeIngreso> {
  const { data, error } = await cliente
    .from('periodos_de_ingreso')
    .insert({
      institucion_id: datos?.institucionId ?? institucionPorDefecto,
      nombre: datos?.nombre ?? `Período de prueba ${marcaUnica()}`,
      total_cupos: datos?.totalCupos ?? 50,
      cierra_el: (datos?.cierraEl ?? new Date(Date.now() + 30 * UN_DIA)).toISOString(),
      dias_plazo_pago: datos?.diasPlazoPago ?? 10,
      monto_matricula_centavos: datos?.montoMatriculaCentavos ?? 1_500_000,
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`No se pudo crear el período: ${error?.message ?? ''}`)
  }

  return mapearPeriodo(data)
}

async function sembrarPostulacion(
  cliente: SupabaseClient,
  datos: DatosDePostulacionSembrada,
): Promise<Postulacion> {
  const venceEl =
    datos.venceEl !== undefined
      ? datos.venceEl
      : datos.estado === 'PAGO_PENDIENTE'
        ? new Date(Date.now() + 10 * UN_DIA)
        : null
  const motivoRevision =
    datos.motivoRevision !== undefined
      ? datos.motivoRevision
      : datos.estado === 'PAGO_EN_REVISION'
        ? 'SIN_CUPO'
        : null

  const { data, error } = await cliente
    .from('postulaciones')
    .insert({
      aspirante_id: datos.aspiranteId,
      periodo_id: datos.periodoId,
      estado: datos.estado,
      vence_el: venceEl === null ? null : venceEl.toISOString(),
      motivo_revision: motivoRevision,
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`No se pudo sembrar la Postulación: ${error?.message ?? ''}`)
  }

  return mapearPostulacion(data)
}

export async function prepararEntornoDePostulaciones(): Promise<EntornoDePostulaciones> {
  const cliente = clienteDeServicio()
  const institucionId = await idDeLaInstitucionFrh(cliente)

  return {
    repositorio: new RepositorioDePostulacionesSupabase(cliente),
    crearAspirante: (dni) => crearAspirante(cliente, dni),
    crearPeriodo: (datos) => crearPeriodo(cliente, institucionId, datos),
    sembrarPostulacion: (datos) => sembrarPostulacion(cliente, datos),
  }
}

export async function prepararEntornoDePeriodos(): Promise<EntornoDePeriodos> {
  const cliente = clienteDeServicio()
  // La suite de períodos necesita una institución propia: si usa FRH, el seed y
  // las corridas anteriores dejan períodos abiertos que rompen `listarAbiertos`.
  const institucionId = await crearInstitucionInactiva(cliente)
  const otraInstitucionId = await crearInstitucionInactiva(cliente)

  return {
    repositorio: new RepositorioDePeriodosSupabase(cliente),
    institucionId,
    otraInstitucionId,
    crearAspirante: (dni) => crearAspirante(cliente, dni),
    crearPeriodo: (datos) => crearPeriodo(cliente, institucionId, datos),
    sembrarPostulacion: (datos) => sembrarPostulacion(cliente, datos),
  }
}

async function crearPostulacionDeDocumentos(
  cliente: SupabaseClient,
  institucionId: string,
): Promise<string> {
  const periodo = await crearPeriodo(cliente, institucionId)
  const aspiranteId = await crearAspirante(cliente, dniUnico())
  const postulacion = await sembrarPostulacion(cliente, {
    aspiranteId,
    periodoId: periodo.id,
    estado: 'ESPERANDO_DOCUMENTACION',
  })

  return postulacion.id
}

export async function prepararEntornoDeDocumentos(): Promise<EntornoDeDocumentos> {
  const cliente = clienteDeServicio()
  const institucionId = await idDeLaInstitucionFrh(cliente)

  return {
    repositorio: new RepositorioDeDocumentosSupabase(cliente),
    crearPostulacion: () => crearPostulacionDeDocumentos(cliente, institucionId),
    crearIdDocumento: () => randomUUID(),
  }
}

export interface EntornoDeDocumentosConSesion {
  postulacionId: string
  /** Adaptador con la sesión del aspirante dueño de la Postulación. */
  delAspirante: RepositorioDeDocumentosSupabase
  aspiranteId: string
  /** Adaptador con la sesión de Secretaría de la misma institución. */
  delPersonal: RepositorioDeDocumentosSupabase
  personalId: string
}

/**
 * Entorno para verificar los grants y RLS de `documentos`: a diferencia de
 * `prepararEntornoDeDocumentos`, el adaptador usa sesiones reales y no la clave
 * de servicio, que se saltea los permisos.
 */
export async function prepararEntornoDeDocumentosConSesion(): Promise<EntornoDeDocumentosConSesion> {
  const servicio = clienteDeServicio()
  const institucionId = await idDeLaInstitucionFrh(servicio)

  const periodo = await crearPeriodo(servicio, institucionId)
  const aspirante = await crearUsuario(servicio, dniUnico())
  const postulacion = await sembrarPostulacion(servicio, {
    aspiranteId: aspirante.id,
    periodoId: periodo.id,
    estado: 'ESPERANDO_DOCUMENTACION',
  })

  const personal = await crearUsuario(servicio, dniUnico())
  const { error } = await servicio
    .from('perfiles')
    .update({ rol: 'SECRETARIA', institucion_id: institucionId })
    .eq('id', personal.id)
  if (error) throw new Error(`No se pudo dar el rol de Secretaría: ${error.message}`)

  return {
    postulacionId: postulacion.id,
    delAspirante: new RepositorioDeDocumentosSupabase(await clienteConSesion(aspirante.email)),
    aspiranteId: aspirante.id,
    delPersonal: new RepositorioDeDocumentosSupabase(await clienteConSesion(personal.email)),
    personalId: personal.id,
  }
}

let tesoreriaDeLaCorrida:
  | Promise<{ id: string; institucionId: string; cliente: SupabaseClient }>
  | undefined

/**
 * Un usuario de Tesorería con su sesión, uno por corrida, en una institución de
 * prueba propia: así los pagos y las cargas de los contratos no aparecen en el
 * panel de Tesorería de FRH.
 */
function tesoreriaConSesion(
  servicio: SupabaseClient,
): Promise<{ id: string; institucionId: string; cliente: SupabaseClient }> {
  tesoreriaDeLaCorrida ??= (async () => {
    const institucionId = await crearInstitucionInactiva(servicio)
    const usuario = await crearUsuario(servicio, dniUnico())
    const { error } = await servicio
      .from('perfiles')
      .update({ rol: 'TESORERIA', institucion_id: institucionId })
      .eq('id', usuario.id)
    if (error) throw new Error(`No se pudo dar el rol de Tesorería: ${error.message}`)

    return { id: usuario.id, institucionId, cliente: await clienteConSesion(usuario.email) }
  })()

  return tesoreriaDeLaCorrida
}

/**
 * Entorno del contrato de `RegistroDePagos`: el adaptador usa la sesión de
 * Tesorería, así pasa por la verificación de rol e institución de la RPC.
 * Todo se siembra en la institución de prueba de la Tesorería, y los períodos
 * ya cerrados (la RPC no mira el cierre).
 */
export async function prepararEntornoDeRegistroDePagos(): Promise<EntornoDeRegistroDePagos> {
  const servicio = clienteDeServicio()
  const tesoreria = await tesoreriaConSesion(servicio)
  const { institucionId } = tesoreria
  const periodos = new RepositorioDePeriodosSupabase(servicio)
  const cargas = new RegistroDeCargasSupabase(tesoreria.cliente)

  return {
    registro: new RegistroDePagosSupabase(tesoreria.cliente),
    institucionId,
    ahora: () => new Date(),
    sembrar: async (datos) => {
      const periodoId =
        datos.periodoId ??
        (
          await crearPeriodo(servicio, institucionId, {
            totalCupos: datos.totalCupos ?? 10,
            cierraEl: new Date(Date.now() - UN_DIA),
            montoMatriculaCentavos: MATRICULA_DE_PRUEBA_CENTAVOS,
          })
        ).id
      const aspiranteId = await crearAspirante(servicio, dniUnico())
      const postulacion = await sembrarPostulacion(servicio, {
        aspiranteId,
        periodoId,
        estado: datos.estado,
        venceEl: datos.venceEl,
      })

      return { postulacionId: postulacion.id, periodoId }
    },
    sembrarCarga: async () => (await cargas.iniciar(institucionId, tesoreria.id, 'contrato.csv')).id,
    estadoDe: async (postulacionId) => {
      const { data, error } = await servicio
        .from('postulaciones')
        .select('*')
        .eq('id', postulacionId)
        .single()
      if (error) throw new Error(`No se pudo leer la Postulación: ${error.message}`)
      return mapearPostulacion(data).estado
    },
    contarOcupados: (periodoId) => periodos.contarOcupados(periodoId),
  }
}

/** Entorno del contrato de `RegistroDeCargas`, con la sesión de Tesorería. */
export async function prepararEntornoDeRegistroDeCargas(): Promise<EntornoDeRegistroDeCargas> {
  const tesoreria = await tesoreriaConSesion(clienteDeServicio())

  return {
    cargas: new RegistroDeCargasSupabase(tesoreria.cliente),
    institucionId: tesoreria.institucionId,
    cargadaPor: tesoreria.id,
  }
}
