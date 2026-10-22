export interface ResumenDeCarga {
  readonly acreditados: number
  readonly aDecidir: number
  readonly noImputados: number
  readonly duplicados: number
}

const RESUMEN_VACIO: ResumenDeCarga = { acreditados: 0, aDecidir: 0, noImputados: 0, duplicados: 0 }

// Una carga del informe de pagos que hace Tesorería (`cargadaPor` es el perfil TESORERIA) y su resumen.
export class CargaDeInforme {
  constructor(
    readonly id: string,
    readonly institucionId: string,
    readonly cargadaPor: string,
    readonly cargadaEl: Date,
    readonly nombreArchivo: string,
    readonly resumen: ResumenDeCarga,
  ) {
    for (const [campo, valor] of Object.entries(resumen)) {
      if (!Number.isSafeInteger(valor) || valor < 0) {
        throw new Error(`Resumen de carga inválido: ${campo} = ${valor}. Debe ser un entero mayor o igual a 0.`)
      }
    }
  }

  /** Carga recién iniciada: el resumen en cero hasta que se cierre. */
  static iniciar(
    id: string,
    institucionId: string,
    cargadaPor: string,
    cargadaEl: Date,
    nombreArchivo: string,
  ): CargaDeInforme {
    return new CargaDeInforme(id, institucionId, cargadaPor, cargadaEl, nombreArchivo, RESUMEN_VACIO)
  }

  conResumen(resumen: ResumenDeCarga): CargaDeInforme {
    return new CargaDeInforme(this.id, this.institucionId, this.cargadaPor, this.cargadaEl, this.nombreArchivo, resumen)
  }
}
