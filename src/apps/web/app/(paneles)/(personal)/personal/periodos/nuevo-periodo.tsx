import { CalendarPlus, Plus } from 'lucide-react'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { crearPeriodoAccion } from './actions'
import { CamposDePeriodo } from './campos-de-periodo'

// Alta de un período para Dirección: una tarjeta plegable arriba de la lista, sin JavaScript extra. Arranca
// abierta cuando todavía no hay períodos, porque es lo único que se puede hacer en la pantalla.
export function NuevoPeriodo({ abierto }: { abierto: boolean }) {
  return (
    <details open={abierto} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-4 text-sm font-semibold text-primary hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
        <CalendarPlus aria-hidden="true" className="size-4" />
        <span className="group-open:hidden">Nuevo período</span>
        <span className="hidden group-open:inline">Cerrar el alta</span>
      </summary>

      <div className="space-y-3 border-t border-border px-6 py-5">
        <p className="text-sm text-muted-foreground">
          El período queda abierto hasta la fecha de cierre. Los cupos son el techo de vacantes: la ocupación sale de
          las postulaciones.
        </p>
        <FormularioDeAccion accion={crearPeriodoAccion} ocultos={{}} etiqueta="Crear período" icono={<Plus aria-hidden="true" />}>
          <CamposDePeriodo />
        </FormularioDeAccion>
      </div>
    </details>
  )
}
