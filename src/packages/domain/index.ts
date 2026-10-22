// API pública de @tfi/domain: lo que no se exporta acá no se puede importar desde otros paquetes.
export { Perfil } from './perfil/perfil'
export type { Rol } from './perfil/rol'
export { ROLES_DEL_PERSONAL } from './perfil/rol'
export type { Sexo } from './perfil/sexo'
export { PeriodoDeIngreso } from './periodo/periodo-de-ingreso'
export { Postulacion } from './postulacion/postulacion'
export { NumeroDePostulacion } from './postulacion/numero-de-postulacion'
export {
  ESTADOS_DE_POSTULACION,
  ESTADOS_QUE_OCUPAN_CUPO,
  TRANSICIONES,
  ocupaCupo,
} from './postulacion/estados'
export type { EstadoPostulacion } from './postulacion/estados'
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
export type { EstadoDocumento } from './documento/estado'
