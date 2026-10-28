// src/apps/web/components/layout/footer-institucional.tsx
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function FooterInstitucional() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#003d51] text-slate-100 border-t border-[#002f3e]">
      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Columna 1: Logo Oficial e Identidad */}
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
            <p className="text-xs text-slate-200/90 leading-relaxed pt-1 max-w-xs">
              Sistema de admisión y gestión de inscripciones para carreras de grado y tecnicaturas.
            </p>
          </div>

          {/* Columna 2: Fila con los 3 logos (Mail, Instagram, Facebook) */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 border-b border-[#005a75] pb-1 inline-block">
              Redes y Canales
            </h4>
            <div className="flex items-center gap-3 pt-1">
              {/* Logo Mail */}
              <a
                href="mailto:info@frh.utn.edu.ar"
                aria-label="Enviar correo"
                className="text-slate-200 hover:text-cyan-300 transition-colors p-2 rounded-md hover:bg-[#002f3e]"
                title="Correo institucional"
              >
                <Mail className="w-4 h-4" />
              </a>

              {/* Logo Instagram */}
              <a
                href="https://www.instagram.com/utn.frh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram UTN FRH"
                className="text-slate-200 hover:text-cyan-300 transition-colors p-2 rounded-md hover:bg-[#002f3e]"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              {/* Logo Facebook */}
              <a
                href="https://www.facebook.com/utnfrhaedo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook UTN FRH"
                className="text-slate-200 hover:text-cyan-300 transition-colors p-2 rounded-md hover:bg-[#002f3e]"
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columna 3: Sede Central con el mail debajo del teléfono */}
          <div className="md:justify-self-end">
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
                <a
                  href="mailto:info@frh.utn.edu.ar"
                  className="hover:text-cyan-300 transition-colors"
                >
                  info@frh.utn.edu.ar
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Barra Inferior Centrada */}
      <div className="bg-[#002f3e] border-t border-[#002430] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] text-slate-300">
            © {anioActual} Universidad Tecnológica Nacional · Facultad Regional Haedo
          </p>
        </div>
      </div>
    </footer>
  );
}