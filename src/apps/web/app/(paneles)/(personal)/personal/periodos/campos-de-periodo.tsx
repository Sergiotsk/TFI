import type { ReactNode } from 'react'

const CLASE_DEL_CAMPO =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none'

interface ValoresDePeriodo {
  nombre: string
  totalCupos: number
  diasPlazoPago: number
  montoPesos: number
  /** El valor de un datetime-local en hora de la institución. */
  cierraEl: string
}

// Los campos del alta y de la edición de un período. Sin valores iniciales, el formulario arranca vacío.
export function CamposDePeriodo({ valores }: { valores?: ValoresDePeriodo }) {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      <Campo etiqueta="Nombre" className="sm:col-span-2">
        <input name="nombre" required maxLength={150} defaultValue={valores?.nombre} className={CLASE_DEL_CAMPO} />
      </Campo>
      <Campo etiqueta="Total de cupos">
        <input name="totalCupos" type="number" min={0} step={1} required defaultValue={valores?.totalCupos} className={CLASE_DEL_CAMPO} />
      </Campo>
      <Campo etiqueta="Plazo de pago (días)">
        <input name="diasPlazoPago" type="number" min={1} step={1} required defaultValue={valores?.diasPlazoPago} className={CLASE_DEL_CAMPO} />
      </Campo>
      <Campo etiqueta="Matrícula (pesos)">
        <input
          name="montoPesos"
          type="number"
          min={0.01}
          step={0.01}
          required
          defaultValue={valores?.montoPesos}
          className={CLASE_DEL_CAMPO}
        />
      </Campo>
      <Campo etiqueta="Cierre (hora de Argentina)">
        <input name="cierraEl" type="datetime-local" required defaultValue={valores?.cierraEl} className={CLASE_DEL_CAMPO} />
      </Campo>
    </div>
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
