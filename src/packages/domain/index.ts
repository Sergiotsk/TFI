// API pública de @tfi/domain: lo que no se exporta acá no se puede importar desde otros paquetes.
export { Perfil } from './perfil/perfil'
export type { Rol } from './perfil/rol'
export { ROLES_DEL_PERSONAL } from './perfil/rol'
export type { Sexo } from './perfil/sexo'
export { Documento } from './documento/documento'
export type { EstadoDocumento } from './documento/estado'

// Feature 001: postulación con plazo de pago y control de cupos
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
export { PeriodoDeIngreso } from './periodo/periodo-de-ingreso'
export { NumeroDePostulacion } from './postulacion/numero-de-postulacion'
export {
  ESTADOS_DE_POSTULACION,
  ESTADOS_QUE_OCUPAN_CUPO,
  MOTIVOS_DE_REVISION,
  ocupaCupo,
  type EstadoDePostulacion,
  type MotivoDeRevision,
} from './postulacion/estados'
export { TransicionInvalida, PeriodoCerrado, SinCuposParaIniciar, CuposPorDebajoDeConfirmadas } from './postulacion/errores'
export { Postulacion } from './postulacion/postulacion'
export {
  evaluarPago,
  type Candidata,
  type Imputacion,
  type EstadoEsperado,
  type DecisionDeAcreditacion,
} from './postulacion/evaluar-pago'
