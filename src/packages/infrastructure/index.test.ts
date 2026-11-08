import { expect, test } from 'vitest'

// Test de humo: la API pública de @tfi/infrastructure se importa sin errores.
// Importa todos los adaptadores (exceljs incluido): en frío, recién instaladas las dependencias como en la CI, tarda
// más que el timeout por defecto.
test('la API pública de @tfi/infrastructure se importa sin errores', { timeout: 60_000 }, async () => {
  await expect(import('./index')).resolves.toBeDefined()
})
