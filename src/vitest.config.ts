// Vitest de todo el workspace (T13). Dos proyectos:
// - unidad: dominio, casos de uso, fakes y la web. Sin red ni base: es lo que corre `pnpm test` (y la CI).
// - contratos: las suites de contrato contra los adaptadores reales (Supabase local), con `pnpm test:contratos`.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unidad',
          include: ['packages/**/*.test.ts', 'apps/web/**/*.test.{ts,tsx}'],
          exclude: ['**/*.contrato.test.ts', '**/node_modules/**', '**/.next/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'contratos',
          include: ['packages/infrastructure/**/*.contrato.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
