import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PeriodoDeIngreso, Postulacion } from '@tfi/domain'
import type { DatosDePostulacionSembrada } from '@tfi/application'
import type {
  DatosDePeriodoDePrueba,
  EntornoDeDocumentos,
  EntornoDePostulaciones,
  EntornoDePeriodos,
} from '@tfi/application/contratos'
import { claveDeServicioDePrueba, emailDePrueba, urlDePrueba } from '../entorno-de-prueba'
import { mapearPeriodo } from '../mapeadores/periodo'
import { mapearPostulacion } from '../mapeadores/postulacion'
import { RepositorioDeDocumentosSupabase } from '../repositorio-de-documentos'
import { RepositorioDePeriodosSupabase } from '../repositorio-de-periodos'
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

let contador = 0

function marcaUnica(): string {
  contador += 1
  return `${Date.now().toString(36)}${contador.toString(36)}`
}

let contadorDni = 0

function dniUnico(): string {
  contadorDni += 1
  return String(10_000_000 + ((Date.now() + contadorDni * 7919) % 89_000_000))
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

async function crearAspirante(cliente: SupabaseClient, dni: string): Promise<string> {
  const { data, error } = await cliente.auth.admin.createUser({
    email: emailDePrueba('aspirante'),
    password: 'solo-local-123',
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
  return data.user.id
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
