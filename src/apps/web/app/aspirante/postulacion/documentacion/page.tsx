import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { UploadDocumentos } from '@/components/postulante/upload-documentos'
import { Clock, ShieldAlert, FileText } from 'lucide-react'
import { conActorDePanel } from '@/app/(paneles)/sesion-de-panel'

// Demo: los mismos estados que SubirDocumento acepta (ESTADOS_QUE_ADMITEN_DOCUMENTOS).
const ADMITEN_DOCUMENTOS = [
  'VACANTE_CONFIRMADA',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
]

export default async function DocumentacionPage() {
  const postulacionId = await conActorDePanel(async ({ consultarPostulacion }, actor) => {
    const propias = await consultarPostulacion.listarMias(actor)
    return propias.find((postulacion) => ADMITEN_DOCUMENTOS.includes(postulacion.estado))?.id ?? null
  })

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <HeaderInstitucional pasoActual={3} dniPostulante="**.***.***" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Banner de Plazo de 10 días */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase text-amber-800 tracking-wide block">
                Plazo legal improrrogable
              </span>
              <p className="text-xs text-amber-900/80">
                Disponés de <strong>10 días hábiles</strong> posteriores al pago para presentar la totalidad de la documentación requerida.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300 shrink-0">
            Días restantes: 10
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Uploads */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full mb-3">
                PASO 3 DE 4 · DOCUMENTACIÓN
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Carga de Legajo Digital
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Subí los comprobantes y certificaciones en formato digital para que el Departamento de Alumnos audite tu solicitud.
              </p>
            </div>

            <UploadDocumentos postulacionId={postulacionId} />
          </div>

          {/* Columna Derecha: Reglas y Recomendaciones */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground text-sm">Pautas de digitalización</h4>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Las fotografías deben ser nítidas, tomadas con buena luz y sin reflejos que impidan leer los textos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Si el analítico tiene firmas y sellos al dorso, digitalizá ambas caras en un único PDF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>El tamaño máximo admitido por cada archivo individual es de <strong>5 MB</strong>.</span>
                </li>
              </ul>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-xs text-rose-900">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span className="font-bold text-rose-950">Aviso sobre falsedad de datos</span>
              </div>
              <p className="leading-relaxed">
                Cualquier alteración, omisión o falsificación en los documentos cargados implicará la anulación inmediata de la inscripción y la pérdida de la vacante sin reintegro.
              </p>
            </div>
          </div>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}