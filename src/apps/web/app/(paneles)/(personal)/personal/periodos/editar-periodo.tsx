import { Pencil, Save } from 'lucide-react'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import type { PeriodoDeIngreso } from '@tfi/domain'
import { modificarPeriodoAccion } from './actions'
import { CamposDePeriodo } from './campos-de-periodo'
import { aHoraDeLaInstitucion } from './esquemas'

// Edición de un período para Dirección: se despliega dentro de la tarjeta, sin JavaScript extra.
export function EditarPeriodo({ periodo }: { periodo: PeriodoDeIngreso }) {
  const cierre = aHoraDeLaInstitucion(periodo.cierraEl)

  return (
    <details className="group border-t border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-3 text-sm font-semibold text-primary hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
        <Pencil aria-hidden="true" className="size-4" />
        <span className="group-open:hidden">Editar período</span>
        <span className="hidden group-open:inline">Cerrar edición</span>
      </summary>

      <div className="px-6 pb-5">
        <FormularioDeAccion
          accion={modificarPeriodoAccion}
          ocultos={{ id: periodo.id, cierraElOriginal: cierre }}
          etiqueta="Guardar cambios"
          icono={<Save aria-hidden="true" />}
        >
          <CamposDePeriodo
            valores={{
              nombre: periodo.nombre,
              totalCupos: periodo.totalCupos,
              diasPlazoPago: periodo.diasPlazoPago,
              montoPesos: periodo.montoMatriculaCentavos / 100,
              cierraEl: cierre,
            }}
          />
        </FormularioDeAccion>
      </div>
    </details>
  )
}
