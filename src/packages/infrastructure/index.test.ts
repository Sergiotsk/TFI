import { expect, test } from 'vitest'

// Test de humo: el paquete todavía no tiene adaptadores. Se reemplaza con el primero que llegue (T034b).
test('la API pública de @tfi/infrastructure se importa sin errores', async () => {
  await expect(import('./index')).resolves.toBeDefined()
})
