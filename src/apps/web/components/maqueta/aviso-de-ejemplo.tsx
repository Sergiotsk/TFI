// Aviso de una pantalla que todavía no tiene backend: evita que los datos de ejemplo se confundan con reales.
export function AvisoDeEjemplo({ faltante }: { faltante: string }) {
  return (
    <p
      role="note"
      className="mx-auto mt-6 max-w-6xl rounded-lg border border-border bg-muted px-4 py-2 text-xs text-muted-foreground sm:mx-6 lg:mx-auto"
    >
      Datos de ejemplo: falta el backend de {faltante}.
    </p>
  )
}
