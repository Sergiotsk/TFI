export type EstadoDeRetorno = 'success' | 'pending' | 'failure' | 'desconocido'

type ValorDeParametro = string | string[] | undefined

export interface ParametrosDeRetorno {
  resultado?: ValorDeParametro
  status?: ValorDeParametro
  collection_status?: ValorDeParametro
}

/**
 * MercadoPago agrega sus propios parámetros (`status`, `collection_status`) a
 * la back URL. Por eso la app usa `resultado` para su intención y, si no está,
 * interpreta el estado de MP. Un valor desconocido no se confunde con éxito.
 */
export function resolverEstadoDeRetorno(params: ParametrosDeRetorno): EstadoDeRetorno {
  const propio = mapear(primero(params.resultado))
  if (propio !== 'desconocido') return propio

  return mapear(primero(params.collection_status) ?? primero(params.status))
}

function primero(valor: ValorDeParametro): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

function mapear(valor: string | undefined): EstadoDeRetorno {
  switch (valor) {
    case 'success':
    case 'approved':
      return 'success'
    case 'pending':
    case 'in_process':
    case 'authorized':
    case 'in_mediation':
      return 'pending'
    case 'failure':
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'failure'
    default:
      return 'desconocido'
  }
}
