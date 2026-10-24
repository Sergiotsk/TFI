import { CargaDeInforme, type ResumenDeCarga } from '@tfi/domain'
import type { Reloj } from '../reloj/puerto'
import type { RegistroDeCargas } from './puerto'

/** Cargas de informe en memoria. Con el reloj fijo, las empatadas se ordenan por orden de alta. */
export class RegistroDeCargasFake implements RegistroDeCargas {
  private readonly cargas: CargaDeInforme[] = []
  private siguiente = 1

  constructor(private readonly reloj: Reloj) {}

  async iniciar(institucionId: string, cargadaPor: string, nombreArchivo: string): Promise<CargaDeInforme> {
    const carga = CargaDeInforme.iniciar(
      `carga-${this.siguiente++}`,
      institucionId,
      cargadaPor,
      this.reloj.ahora(),
      nombreArchivo,
    )
    this.cargas.push(carga)
    return carga
  }

  async cerrar(cargaId: string, resumen: ResumenDeCarga): Promise<void> {
    const indice = this.cargas.findIndex((c) => c.id === cargaId)
    const carga = this.cargas[indice]
    if (carga === undefined) throw new Error(`No existe la carga ${cargaId}`)
    this.cargas[indice] = carga.conResumen(resumen)
  }

  async listar(institucionId: string): Promise<CargaDeInforme[]> {
    return this.cargas
      .map((carga, orden) => ({ carga, orden }))
      .filter(({ carga }) => carga.institucionId === institucionId)
      .sort((a, b) => b.carga.cargadaEl.getTime() - a.carga.cargadaEl.getTime() || b.orden - a.orden)
      .map(({ carga }) => carga)
  }

  /** Institución de una carga (para que el fake de pagos ubique los no imputados). */
  institucionDe(cargaId: string): string | undefined {
    return this.cargas.find((c) => c.id === cargaId)?.institucionId
  }
}
