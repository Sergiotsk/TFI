import type { PerfilDeInforme } from '../perfil-de-informe'

/**
 * El "Informe TUP" que genera SysAdmin en UTN Facultad Regional Haedo.
 *
 * Sin filtro de concepto: el texto con el que SysAdmin registra la seña todavía no está confirmado
 * (MATRICULA es provisorio, #33). Hasta entonces, las filas ajenas a la admisión las ignora el caso de
 * uso por DNI.
 */
export const PERFIL_SYSADMIN_UTN_HAEDO: PerfilDeInforme = {
  proveedor: 'INFORME_SYSADMIN',
  columnas: {
    fecha: 'Fecha Recibo',
    referencia: 'Nro Recibo',
    dni: 'Nro Doc',
    monto: 'Monto recibido',
    descripcion: 'Descripción Recibo',
  },
}
