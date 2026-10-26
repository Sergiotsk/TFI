'use client'

import Link from 'next/link'
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
  Copy, 
  ListChecks 
} from 'lucide-react'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'

export default function PostulacionPage() {
  const nroExpediente = "TUP-2026-08492"

  const copiarExpediente = () => {
    navigator.clipboard.writeText(nroExpediente)
  }

  return (
    <div className="bg-[#f0f3ff] text-slate-800 min-h-screen flex flex-col justify-between font-sans">
      <HeaderInstitucional pasoActual={4} dniPostulante="**.***.***" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Encabezado: Saludo y Expediente */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#005a9c] text-xs font-bold rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-[#005a9c] animate-pulse"></span> 
              En Proceso de Auditoría Académica
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ¡Hola, Lucas Rossi!
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Seguimiento en tiempo real de tu trámite de ingreso a la{' '}
              <strong>Tecnicatura Universitaria en Programación (TUP) - Cohorte 2026</strong> · Sede Haedo
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              N° de Expediente
            </span>
            <span className="font-mono text-base font-black text-[#005a9c]">
              {nroExpediente}
            </span>
            <button 
              onClick={copiarExpediente}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 mt-0.5 md:ml-auto cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copiar
            </button>
          </div>
        </div>

        {/* Barra de Progreso General */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-slate-800 flex items-center">
              <ListChecks className="w-4 h-4 text-[#005a9c] mr-1.5" /> 
              Fase 3 de 4 en desarrollo: Auditoría de legajo documental
            </span>
            <span className="font-bold text-[#005a9c]">75% Completado</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-[#005a9c] h-2.5 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Cronograma y Estados */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">Cronograma de Verificación Institucional</h2>
              <span className="text-xs text-slate-400">Actualizado recientemente</span>
            </div>

            {/* Hito 1: Completado */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">1. Preinscripción y Aceptación de Términos</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Completado
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Formulario digital completado exitosamente con manifestación de compromiso arancelario y reglamento general.
                </p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Validación DNI OK
                  </span>
                </div>
              </div>
            </div>

            {/* Hito 2: Acreditado */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">2. Reserva de Vacante y Pago de Arancel</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Acreditado
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Monto abonado: <strong>$100.000 ARS</strong> · Comprobante acreditado por Tesorería de Extensión Universitaria.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Operación #982341239
                  </span>
                  <Link 
                    href="/aspirante/postulacion/pago" 
                    className="text-xs font-bold text-[#005a9c] hover:underline flex items-center gap-1"
                  >
                    Ver Recibo
                  </Link>
                </div>
              </div>
            </div>

            {/* Hito 3: En Revisión */}
            <div className="bg-white rounded-xl border-2 border-blue-300 p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#005a9c] flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">3. Validación Digital de Legajo</h3>
                  <span className="text-xs font-bold text-[#005a9c] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    En Revisión
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  La Secretaría de Asuntos Estudiantiles se encuentra verificando la autenticidad y nitidez de los documentos remitidos digitalmente.
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span>DNI Frente y Dorso</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                    <span>Título Secundario</span>
                    <span className="text-[10px] font-bold text-amber-700">En cotejo en Libro Matriz</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hito 4: Bloqueado */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs flex items-start gap-4 opacity-75">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 text-sm">4. Asignación de Comisión y Aula</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                    Bloqueado
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Se habilitará automáticamente una vez concluida la auditoría del legajo documental. Podrás elegir o confirmar tu franja horaria preferida según disponibilidad de cupo (Turno Tarde: 14:00 a 18:00 hs / Turno Noche: 18:30 a 22:30 hs).
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Acciones y Orientación */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm mb-2">Operaciones del Trámite</h4>
              <button className="w-full py-2.5 px-3 rounded-lg bg-[#005a9c] hover:bg-[#00487d] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                <Download className="w-4 h-4" /> Descargar Certificado (PDF)
              </button>
              <Link
                href="/aspirante/postulacion/documentacion"
                className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <FileEdit className="w-4 h-4" /> Modificar Documentación
              </Link>
            </div>

            {/* Charla de Ingreso */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#005a9c]" /> Charla de Ingreso
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Instancia obligatoria de orientación previa al inicio regular del primer cuatrimestre lectivo 2026.
              </p>
              <dl className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Fecha y Horario:</dt>
                  <dd className="font-bold text-slate-800">03 Feb 2026 - 10:00 hs</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Módulos:</dt>
                  <dd className="font-bold text-slate-800">Introducción a la Facultad</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Modalidad:</dt>
                  <dd className="font-bold text-slate-800">Presencial (Sala Magna)</dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Director de Carrera</span>
                  <span className="font-bold text-slate-800">Lic. Sebastián Andrés de Jesús</span>
                </div>
              </div>
            </div>

            {/* Canales de Orientación */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-xs space-y-3">
              <h4 className="font-bold text-slate-900 mb-1">Canales de Orientación</h4>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#005a9c] transition"
              >
                <span className="font-semibold flex items-center">
                  <Megaphone className="w-4 h-4 mr-1.5 text-blue-600" /> Canal de Avisos Telegram
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="mailto:alumnos.tup@frh.utn.edu.ar"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#005a9c] transition"
              >
                <span className="font-semibold flex items-center">
                  <Mail className="w-4 h-4 mr-1.5 text-blue-600" /> Bedelía de TUP
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}