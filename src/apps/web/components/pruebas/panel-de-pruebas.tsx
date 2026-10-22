'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import type { Rol } from '@tfi/domain'
import { Button } from '@/components/ui/button'
import { CLASE_CAMPO, CLASE_ETIQUETA } from '@/components/auth/clases'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'

interface Sesion {
  perfilId: string
  rol: Rol
  institucionId: string
}

interface Llamada {
  id: number
  hora: string
  metodo: string
  url: string
  status: number
  cuerpo: unknown
}

export function PanelDePruebas() {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [postulacionId, setPostulacionId] = useState('')
  const [historial, setHistorial] = useState<Llamada[]>([])
  const [ocupado, setOcupado] = useState(false)
  const secuencia = useRef(0)

  const cargarSesion = useCallback(async () => {
    try {
      const respuesta = await fetch('/api/auth/yo', { cache: 'no-store' })
      if (respuesta.status === 401) {
        setSesion(null)
        return
      }
      const cuerpo: unknown = await interpretarJson(await respuesta.text())
      const datos = datosDe(cuerpo)
      setSesion(esSesion(datos) ? datos : null)
    } finally {
      setCargandoSesion(false)
    }
  }, [])

  useEffect(() => {
    void cargarSesion()
  }, [cargarSesion])

  async function llamar(metodo: 'GET' | 'POST', url: string, cuerpo?: unknown) {
    setOcupado(true)
    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      })
      const json: unknown = await interpretarJson(await respuesta.text())

      secuencia.current += 1
      setHistorial((previas) => [
        {
          id: secuencia.current,
          hora: new Date().toLocaleTimeString('es-AR'),
          metodo,
          url,
          status: respuesta.status,
          cuerpo: json,
        },
        ...previas,
      ])

      // Ayuda: completar el id con la Postulación recién creada o la primera propia.
      if (respuesta.ok && metodo === 'POST' && url === '/api/postulaciones') {
        const id = idDe(json)
        if (id) setPostulacionId(id)
      }
      if (respuesta.ok && metodo === 'GET' && url === '/api/postulaciones/mias') {
        const id = primerIdDe(json)
        if (id) setPostulacionId((actual) => actual || id)
      }
    } finally {
      setOcupado(false)
    }
  }

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensaje(null)
    setOcupado(true)
    try {
      const respuesta = await fetch('/api/auth/inicio-de-sesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contrasena }),
      })
      const cuerpo: unknown = await interpretarJson(await respuesta.text())
      if (!respuesta.ok) {
        setMensaje(mensajeDeError(cuerpo) ?? 'No se pudo iniciar sesión')
        return
      }
      setContrasena('')
      setCargandoSesion(true)
      await cargarSesion()
    } finally {
      setOcupado(false)
    }
  }

  async function salir() {
    setOcupado(true)
    try {
      await fetch('/api/auth/cierre-de-sesion', { method: 'POST' })
      setSesion(null)
    } finally {
      setOcupado(false)
    }
  }

  const sinSesion = sesion === null
  const deshabilitado = sinSesion || ocupado

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {INSTITUCION.nombre} · Pruebas
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Laboratorio de endpoints
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para probar la API a mano, sin la UI definitiva. Cada botón muestra la respuesta cruda.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              href="/panel"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Ir al panel
            </Link>
            <span aria-hidden> · </span>
            <Link
              href="/"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Inicio
            </Link>
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Sesión</h2>

          {cargandoSesion ? (
            <p className="mt-3 text-sm text-muted-foreground">Cargando sesión…</p>
          ) : sesion ? (
            <div className="mt-3 space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Dato etiqueta="Rol" valor={ETIQUETAS_DE_ROL[sesion.rol]} />
                <Dato etiqueta="Perfil" valor={sesion.perfilId} />
                <Dato etiqueta="Institución" valor={sesion.institucionId} />
              </dl>
              <p className="text-sm text-muted-foreground">
                {sesion.rol === 'ASPIRANTE'
                  ? 'Como aspirante podés crear tu Postulación, ver las tuyas e iniciar el pago.'
                  : 'Como personal podés ver cualquier Postulación por id. Crear e iniciar pago responden 403.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => void llamar('GET', '/api/auth/yo')}
                >
                  GET /api/auth/yo
                </Button>
                <Button variant="ghost" disabled={ocupado} onClick={() => void salir()}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={ingresar} className="mt-3 space-y-4">
              <div>
                <label htmlFor="email" className={CLASE_ETIQUETA}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="contrasena" className={CLASE_ETIQUETA}>
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              {mensaje ? (
                <p role="alert" className="text-sm text-destructive">
                  {mensaje}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={ocupado}>
                  {ocupado ? 'Entrando…' : 'Iniciar sesión'}
                </Button>
                <Link
                  href="/registro"
                  className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                >
                  Registrarme
                </Link>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Postulaciones</h2>
          {sinSesion ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Iniciá sesión para habilitar los botones.
            </p>
          ) : null}

          <div className="mt-4 space-y-5">
            <div>
              <Button
                variant="outline"
                disabled={deshabilitado}
                onClick={() => void llamar('GET', '/api/postulaciones/mias')}
              >
                GET /api/postulaciones/mias
              </Button>
            </div>

            <div>
              <label htmlFor="periodo" className={CLASE_ETIQUETA}>
                Crear Postulación (solo ASPIRANTE)
              </label>
              <input
                id="periodo"
                placeholder="periodoId (UUID del período abierto)"
                value={periodoId}
                onChange={(evento) => setPeriodoId(evento.target.value)}
                className={CLASE_CAMPO}
              />
              <Button
                className="mt-2"
                disabled={deshabilitado || periodoId.trim() === ''}
                onClick={() => void llamar('POST', '/api/postulaciones', { periodoId: periodoId.trim() })}
              >
                POST /api/postulaciones
              </Button>
            </div>

            <div>
              <label htmlFor="postulacion" className={CLASE_ETIQUETA}>
                Postulación (se completa sola al crear o listar)
              </label>
              <input
                id="postulacion"
                placeholder="postulacionId (UUID)"
                value={postulacionId}
                onChange={(evento) => setPostulacionId(evento.target.value)}
                className={CLASE_CAMPO}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={deshabilitado || postulacionId.trim() === ''}
                  onClick={() =>
                    void llamar('GET', `/api/postulaciones/${postulacionId.trim()}`)
                  }
                >
                  GET /api/postulaciones/:id
                </Button>
                <Button
                  disabled={deshabilitado || postulacionId.trim() === ''}
                  onClick={() =>
                    void llamar('POST', `/api/postulaciones/${postulacionId.trim()}/iniciar-pago`)
                  }
                >
                  POST /:id/iniciar-pago
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Respuestas</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no llamaste a ningún endpoint.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setHistorial([])}>
                  Limpiar
                </Button>
              </div>
              {historial.map((llamada) => (
                <article key={llamada.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-foreground">
                      {llamada.metodo} {llamada.url}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      {llamada.hora}
                      <span
                        className={`rounded px-1.5 py-0.5 font-semibold ${
                          llamada.status < 400
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {llamada.status}
                      </span>
                    </p>
                  </div>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                    {typeof llamada.cuerpo === 'string'
                      ? llamada.cuerpo
                      : JSON.stringify(llamada.cuerpo, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </section>

        <details className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <summary className="cursor-pointer text-base font-semibold text-foreground">
            Cómo probar como aspirante y como admin
          </summary>

          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">1. Un período abierto</p>
              <p className="mt-1">
                Crear una Postulación necesita el id de un período. Si no hay ninguno, creá uno
                desde el SQL Editor de Supabase (o usá el del seed local) y copiá el id acá arriba:
              </p>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">{`select id, nombre, cierra_el
from public.periodos_de_ingreso
order by cierra_el desc;`}</pre>
            </div>

            <div>
              <p className="font-medium text-foreground">2. Como aspirante</p>
              <p className="mt-1">
                Registrate en <code>/registro</code>, iniciá sesión acá y usá los botones de
                Postulaciones. El rol <code>ASPIRANTE</code> es el que asigna el trigger de registro.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">3. Como admin (secretaría, dirección o tesorería)</p>
              <p className="mt-1">
                El rol vive en el perfil, no en la sesión: cambialo desde el SQL Editor y volvé a
                entrar. Después probá <code>GET /api/postulaciones/:id</code> con el id de la
                Postulación de un aspirante: responde 200. Crear e iniciar pago responden 403.
              </p>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">{`update public.perfiles
set rol = 'SECRETARIA'
where email = 'tu@email.com';`}</pre>
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="mt-1 break-all text-sm text-foreground">{valor}</dd>
    </div>
  )
}

async function interpretarJson(texto: string): Promise<unknown> {
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return texto
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(ETIQUETAS_DE_ROL, valor)
}

function esSesion(valor: unknown): valor is Sesion {
  return (
    esObjeto(valor) &&
    typeof valor.perfilId === 'string' &&
    esRol(valor.rol) &&
    typeof valor.institucionId === 'string'
  )
}

function datosDe(cuerpo: unknown): unknown {
  return esObjeto(cuerpo) ? cuerpo.data : undefined
}

function idDe(cuerpo: unknown): string | null {
  const datos = datosDe(cuerpo)
  return esObjeto(datos) && typeof datos.id === 'string' ? datos.id : null
}

function primerIdDe(cuerpo: unknown): string | null {
  const datos = datosDe(cuerpo)
  if (!Array.isArray(datos) || datos.length === 0) return null

  const primero: unknown = datos[0]

  return esObjeto(primero) && typeof primero.id === 'string' ? primero.id : null
}

function mensajeDeError(cuerpo: unknown): string | null {
  if (!esObjeto(cuerpo)) return null
  const error = cuerpo.error
  if (!esObjeto(error) || typeof error.mensaje !== 'string') return null

  return error.mensaje
}
