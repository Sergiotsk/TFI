'use client'

import { type ChangeEvent, type FormEvent, useState } from 'react'
import { cn } from '@/lib/utils'
import { ASUNTOS } from '@/lib/landing/datos'

type Campo = 'nombre' | 'email' | 'asunto' | 'mensaje'
type Errores = Partial<Record<Campo, string>>

const CAMPOS: readonly Campo[] = ['nombre', 'email', 'asunto', 'mensaje']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITE_MENSAJE = 2000

const VALORES_VACIOS = {
  nombre: '',
  email: '',
  asunto: '',
  mensaje: '',
  sitio_web: '',
}

interface Resultado {
  ok: boolean
  texto: string
}

/** Formulario de contacto: valida en el navegador y envía a POST /api/contacto. */
export function FormularioContacto() {
  const [valores, setValores] = useState(VALORES_VACIOS)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const cambiar =
    (campo: keyof typeof VALORES_VACIOS) =>
    (evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const valor = evento.target.value
      setValores((v) => ({ ...v, [campo]: valor }))
    }

  const validar = (): Errores => {
    const nuevos: Errores = {}
    if (valores.nombre.trim().length < 2) nuevos.nombre = 'Escribí tu nombre.'
    if (!EMAIL.test(valores.email.trim())) nuevos.email = 'Ingresá un email válido.'
    if (valores.asunto === '') nuevos.asunto = 'Elegí un motivo de consulta.'
    if (valores.mensaje.trim().length < 10)
      nuevos.mensaje = 'Contanos un poco más (mínimo 10 caracteres).'
    return nuevos
  }

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setResultado(null)

    const nuevos = validar()
    setErrores(nuevos)
    const primero = CAMPOS.find((campo) => nuevos[campo] !== undefined)
    if (primero !== undefined) {
      document.getElementById(`c-${primero}`)?.focus()
      return
    }

    setEnviando(true)
    try {
      const respuesta = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      })
      const json = (await respuesta.json().catch(() => ({ ok: false }))) as {
        ok: boolean
        mensaje?: string
        errores?: Errores
      }

      if (json.ok) {
        setValores(VALORES_VACIOS)
        setErrores({})
        setResultado({
          ok: true,
          texto: 'Gracias, recibimos tu consulta. Te vamos a responder por email.',
        })
      } else {
        if (json.errores) setErrores(json.errores)
        setResultado({
          ok: false,
          texto: json.mensaje ?? 'No pudimos enviar tu consulta. Probá de nuevo en un rato.',
        })
      }
    } catch {
      setResultado({
        ok: false,
        texto: 'No hay conexión con el servidor. Revisá tu conexión y probá de nuevo.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="c-nombre">Nombre</label>
        <input
          id="c-nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          maxLength={100}
          required
          aria-describedby="err-nombre"
          aria-invalid={errores.nombre !== undefined}
          value={valores.nombre}
          onChange={cambiar('nombre')}
        />
        <p className="campo__error" id="err-nombre" role="alert">
          {errores.nombre}
        </p>
      </div>

      <div className="campo">
        <label htmlFor="c-email">Email</label>
        <input
          id="c-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          aria-describedby="err-email"
          aria-invalid={errores.email !== undefined}
          value={valores.email}
          onChange={cambiar('email')}
        />
        <p className="campo__error" id="err-email" role="alert">
          {errores.email}
        </p>
      </div>

      <div className="campo">
        <label htmlFor="c-asunto">Motivo de la consulta</label>
        <select
          id="c-asunto"
          name="asunto"
          required
          aria-describedby="err-asunto"
          aria-invalid={errores.asunto !== undefined}
          value={valores.asunto}
          onChange={cambiar('asunto')}
        >
          <option value="">Elegí una opción</option>
          {ASUNTOS.map(({ clave, texto }) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
        <p className="campo__error" id="err-asunto" role="alert">
          {errores.asunto}
        </p>
      </div>

      <div className="campo">
        <label htmlFor="c-mensaje">Mensaje</label>
        <textarea
          id="c-mensaje"
          name="mensaje"
          rows={6}
          maxLength={LIMITE_MENSAJE}
          required
          aria-describedby="err-mensaje ayuda-mensaje"
          aria-invalid={errores.mensaje !== undefined}
          value={valores.mensaje}
          onChange={cambiar('mensaje')}
        />
        <p className="campo__ayuda" id="ayuda-mensaje">
          <span id="contador">{valores.mensaje.length}</span> de {LIMITE_MENSAJE} caracteres
        </p>
        <p className="campo__error" id="err-mensaje" role="alert">
          {errores.mensaje}
        </p>
      </div>

      {/* Trampa para bots: las personas no lo ven */}
      <div className="trampa" aria-hidden="true">
        <label htmlFor="c-web">No completar este campo</label>
        <input
          id="c-web"
          name="sitio_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={valores.sitio_web}
          onChange={cambiar('sitio_web')}
        />
      </div>

      <button className="btn btn--primary" type="submit" disabled={enviando}>
        Enviar consulta
      </button>
      <p
        className={cn(
          'form__estado',
          resultado && (resultado.ok ? 'form__estado--ok' : 'form__estado--error'),
        )}
        role="status"
        aria-live="polite"
      >
        {enviando ? 'Enviando…' : resultado?.texto}
      </p>
      <p className="campo__ayuda">Usamos tus datos solo para responder tu consulta.</p>
    </form>
  )
}
