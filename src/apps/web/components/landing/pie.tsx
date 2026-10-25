import Link from 'next/link'
import { NAVEGACION, PROYECTO_NOMBRE, SEDE_DIRECCION, SISTEMA_URL } from '@/lib/landing/datos'

export function Pie() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="site-footer__nombre">{PROYECTO_NOMBRE}</p>
          <p className="site-footer__texto">
            Trabajo Final Integrador del Equipo 5. Tecnicatura Universitaria en Programación, UTN
            Facultad Regional Haedo.
          </p>
          <p className="site-footer__texto">{SEDE_DIRECCION}</p>
        </div>
        <ul className="site-footer__enlaces">
          {NAVEGACION.map(({ ruta, texto }) => (
            <li key={ruta}>
              <Link href={ruta}>{texto}</Link>
            </li>
          ))}
          <li>
            <a href={SISTEMA_URL}>Sistema de inscripción</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
