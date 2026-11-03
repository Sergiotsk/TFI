import { UploadDocumentos } from '@/components/postulante/upload-documentos'
import { Clock, ShieldAlert, FileText } from 'lucide-react'

export default async function DocumentacionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Banner de Plazo de 10 días adaptado a señal ámbar institucional */}
      <div className="bg-card shadow-(--sombra-tarjeta) border-l-4 border-[var(--senal-ambar)] p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-[var(--senal-ambar)] shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-foreground block">
              Plazo legal improrrogable
            </span>
            <p className="text-xs text-muted-foreground">
              Disponés de <strong>10 días hábiles</strong> posteriores al pago para presentar la totalidad de la documentación requerida.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-accent text-primary text-xs font-bold shrink-0">
          Días restantes: 10
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-bold mb-3">
              PASO 3 DE 4 · DOCUMENTACIÓN
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Carga de Legajo Digital
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Subí los comprobantes y certificaciones en formato digital para que el Departamento de Alumnos audite tu solicitud.
            </p>
          </div>

          <div className="bg-card shadow-(--sombra-tarjeta) p-6">
            <UploadDocumentos />
          </div>
        </div>

        {/* Columna Derecha: Reglas y Recomendaciones */}
        <div className="space-y-6">
          <div className="bg-card shadow-(--sombra-tarjeta) p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-bold text-foreground text-sm">Pautas de digitalización</h4>
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

          <div className="bg-card shadow-(--sombra-tarjeta) border-l-4 border-[var(--destructive)] p-5 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-[var(--destructive)]" />
              <span className="font-bold text-foreground">Aviso sobre falsedad de datos</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Cualquier alteración, omisión o falsificación en los documentos cargados implicará la anulación inmediata de la inscripción y la pérdida de la vacante sin reintegro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}