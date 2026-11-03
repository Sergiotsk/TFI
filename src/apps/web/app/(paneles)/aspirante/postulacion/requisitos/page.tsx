import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin 
} from 'lucide-react'
import { ChecklistClausulas } from '@/components/postulante/checklist-clausulas'

export default async function RequisitosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Banner Convocatoria adaptado a tokens de Haedo */}
      <div className="bg-card shadow-(--sombra-tarjeta) border-l-4 border-primary p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary h-6 w-6 shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase text-primary tracking-wide block">
              Convocatoria Ciclo Lectivo 2026
            </span>
            <p className="text-xs text-muted-foreground">
              Sede Haedo · Proceso formal sujeto a cupo máximo estipulado por resolución del decanato.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-accent text-primary text-xs font-bold shrink-0">
          Cupos restantes: 24
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-bold mb-3">
              PASO 1 DE 4 · FASE INICIAL
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Tecnicatura Universitaria en Programación (TUP)
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Proceso oficial y vinculante de reserva de cupo, validación de condiciones académicas e inicio
              de postulación para ingresantes a la Universidad Tecnológica Nacional - Facultad Regional Haedo.
            </p>
          </div>

          {/* Tarjetas Resumen Carrera con tokens de Haedo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card p-4 shadow-(--sombra-tarjeta)">
              <span className="text-[11px] font-bold text-muted-foreground block uppercase">Duración</span>
              <span className="text-base font-bold text-foreground mt-1 block">2 Años</span>
              <span className="text-xs text-muted-foreground">4 cuatrimestres</span>
            </div>
            <div className="bg-card p-4 shadow-(--sombra-tarjeta)">
              <span className="text-[11px] font-bold text-muted-foreground block uppercase">Modalidad</span>
              <span className="text-base font-bold text-foreground mt-1 block">Híbrido</span>
              <span className="text-xs text-muted-foreground">Sincrónico + Haedo</span>
            </div>
            <div className="bg-card p-4 shadow-(--sombra-tarjeta)">
              <span className="text-[11px] font-bold text-muted-foreground block uppercase">Cupo</span>
              <span className="text-base font-bold text-primary mt-1 block">Estricto</span>
              <span className="text-xs text-muted-foreground">Orden del pago</span>
            </div>
            <div className="bg-card p-4 shadow-(--sombra-tarjeta)">
              <span className="text-[11px] font-bold text-muted-foreground block uppercase">Régimen</span>
              <span className="text-base font-bold text-foreground mt-1 block">Arancelada</span>
              <span className="text-xs text-muted-foreground">Seña para reservar</span>
            </div>
          </div>

          {/* Información de Reserva */}
          <div className="bg-card shadow-(--sombra-tarjeta) border-l-4 border-[var(--senal-ambar)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-[var(--senal-ambar)] h-5 w-5" />
              <h2 className="font-bold text-foreground text-base">
                Información crucial sobre la reserva de vacante
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              El pago inicial efectúa la reserva preventiva del cupo en el sistema de cómputos de la UTN
              FRH. Según la reglamentación vigente de carreras autofinanciadas, el trámite genera dos
              alternativas excluyentes:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border-l-2 border-[var(--senal-verde)] pl-3">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-1">
                  <CheckCircle2 className="h-4 w-4 text-[var(--senal-verde)]" /> Caso 1: Trámite exitoso
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Presentando la documentación respaldatoria dentro del plazo legal de <strong>10 días hábiles</strong>, el 100% de la seña ($100.000 ARS) se imputa y cancela de forma automática la matrícula formal de inicio de ciclo.
                </p>
              </div>
              <div className="border-l-2 border-[var(--destructive)] pl-3">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-1">
                  <XCircle className="h-4 w-4 text-[var(--destructive)]" /> Caso 2: Incumplimiento
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Si se supera el plazo límite, se comprueba falsedad o se adeudan asignaturas secundarias, se pierde la vacante de forma irrevocable y el monto abonado no es reembolsable.
                </p>
              </div>
            </div>
          </div>

          {/* Checklist de Conformidad */}
          <ChecklistClausulas />
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          <div className="bg-card shadow-(--sombra-tarjeta) p-6">
            <h4 className="font-bold text-foreground text-sm mb-3">Resumen del trámite</h4>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Carrera</dt>
                <dd className="font-semibold text-foreground">TUP</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Ciclo Lectivo</dt>
                <dd className="font-semibold text-foreground">1° Cuatrimestre 2026</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Monto Seña de Reserva</dt>
                <dd className="font-black text-primary text-sm">$100.000 ARS</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Plazo de la Documentación</dt>
                <dd className="font-bold text-[var(--destructive)]">10 días hábiles</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Imputación Arancelaria</dt>
                <dd className="font-bold text-[var(--senal-verde)]">100% Arancelada</dd>
              </div>
            </dl>
          </div>

          <div className="bg-primary text-primary-foreground p-6 shadow-(--sombra-tarjeta)">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80 block mb-1">
              Facultad Regional Haedo
            </span>
            <h4 className="font-black text-base mb-2">Excelencia pública tecnológica</h4>
            <p className="text-xs text-primary-foreground/90 leading-relaxed mb-3">
              Fundada con un fuerte vínculo con el polo industrial y tecnológico, la UTN Haedo forma profesionales con inserción directa en la industria.
            </p>
            <div className="flex items-center text-xs text-primary-foreground/80 gap-1.5">
              <MapPin className="h-4 w-4" /> París 532, Haedo, Buenos Aires
            </div>
          </div>

          <div className="bg-card shadow-(--sombra-tarjeta) p-4 text-xs text-muted-foreground border-l-4 border-primary">
            <span className="font-bold text-foreground block mb-0.5">¿Dudas sobre tu título secundario?</span>
            Escribí a <strong className="text-primary">ingresantes@frh.utn.edu.ar</strong> antes de confirmar la reserva.
          </div>
        </div>
      </div>
    </div>
  )
}