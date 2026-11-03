import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  Check, 
  Receipt, 
  Search, 
  Lock, 
  Download, 
  FileEdit, 
  CalendarDays, 
  UserCheck, 
  Megaphone, 
  Mail, 
  ArrowUpRight, 
  ChevronRight, 
  CheckCircle2, 
  ListChecks,
  Clock,
  AlertCircle
} from 'lucide-react'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { BotonCopiarExpediente } from '@/components/postulante/boton-copiar-expediente'
import { crearDependencias } from '@/composition-root'
import { crearCliente } from '@/lib/supabase/servidor'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PostulacionPage({ searchParams }: PageProps) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  if (!perfil) {
    redirect('/panel')
  }

  const resolvedParams = await searchParams
  const metodoParam = resolvedParams.metodo
  const estadoParam = resolvedParams.estado
  
  const esPagoEnEfectivo = metodoParam === 'efectivo' || estadoParam === 'pago_pendiente'
  const pagoAcreditado = !esPagoEnEfectivo && estadoParam === 'acreditado'

  const nroExpediente = "TUP-2026-08492"
  const dniFormateado = perfil.dni 
    ? perfil.dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
    : "**.***.***"
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans text-foreground">
      <HeaderInstitucional 
        pasoActual={4} 
        dniPostulante={dniFormateado} 
        nombrePostulante={nombreCompleto} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Encabezado: Saludo con datos del usuario autenticado */}
        <div className="bg-card shadow-(--sombra-tarjeta) p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-bold rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> 
              En Proceso de Auditoría Académica
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              ¡Hola, {perfil.nombre} {perfil.apellido}!
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Seguimiento en tiempo real de tu trámite de ingreso a la{' '}
              <strong>Tecnicatura Universitaria en Programación (TUP) - Cohorte 2026</strong> · Sede Haedo
            </p>
          </div>

          <div className="bg-muted p-3.5 text-left md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              N° de Expediente
            </span>
            <span className="font-mono text-base font-bold text-primary">
              {nroExpediente}
            </span>
            <BotonCopiarExpediente texto={nroExpediente} />
          </div>
        </div>

        {/* Barra de Progreso General */}
        <div className="bg-card shadow-(--sombra-tarjeta) p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-foreground flex items-center">
              <ListChecks className="w-4 h-4 text-primary mr-1.5" /> 
              Fase 3 de 4 en desarrollo: Auditoría de legajo documental
            </span>
            <span className="font-bold text-primary">75% Completado</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div className="bg-primary h-2.5 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Cronograma y Estados */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-base">Cronograma de Verificación Institucional</h2>
              <span className="text-xs text-muted-foreground">Actualizado recientemente</span>
            </div>

            {/* Hito 1: Preinscripción */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-(--senal-verde,var(--accent)) text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">1. Preinscripción y Aceptación de Términos</h3>
                  <span className="text-xs font-bold text-primary bg-(--senal-verde,var(--accent)) px-2.5 py-0.5 rounded-full">
                    Completado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Formulario digital completado exitosamente con manifestación de compromiso arancelario y reglamento general.
                </p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Validación DNI {dniFormateado} OK
                  </span>
                </div>
              </div>
            </div>

            {/* Hito 2: Dinámico (Pago Acreditado vs Pendiente en Tesorería) */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                pagoAcreditado 
                  ? 'bg-(--senal-verde,var(--accent)) text-primary' 
                  : 'bg-(--senal-ambar,var(--accent)) text-primary'
              }`}>
                {pagoAcreditado ? <Receipt className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">2. Reserva de Vacante y Pago de Arancel</h3>
                  {pagoAcreditado ? (
                    <span className="text-xs font-bold text-primary bg-(--senal-verde,var(--accent)) px-2.5 py-0.5 rounded-full">
                      Acreditado
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-primary bg-(--senal-ambar,var(--accent)) px-2.5 py-0.5 rounded-full">
                      Pendiente en Tesorería
                    </span>
                  )}
                </div>

                {pagoAcreditado ? (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monto abonado: <strong>$100.000 ARS</strong> · Comprobante acreditado por Tesorería de Extensión Universitaria.
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Expediente #{nroExpediente}
                      </span>
                      <Link 
                        href="/aspirante/postulacion/pago" 
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Ver Recibo
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Modalidad elegida: <strong>Pago en efectivo en ventanilla</strong>. El arancel de reserva ($100.000 ARS) aún se encuentra pendiente de cobro en Tesorería.
                    </p>
                    <div className="flex items-start gap-2 rounded-lg bg-(--senal-ambar,var(--accent)) p-2.5 text-[11px] text-primary">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Presentate en Tesorería con tu DNI y N° de Expediente (<strong>Lunes a Viernes de 09:00 a 13:00 y de 15:00 a 20:00 hs</strong>). El personal acreditará el pago en tu legajo.
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Seña a abonar: $100.000 ARS
                      </span>
                      <Link 
                        href="/aspirante/postulacion/pago" 
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Cambiar método de pago
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hito 3: En Revisión */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-(--senal-violeta,var(--accent)) text-white flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">3. Validación Digital de Legajo</h3>
                  <span className="text-xs font-bold text-white bg-(--senal-violeta,var(--accent)) px-2.5 py-0.5 rounded-full">
                    En Revisión
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  La Secretaría de Asuntos Estudiantiles se encuentra verificando la autenticidad y nitidez de los documentos remitidos digitalmente.
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                  <div className="p-2.5 bg-muted flex items-center justify-between text-xs">
                    <span>DNI Frente y Dorso</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="p-2.5 bg-muted flex items-center justify-between text-xs">
                    <span>Título Secundario</span>
                    <span className="text-[10px] font-bold text-primary">En cotejo en Libro Matriz</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hito 4: Bloqueado */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 flex items-start gap-4 opacity-60">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-muted-foreground text-sm">4. Asignación de Comisión y Aula</h3>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    Bloqueado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se habilitará automáticamente una vez concluida la auditoría del legajo documental y acreditada la seña arancelaria.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Acciones y Orientación */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 space-y-3">
              <h4 className="font-bold text-foreground text-sm mb-2">Operaciones del Trámite</h4>
              <button className="w-full py-2.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                <Download className="w-4 h-4" /> Descargar Certificado (PDF)
              </button>
              <Link
                href="/aspirante/postulacion/documentacion"
                className="w-full py-2.5 px-3 border border-primary text-primary hover:bg-accent text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <FileEdit className="w-4 h-4" /> Modificar Documentación
              </Link>
            </div>

            {/* Charla de Ingreso */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5">
              <h4 className="font-bold text-foreground text-sm mb-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Charla de Ingreso
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Instancia obligatoria de orientación previa al inicio regular del primer cuatrimestre lectivo 2026.
              </p>
              <dl className="space-y-2 text-xs border-t border-border pt-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Fecha y Horario:</dt>
                  <dd className="font-bold text-foreground">03 Feb 2026 - 10:00 hs</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Módulos:</dt>
                  <dd className="font-bold text-foreground">Introducción a la Facultad</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Modalidad:</dt>
                  <dd className="font-bold text-foreground">Presencial (Sala Magna)</dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground block text-[10px]">Director de Carrera</span>
                  <span className="font-bold text-foreground">Lic. Sebastián Andrés de Jesús</span>
                </div>
              </div>
            </div>

            {/* Canales de Orientación */}
            <div className="bg-card shadow-(--sombra-tarjeta) p-5 text-xs space-y-3">
              <h4 className="font-bold text-foreground mb-1">Canales de Orientación</h4>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 bg-muted hover:bg-accent text-foreground hover:text-primary transition"
              >
                <span className="font-semibold flex items-center">
                  <Megaphone className="w-4 h-4 mr-1.5 text-primary" /> Canal de Avisos Telegram
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
              <a
                href="mailto:alumnos.tup@frh.utn.edu.ar"
                className="flex items-center justify-between p-2.5 bg-muted hover:bg-accent text-foreground hover:text-primary transition"
              >
                <span className="font-semibold flex items-center">
                  <Mail className="w-4 h-4 mr-1.5 text-primary" /> Bedelía de TUP
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}