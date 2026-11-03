import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, User } from 'lucide-react'
import { Stepper } from './stepper'

interface HeaderProps {
  pasoActual?: 1 | 2 | 3 | 4
  dniPostulante?: string
}

export function HeaderInstitucional({ pasoActual, dniPostulante }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-20 border-b border-border bg-card shadow-xs">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <Image
              src="/UTNLogo.svg"
              alt="Logo UTN Facultad Regional Haedo"
              width={140}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
          <div className="mx-2 hidden h-6 w-px bg-border md:block" />
          <div className="hidden text-xs text-muted-foreground md:block">
            <span className="font-semibold text-foreground">Portal de Ingresantes</span>
          </div>
        </Link>

        {pasoActual ? (
          <Stepper pasoActual={pasoActual} />
        ) : (
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 rounded-full border border-accent bg-accent/40 px-3 py-1 font-semibold text-primary sm:inline-flex">
              <ShieldCheck className="h-4 w-4" /> Inicio de Trámite
            </span>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {dniPostulante && (
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-medium text-muted-foreground">Postulante</p>
              <p className="text-xs font-semibold text-foreground">DNI {dniPostulante}</p>
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  )
}