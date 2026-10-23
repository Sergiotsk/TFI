import { describe, expect, it } from 'vitest'
import type { PasarelaDePago } from './puerto'

export function probarContratoDePasarelaDePago(
  crearPasarela: () => PasarelaDePago,
) {
  describe('contrato: PasarelaDePago', () => {
    it('crea preferencia con init_point', async () => {
      const pasarela = crearPasarela()
      const creada = await pasarela.crearPreferencia({
        externalId: 'int_test_1',
        postulacionId: 'post_test_1',
        titulo: 'Matrícula TUP',
        monto: { centavos: 5000000 } as any,
        backUrls: {
          success: 'http://localhost:3000/pagos/retorno?status=success',
          pending: 'http://localhost:3000/pagos/retorno?status=pending',
          failure: 'http://localhost:3000/pagos/retorno?status=failure',
        },
        notificationUrl: 'http://localhost:3000/api/pagos/webhook/mercadopago',
      })
      expect(creada.preferenceId).toBeTruthy()
      expect(creada.initPoint).toBeTruthy()
    })

    it('obtiene pago aprobado', async () => {
      const pasarela: any = crearPasarela()
      if (typeof pasarela.simularPagoAprobado === 'function') {
        pasarela.simularPagoAprobado('mp_123', 'int_test_1')
      }
      const pago = await pasarela.obtenerPago('mp_123')
      expect(pago.paymentId).toBe('mp_123')
      expect(pago.status).toBe('approved')
    })
  })
}