import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { firmaDeMercadoPagoValida } from './mercadopago-webhook'

const SECRETO = 'secreto-de-prueba'
const TS = '1704908010'
const DATA_ID = '123456'
const REQUEST_ID = 'req-1'

function firmar(ts = TS, dataId = DATA_ID, requestId = REQUEST_ID): string {
  const manifiesto = `id:${dataId};request-id:${requestId};ts:${ts};`
  return createHmac('sha256', SECRETO).update(manifiesto).digest('hex')
}

describe('firmaDeMercadoPagoValida', () => {
  it('acepta una firma válida', () => {
    expect(
      firmaDeMercadoPagoValida({
        secret: SECRETO,
        signature: `ts=${TS},v1=${firmar()}`,
        requestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(true)
  })

  it('rechaza una firma alterada', () => {
    expect(
      firmaDeMercadoPagoValida({
        secret: SECRETO,
        signature: `ts=${TS},v1=${firmar().slice(0, -1)}0`,
        requestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(false)
  })

  it('rechaza si falta la firma o el request id', () => {
    expect(
      firmaDeMercadoPagoValida({
        secret: SECRETO,
        signature: null,
        requestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(false)
    expect(
      firmaDeMercadoPagoValida({
        secret: SECRETO,
        signature: `ts=${TS},v1=${firmar()}`,
        requestId: null,
        dataId: DATA_ID,
      }),
    ).toBe(false)
  })

  it('rechaza si el id no coincide con el firmado', () => {
    expect(
      firmaDeMercadoPagoValida({
        secret: SECRETO,
        signature: `ts=${TS},v1=${firmar()}`,
        requestId: REQUEST_ID,
        dataId: '999999',
      }),
    ).toBe(false)
  })
})
