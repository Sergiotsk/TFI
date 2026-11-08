// Solo tokens semanticos de Tailwind: los componentes no conocen colores fijos.
export const CLASE_CAMPO =
  'mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50'

export const CLASE_CAMPO_INVALIDO =
  'border-destructive focus-visible:ring-destructive focus-visible:ring-offset-card'

export const CLASE_BOTON =
  'inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50'

export const CLASE_ETIQUETA = 'block text-sm font-medium text-foreground'

export const CLASE_ERROR = 'mt-1 text-sm text-destructive'
