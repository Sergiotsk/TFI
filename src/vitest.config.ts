// Vitest de todo el workspace (T13). Dos proyectos:
// - unidad: dominio, casos de uso, fakes, la web y los scripts. Sin red ni base: es lo que corre `pnpm test` (y la CI).
// - contratos: las suites de contrato contra los adaptadores reales (Supabase local), con `pnpm test:contratos`.
//   Las variables SUPABASE_TEST_* salen de `src/.env.test` (ignorado por git) o del entorno del shell,
//   que tiene prioridad. Sin ellas, las suites de contrato se saltan solas.
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { defineConfig } from 'vitest/config'

const PREFIJO_DE_CONTRATOS = 'SUPABASE_TEST_'

function entornoDeContratos(): Record<string, string> {
  const archivo = new URL('./.env.test', import.meta.url)
  const delArchivo = existsSync(archivo) ? parseEnv(readFileSync(archivo, 'utf8')) : {}
  const entorno: Record<string, string> = {}
  for (const [clave, valor] of Object.entries({ ...delArchivo, ...process.env })) {
    if (clave.startsWith(PREFIJO_DE_CONTRATOS) && valor) entorno[clave] = valor
  }
  return entorno
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unidad',
          include: ['packages/**/*.test.ts', 'apps/web/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
          exclude: ['**/*.contrato.test.ts', '**/node_modules/**', '**/.next/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'contratos',
          include: ['packages/infrastructure/**/*.contrato.test.ts'],
          environment: 'node',
          env: entornoDeContratos(),
        },
      },
    ],
  },
})
