import Link from 'next/link'
import { Settings, ShieldCheck, User } from 'lucide-react'
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
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-foreground">
                UTN<span className="text-secondary">.FRH</span>
              </span>
              <span className="block text-xs font-bold tracking-widest text-primary">
                HAEDO · TUP
              </span>
            </div>
          </div>
          <div className="mx-2 hidden h-6 w-px bg-border md:block" />
          <div className="hidden text-xs text-muted-foreground md:block">
            <span className="font-semibold text-foreground">Portal de Ingresantes</span> · Cohorte 2026
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