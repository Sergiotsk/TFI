'use client'

import { useActionState } from 'react'
import {
  cambiarContrasena,
  type EstadoDeCambioDeContrasena,
} from '@/app/recuperar-contrasena/nueva/actions'
import {
  CLASE_BOTON,
  CLASE_CAMPO,
  CLASE_CAMPO_INVALIDO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from './clases'

const ESTADO_INICIAL: EstadoDeCambioDeContrasena = {}

export function FormularioNuevaContrasena() {
  const [estado, enviar, pending] = useActionState(cambiarContrasena, ESTADO_INICIAL)
  const errores = estado.errores ?? {}

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.mensaje ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <div>
        <label htmlFor="contrasena" className={CLASE_ETIQUETA}>
          Contraseña nueva
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errores.contrasena ? 'true' : undefined}
          className={`${CLASE_CAMPO} ${errores.contrasena ? CLASE_CAMPO_INVALIDO : ''}`}
        />
        {errores.contrasena ? <p className={CLASE_ERROR}>{errores.contrasena}</p> : null}
      </div>

      <div>
        <label htmlFor="confirmacion" className={CLASE_ETIQUETA}>
          Repetí la contraseña nueva
        </label>
        <input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errores.confirmacion ? 'true' : undefined}
          className={`${CLASE_CAMPO} ${errores.confirmacion ? CLASE_CAMPO_INVALIDO : ''}`}
        />
        {errores.confirmacion ? <p className={CLASE_ERROR}>{errores.confirmacion}</p> : null}
      </div>

      <button type="submit" disabled={pending} className={CLASE_BOTON}>
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
