'use client'

import { useActionState } from 'react'
import { registrar, type EstadoDeRegistro } from '@/app/registro/actions'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CAMPO_INVALIDO, CLASE_ERROR, CLASE_ETIQUETA } from './clases'

const ESTADO_INICIAL: EstadoDeRegistro = {}

export function FormularioRegistro() {
  const [estado, enviar, pending] = useActionState(registrar, ESTADO_INICIAL)
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="nombre"
          name="nombre"
          etiqueta="Nombre"
          autoComplete="given-name"
          required
          error={errores.nombre}
        />
        <Campo
          id="apellido"
          name="apellido"
          etiqueta="Apellido"
          autoComplete="family-name"
          required
          error={errores.apellido}
        />
      </div>

      <Campo
        id="email"
        name="email"
        etiqueta="Email"
        type="email"
        autoComplete="email"
        required
        error={errores.email}
      />

      <Campo
        id="contrasena"
        name="contrasena"
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        ayuda="Mínimo 8 caracteres."
        error={errores.contrasena}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="dni"
          name="dni"
          etiqueta="DNI"
          inputMode="numeric"
          required
          error={errores.dni}
        />
        <Campo
          id="cuil"
          name="cuil"
          etiqueta="CUIL"
          inputMode="numeric"
          required
          error={errores.cuil}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="fechaNacimiento"
          name="fechaNacimiento"
          etiqueta="Fecha de nacimiento"
          type="date"
          required
          error={errores.fechaNacimiento}
        />

        <div>
          <label htmlFor="sexo" className={CLASE_ETIQUETA}>
            Sexo
          </label>
          <select
            id="sexo"
            name="sexo"
            required
            defaultValue=""
            aria-invalid={errores.sexo ? 'true' : undefined}
            className={`${CLASE_CAMPO} ${errores.sexo ? CLASE_CAMPO_INVALIDO : ''}`}
          >
            <option value="">Seleccioná</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
          {errores.sexo ? <p className={CLASE_ERROR}>{errores.sexo}</p> : null}
        </div>
      </div>

      <Campo
        id="telefono"
        name="telefono"
        etiqueta="Teléfono"
        type="tel"
        autoComplete="tel"
        error={errores.telefono}
      />

      <Campo
        id="direccion"
        name="direccion"
        etiqueta="Domicilio"
        autoComplete="street-address"
        error={errores.direccion}
      />

      <button type="submit" disabled={pending} className={CLASE_BOTON}>
        {pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}

function Campo({
  id,
  name,
  etiqueta,
  error,
  type = 'text',
  autoComplete,
  inputMode,
  required = false,
  ayuda,
}: {
  id: string
  name: string
  etiqueta: string
  error?: string
  type?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  required?: boolean
  ayuda?: string
}) {
  return (
    <div>
      <label htmlFor={id} className={CLASE_ETIQUETA}>
        {etiqueta}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={`${CLASE_CAMPO} ${error ? CLASE_CAMPO_INVALIDO : ''}`}
      />
      {error ? <p className={CLASE_ERROR}>{error}</p> : null}
      {!error && ayuda ? <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}
