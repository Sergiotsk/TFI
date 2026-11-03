// src/apps/web/components/layout/footer-institucional.tsx
import Link from "next/link";
import { MapPin, Phone, Mail, MessageSquare } from "lucide-react";
import Image from "next/image";
export function FooterInstitucional() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#003d51] text-slate-100 border-t border-[#002f3e]">
      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Columna 1: Identidad Institucional con Logo Oficial */}
            <div className="space-y-3">
              <Link href="/" className="inline-block">
                <Image
                  src="/UTNLogo_footer.svg" 
                  alt="UTN Facultad Regional Haedo"
                  width={160}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <p className="text-xs text-slate-200/90 leading-relaxed pt-1">
                Sistema de admisión y gestión de inscripciones para carreras de grado y tecnicaturas.
              </p>
            </div>

          {/* Columna 2: Navegación y Landing */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 border-b border-[#005a75] pb-1 inline-block">
              Institucional
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              <li>
                <Link
                  href="/"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/#contacto"
                  className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
                  Formulario de Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/registro"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Registro de Aspirantes
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Ingreso al Sistema
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto y Sede */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 border-b border-[#005a75] pb-1 inline-block">
              Sede Central
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-300 mt-0.5 shrink-0" />
                <span>París 532, Haedo (B1706), Buenos Aires</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span>(011) 4659-6552 / (011) 4443-5246</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <Link
                  href="/#contacto"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Enviar consulta
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Barra Inferior */}
      <div className="bg-[#002f3e] border-t border-[#002430] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-300 gap-2">
          <span>
            © {anioActual} Universidad Tecnológica Nacional · Facultad Regional Haedo
          </span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Sobre nosotros
            </Link>
            <span>•</span>
            <Link href="/#contacto" className="hover:text-white transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}