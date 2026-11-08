// Reglas de las migraciones (supabase/README.md, "Reglas para las migraciones") que la CI hace cumplir.
// Al mergear a develop, la integración de GitHub de Supabase aplica las migraciones nuevas en el remoto
// (ADR 0004): una versión repetida o anterior a la última aplicada no se aplica, y el esquema queda distinto
// del repo sin que nadie se entere. Por eso se rechaza en el PR, comparando la rama contra su base.

export type Migracion = { archivo: string; contenido: string }

export type Problema = { archivo: string; motivo: string }

// El formato que acepta Supabase CLI: <timestamp UTC de 14 dígitos>_<nombre>.sql. Lo demás lo saltea.
const FORMATO = /^(\d{14})_[a-z0-9_]+\.sql$/

function versionDe(archivo: string): string | undefined {
  return FORMATO.exec(archivo)?.[1]
}

function normalizar(contenido: string): string {
  return contenido.replace(/\r\n/g, '\n')
}

export function verificarMigraciones(base: Migracion[], cabeza: Migracion[]): Problema[] {
  const problemas: Problema[] = []
  const enCabeza = new Map(cabeza.map((m) => [m.archivo, m]))
  const enBase = new Map(base.map((m) => [m.archivo, m]))

  // Lo que ya está en la base se considera aplicado: no se toca.
  for (const anterior of base) {
    const actual = enCabeza.get(anterior.archivo)
    if (actual === undefined) {
      problemas.push({
        archivo: anterior.archivo,
        motivo: 'borrada o renombrada: ya está en la base y se considera aplicada.',
      })
    } else if (normalizar(actual.contenido) !== normalizar(anterior.contenido)) {
      problemas.push({
        archivo: anterior.archivo,
        motivo: 'editada: ya está en la base y se considera aplicada. Corregila con una migración nueva.',
      })
    }
  }

  const ultimaDeLaBase = base
    .map((m) => versionDe(m.archivo))
    .filter((v) => v !== undefined)
    .sort()
    .at(-1)

  const versiones = new Set(
    cabeza.filter((m) => enBase.has(m.archivo)).map((m) => versionDe(m.archivo)),
  )

  const nuevas = cabeza.filter((m) => !enBase.has(m.archivo)).sort((a, b) => a.archivo.localeCompare(b.archivo))

  for (const nueva of nuevas) {
    const version = versionDe(nueva.archivo)
    if (version === undefined) {
      problemas.push({
        archivo: nueva.archivo,
        motivo: 'formato inválido: tiene que ser <timestamp de 14 dígitos>_<nombre en minúsculas>.sql. Creala con `supabase migration new`.',
      })
    } else if (versiones.has(version)) {
      problemas.push({
        archivo: nueva.archivo,
        motivo: `versión repetida (${version}): Supabase identifica cada migración por su versión. Recreala con \`supabase migration new\`.`,
      })
    } else if (ultimaDeLaBase !== undefined && version <= ultimaDeLaBase) {
      problemas.push({
        archivo: nueva.archivo,
        motivo: `queda antes de la última migración de la base (${ultimaDeLaBase}) y no se aplicaría. Recreala con \`supabase migration new\`.`,
      })
    }
    versiones.add(version)
  }

  return problemas
}
