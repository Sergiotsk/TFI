import type { ReactNode } from 'react'
import { Pencil, Save } from 'lucide-react'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import type { PeriodoDeIngreso } from '@tfi/domain'
import { modificarPeriodoAccion } from './actions'
import { aHoraDeLaInstitucion } from './esquemas'

const CLASE_DEL_CAMPO =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none'

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
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre" className="sm:col-span-2">
              <input name="nombre" required maxLength={150} defaultValue={periodo.nombre} className={CLASE_DEL_CAMPO} />
            </Campo>
            <Campo etiqueta="Total de cupos">
              <input name="totalCupos" type="number" min={0} step={1} required defaultValue={periodo.totalCupos} className={CLASE_DEL_CAMPO} />
            </Campo>
            <Campo etiqueta="Plazo de pago (días)">
              <input name="diasPlazoPago" type="number" min={1} step={1} required defaultValue={periodo.diasPlazoPago} className={CLASE_DEL_CAMPO} />
            </Campo>
            <Campo etiqueta="Matrícula (pesos)">
              <input
                name="montoPesos"
                type="number"
                min={0.01}
                step={0.01}
                required
                defaultValue={periodo.montoMatriculaCentavos / 100}
                className={CLASE_DEL_CAMPO}
              />
            </Campo>
            <Campo etiqueta="Cierre (hora de Argentina)">
              <input name="cierraEl" type="datetime-local" required defaultValue={cierre} className={CLASE_DEL_CAMPO} />
            </Campo>
          </div>
        </FormularioDeAccion>
      </div>
    </details>
  )
}

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-[13px] font-semibold ${className ?? ''}`}>
      {etiqueta}
      {children}
    </label>
  )
}
