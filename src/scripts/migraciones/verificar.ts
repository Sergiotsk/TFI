// Compara las migraciones del árbol de trabajo contra las de una rama base y falla si rompen las reglas.
// Uso, desde src/: node scripts/migraciones/verificar.ts [ref-base]   (por defecto origin/develop)
// En la CI el árbol es el merge del PR con su base, así que se verifica lo que va a quedar al mergear.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { verificarMigraciones, type Migracion } from './reglas.ts'

const CARPETA = 'supabase/migrations'

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

// Con pathspec, ls-tree lista rutas relativas a src/. La forma `ref:./carpeta` devuelve vacío sin error.
function deLaBase(ref: string): Migracion[] {
  return git('ls-tree', '--name-only', ref, `${CARPETA}/`)
    .split('\n')
    .filter((ruta) => ruta.endsWith('.sql'))
    .map((ruta) => ({ archivo: basename(ruta), contenido: git('show', `${ref}:./${ruta}`) }))
}

function delArbol(): Migracion[] {
  return readdirSync(CARPETA)
    .filter((archivo) => archivo.endsWith('.sql'))
    .map((archivo) => ({ archivo, contenido: readFileSync(join(CARPETA, archivo), 'utf8') }))
}

const ref = process.argv[2] ?? 'origin/develop'
const base = deLaBase(ref)
const problemas = verificarMigraciones(base, delArbol())

// Una base sin migraciones haría pasar todo: casi siempre es una ref mal escrita o sin traer (git fetch).
if (base.length === 0) {
  console.error(`No se encontraron migraciones en ${ref}:${CARPETA}. ¿Está bien la ref y se hizo git fetch?`)
  process.exitCode = 1
} else if (problemas.length === 0) {
  console.log(`Migraciones en orden respecto de ${ref}.`)
} else {
  console.error(`Las migraciones no cumplen las reglas respecto de ${ref} (ver supabase/README.md):\n`)
  for (const { archivo, motivo } of problemas) {
    console.error(`  ✗ ${archivo}\n    ${motivo}\n`)
  }
  process.exitCode = 1
}
