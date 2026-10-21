'use client'

import Link from 'next/link'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  Clock, 
  Download, 
  Home, 
  Mail, 
  AlertCircle 
} from 'lucide-react'
import { use } from 'react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EstadoFinalPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <HeaderInstitucional pasoActual={4} dniPostulante="**.***.***" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Encabezado de Confirmación */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2 shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>
          <span className="block text-xs font-bold tracking-widest text-primary uppercase">
            Trámite de Ingreso Iniciado
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¡Tu solicitud fue registrada con éxito!
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Hemos recibido el comprobante de reserva de vacante y la documentación digital. Tu legajo se encuentra en proceso de validación formal.
          </p>
        </div>

        {/* Tarjeta Principal de Estado */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Código identificador de trámite</span>
              <span className="text-xl font-mono font-bold text-foreground tracking-wider uppercase">
                {id}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Estado: En Revisión Administrativa</span>
            </div>
          </div>

          {/* Resumen Informativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block font-medium">Carrera elegida</span>
              <span className="font-semibold text-foreground text-sm block">Tecnicatura Univ. en Programación</span>
              <span className="text-muted-foreground">Cohorte 1° Cuatrimestre 2026 · Sede Haedo</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block font-medium">Arancel de Reserva</span>
              <span className="font-semibold text-emerald-600 text-sm block">$100.000 ARS (Acreditado)</span>
              <span className="text-muted-foreground">Imputable 100% al costo de matrícula</span>
            </div>
          </div>

          {/* Próximos Pasos */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Próximos pasos del proceso
            </h4>
            <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal list-inside pl-1 leading-relaxed">
              <li>El Departamento de Alumnos verificará la nitidez y autenticidad del legajo en un plazo estimado de <strong>3 a 5 días hábiles</strong>.</li>
              <li>Recibirás un correo electrónico de confirmación con la resolución de tu admisión y los datos de acceso al campus virtual.</li>
              <li>En caso de observar inconsistencias en la documentación, te notificaremos para que puedas reingresar y corregir los archivos correspondientes.</li>
            </ol>
          </div>

          {/* Acciones */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Constancia en PDF</span>
            </Button>

            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="w-4 h-4" />
                <span>Volver al Portal Principal</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Contacto soporte */}
        <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span>¿Tenés dudas sobre tu trámite? Escribinos a <strong>ingresantes@frh.utn.edu.ar</strong> citando tu código <strong>{id}</strong></span>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}