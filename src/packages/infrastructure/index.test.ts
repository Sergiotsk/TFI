import { expect, test } from 'vitest'

// Test de humo: la API pública de @tfi/infrastructure se importa sin errores.
test('la API pública de @tfi/infrastructure se importa sin errores', async () => {
  await expect(import('./index')).resolves.toBeDefined()
})
