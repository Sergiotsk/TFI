'use client'

import { useActionState } from 'react'
import { iniciarSesion, type EstadoDeFormulario } from '@/app/login/actions'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CAMPO_INVALIDO, CLASE_ERROR, CLASE_ETIQUETA } from './clases'

const ESTADO_INICIAL: EstadoDeFormulario = {}

export function FormularioLogin({ destino }: { destino: string }) {
  const [estado, enviar, pending] = useActionState(iniciarSesion, ESTADO_INICIAL)
  const errores = estado.errores ?? {}

  return (
    <form action={enviar} className="space-y-4" noValidate>
      <input type="hidden" name="redirect" value={destino} />

      {estado.mensaje ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className={CLASE_ETIQUETA}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={errores.email ? 'true' : undefined}
          className={`${CLASE_CAMPO} ${errores.email ? CLASE_CAMPO_INVALIDO : ''}`}
        />
        {errores.email ? <p className={CLASE_ERROR}>{errores.email}</p> : null}
      </div>

      <div>
        <label htmlFor="contrasena" className={CLASE_ETIQUETA}>
          Contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errores.contrasena ? 'true' : undefined}
          className={`${CLASE_CAMPO} ${errores.contrasena ? CLASE_CAMPO_INVALIDO : ''}`}
        />
        {errores.contrasena ? <p className={CLASE_ERROR}>{errores.contrasena}</p> : null}
      </div>

      <button type="submit" disabled={pending} className={CLASE_BOTON}>
        {pending ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
