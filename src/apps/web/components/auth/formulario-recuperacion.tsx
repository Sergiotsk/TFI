'use client'

import { useActionState } from 'react'
import {
  solicitarRecuperacion,
  type EstadoDeRecuperacion,
} from '@/app/recuperar-contrasena/actions'
import {
  CLASE_BOTON,
  CLASE_CAMPO,
  CLASE_CAMPO_INVALIDO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from './clases'

const ESTADO_INICIAL: EstadoDeRecuperacion = {}

export function FormularioRecuperacion() {
  const [estado, enviar, pending] = useActionState(solicitarRecuperacion, ESTADO_INICIAL)
  const errores = estado.errores ?? {}

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.mensaje ? (
        <p
          role={estado.tono === 'ok' ? 'status' : 'alert'}
          className={
            estado.tono === 'ok'
              ? 'rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground'
              : 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {estado.mensaje}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className={CLASE_ETIQUETA}>
          Email de la cuenta
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

      <button type="submit" disabled={pending} className={CLASE_BOTON}>
        {pending ? 'Enviando…' : 'Enviarme el enlace'}
      </button>
    </form>
  )
}
