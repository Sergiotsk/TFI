// ESLint de todo el workspace (T12). Implementa la barrera 2 de la constitución (Principio I):
// la regla de límites entre capas, que falla en CI aunque alguien agregue la dependencia al package.json.
import js from '@eslint/js'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const raiz = import.meta.dirname

// Qué puede importar cada capa de las otras (las dependencias apuntan siempre hacia domain).
const capasProhibidas = {
  'packages/domain': ['@tfi/application', '@tfi/infrastructure', '@tfi/web'],
  'packages/application': ['@tfi/infrastructure', '@tfi/web'],
  'packages/infrastructure': ['@tfi/web'],
}

const limitesEntreCapas = Object.entries(capasProhibidas).map(([carpeta, prohibidas]) => ({
  name: `tfi/limites/${carpeta}`,
  files: [`${carpeta}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: prohibidas.flatMap((paquete) => [paquete, `${paquete}/*`]),
            message: `${carpeta} no puede depender de esta capa: las dependencias apuntan hacia domain (Principio I).`,
          },
        ],
      },
    ],
  },
}))

// Barrera 1 reforzada: cada paquete solo importa lo que declara en SU package.json.
// Sin esto, Node encuentra lo instalado en la raíz del workspace (src/node_modules) y el import "anda".
const dependenciasPorPaquete = ['packages/domain', 'packages/application', 'packages/infrastructure', 'apps/web'].map(
  (carpeta) => ({
    name: `tfi/dependencias/${carpeta}`,
    files: [`${carpeta}/**/*.{ts,tsx,mjs}`],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [`${raiz}/${carpeta}`],
          // Archivos de configuración y tests pueden usar devDependencies.
          devDependencies: ['**/*.config.{ts,mjs}', '**/*.test.{ts,tsx}', '**/contrato.ts'],
        },
      ],
    },
  }),
)

// La config de Next (React, hooks, accesibilidad, Next) aplica solo a apps/web.
const nextSoloEnWeb = nextCoreWebVitals.map((config) => ({
  ...config,
  files: (config.files ?? ['**/*.{js,jsx,mjs,ts,tsx}']).map((patron) => `apps/web/${patron}`),
  settings: { ...config.settings, next: { rootDir: 'apps/web/' } },
}))

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/.next/', '**/next-env.d.ts']),

  // Sin comentarios `eslint-disable`: una regla se cambia acá, en un PR que revisa el code owner (CODEOWNERS).
  { name: 'tfi/sin-config-en-linea', linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' } },

  js.configs.recommended,
  tseslint.configs.recommended, // incluye no-explicit-any como error (Principio IV)
  ...nextSoloEnWeb,

  {
    name: 'tfi/base',
    languageOptions: { globals: { ...globals.node } },
    plugins: { 'import-x': importX },
    settings: {
      // El resolver por defecto busca .js: sin .ts, las reglas de import no ven a dónde apunta cada import y lo saltean.
      'import-x/resolver-next': [createNodeResolver({ extensions: ['.ts', '.tsx', '.mjs', '.js'] })],
      // `@/...` es el alias interno de apps/web, no un paquete de npm.
      'import-x/internal-regex': '^@/',
    },
    rules: {
      // Prohibidos los imports relativos que entran en otro paquete (../../packages/...): se importa como @tfi/*.
      'import-x/no-relative-packages': 'error',
    },
  },

  ...dependenciasPorPaquete,
  ...limitesEntreCapas,
])
