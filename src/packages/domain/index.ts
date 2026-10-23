// API pública de @tfi/domain: lo que no se exporta acá no se puede importar desde otros paquetes.
export { Perfil } from './perfil/perfil'
export type { Rol } from './perfil/rol'
export { ROLES_DEL_PERSONAL } from './perfil/rol'
export type { Sexo } from './perfil/sexo'
export { PeriodoDeIngreso } from './periodo/periodo-de-ingreso'
export { PeriodoDuplicado, PeriodoInvalido } from './periodo/errores'
export { Postulacion } from './postulacion/postulacion'
export { NumeroDePostulacion } from './postulacion/numero-de-postulacion'
export {
  ESTADOS_DE_POSTULACION,
  ESTADOS_QUE_OCUPAN_CUPO,
  MOTIVOS_DE_REVISION,
  TRANSICIONES,
  ocupaCupo,
} from './postulacion/estados'
export type { EstadoPostulacion, EstadoDePostulacion, MotivoDeRevision } from './postulacion/estados'
export type { MotivoRevision } from './postulacion/motivoRevision'
export {
  TransicionInvalida,
  PeriodoCerrado,
  SinCuposParaIniciar,
  SinCuposParaConfirmar,
  CuposPorDebajoDeConfirmadas,
  PostulacionDuplicada,
} from './postulacion/errores'
export { Documento } from './documento/documento'
export {
  TIPOS_DE_DOCUMENTO,
  TRANSICIONES_DE_DOCUMENTO,
} from './documento/estado'
export type { EstadoDocumento, TipoDeDocumento } from './documento/estado'
export {
  ObservacionDeDocumentoRequerida,
  TransicionDeDocumentoInvalida,
} from './documento/errores'

// Dominio de pagos: base para la importación del informe y las decisiones de Dirección.
export { Monto } from './pago/monto'
export { ReferenciaDePago, type ProveedorDePago } from './pago/referencia-de-pago'
export {
  Pago,
  ESTADOS_DE_PAGO,
  MOTIVOS_NO_IMPUTADO,
  type EstadoDePago,
  type MotivoNoImputado,
  type PagoInformado,
  type DatosOpcionalesDePago,
} from './pago/pago'
export { CargaDeInforme, type ResumenDeCarga } from './pago/carga-de-informe'
export { DecisionDeDireccion, type ResolucionDeDireccion } from './pago/decision-de-direccion'
export { Dni } from './perfil/dni'
export {
  evaluarPago,
  type Candidata,
  type Imputacion,
  type EstadoEsperado,
  type DecisionDeAcreditacion,
} from './postulacion/evaluar-pago'
