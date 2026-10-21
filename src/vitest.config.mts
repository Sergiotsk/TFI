import { defineConfig } from 'vitest/config'

// Dos proyectos (research R4):
// - `unidad`: dominio, casos de uso y contratos contra los fakes. Corre siempre, también en CI.
// - `contratos`: los *.contrato.test.ts de infrastructure, que necesitan Supabase local
//   (SUPABASE_TEST_URL). En CI no hay base, así que los tests se saltan solos.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unidad',
          include: ['packages/**/*.{test,spec}.ts'],
          exclude: ['**/node_modules/**', '**/*.contrato.test.ts'],
        },
      },
      {
        test: {
          name: 'contratos',
          include: ['packages/infrastructure/**/*.contrato.test.ts'],
        },
      },
    ],
  },
})
