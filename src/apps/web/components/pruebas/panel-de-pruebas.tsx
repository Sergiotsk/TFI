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

interface Periodo {
  id: string
  nombre: string
  totalCupos: number
  cierraEl: string
  diasPlazoPago: number
  montoMatriculaCentavos: number
}

interface NuevoPeriodo {
  nombre: string
  totalCupos: string
  cierraEl: string
  diasPlazoPago: string
  montoArs: string
}

const NUEVO_PERIODO_INICIAL: NuevoPeriodo = {
  nombre: 'Período de prueba',
  totalCupos: '50',
  cierraEl: '',
  diasPlazoPago: '3',
  montoArs: '94000',
}

export function PanelDePruebas() {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [nuevoPeriodo, setNuevoPeriodo] = useState<NuevoPeriodo>(NUEVO_PERIODO_INICIAL)
  const [postulacionId, setPostulacionId] = useState('')
  const [historial, setHistorial] = useState<Llamada[]>([])
  const [ocupado, setOcupado] = useState(false)
  const secuencia = useRef(0)

  const cargarPeriodos = useCallback(async () => {
    const respuesta = await fetch('/api/periodos', { cache: 'no-store' })
    if (!respuesta.ok) {
      setPeriodos([])
      return
    }
    const cuerpo: unknown = await interpretarJson(await respuesta.text())
    setPeriodos(periodosDe(cuerpo))
  }, [])

  const cargarSesion = useCallback(async () => {
    try {
      const respuesta = await fetch('/api/auth/yo', { cache: 'no-store' })
      if (respuesta.status === 401) {
        setSesion(null)
        setPeriodos([])
        return
      }
      const cuerpo: unknown = await interpretarJson(await respuesta.text())
      const datos = datosDe(cuerpo)
      const sesionNueva = esSesion(datos) ? datos : null
      setSesion(sesionNueva)
      if (sesionNueva) await cargarPeriodos()
      else setPeriodos([])
    } finally {
      setCargandoSesion(false)
    }
  }, [cargarPeriodos])

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
      if (respuesta.ok && metodo === 'GET' && url === '/api/periodos') {
        setPeriodos(periodosDe(json))
      }
      if (respuesta.ok && metodo === 'POST' && url === '/api/periodos') {
        const id = idDe(json)
        if (id) setPeriodoId(id)
        await cargarPeriodos()
      }
    } finally {
      setOcupado(false)
    }
  }

  async function crearPeriodo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (nuevoPeriodo.cierraEl === '') return

    await llamar('POST', '/api/periodos', {
      nombre: nuevoPeriodo.nombre.trim(),
      totalCupos: Number(nuevoPeriodo.totalCupos),
      diasPlazoPago: Number(nuevoPeriodo.diasPlazoPago),
      montoMatriculaCentavos: Math.round(Number(nuevoPeriodo.montoArs) * 100),
      cierraEl: new Date(nuevoPeriodo.cierraEl).toISOString(),
    })
  }

  function editarNuevoPeriodo(campo: keyof NuevoPeriodo, valor: string) {
    setNuevoPeriodo((actual) => ({ ...actual, [campo]: valor }))
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
      setPeriodos([])
    } finally {
      setOcupado(false)
    }
  }

  const sinSesion = sesion === null
  const deshabilitado = sinSesion || ocupado
  const puedeCrearPeriodos = sesion?.rol === 'SECRETARIA' || sesion?.rol === 'DIRECCION'

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
          <h2 className="text-base font-semibold text-foreground">Períodos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cualquier usuario autenticado ve los períodos abiertos de su institución. Los crea
            Secretaría o Dirección.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', '/api/periodos')}
            >
              GET /api/periodos
            </Button>
          </div>

          <div className="mt-4">
            <label htmlFor="periodo" className={CLASE_ETIQUETA}>
              Período elegido (se completa al tocar “Usar”)
            </label>
            <input
              id="periodo"
              placeholder="periodoId (UUID)"
              value={periodoId}
              onChange={(evento) => setPeriodoId(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </div>

          {sinSesion ? null : periodos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay períodos abiertos.{' '}
              {puedeCrearPeriodos
                ? 'Creá uno acá abajo.'
                : 'Pedile a Secretaría que cree uno para poder postularte.'}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {periodos.map((periodo) => (
                <li
                  key={periodo.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{periodo.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      cierra {fechaCorta(periodo.cierraEl)} · {periodo.totalCupos} cupos · plazo{' '}
                      {periodo.diasPlazoPago} días · matrícula{' '}
                      {formatearPesos(periodo.montoMatriculaCentavos)}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {periodo.id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ocupado || periodoId === periodo.id}
                    onClick={() => setPeriodoId(periodo.id)}
                  >
                    {periodoId === periodo.id ? 'Elegido' : 'Usar'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {puedeCrearPeriodos ? (
            <form
              onSubmit={crearPeriodo}
              className="mt-5 space-y-3 border-t border-border pt-5"
            >
              <p className="text-sm font-medium text-foreground">
                Crear período (SECRETARIA / DIRECCION)
              </p>

              <div>
                <label htmlFor="periodo-nombre" className={CLASE_ETIQUETA}>
                  Nombre
                </label>
                <input
                  id="periodo-nombre"
                  value={nuevoPeriodo.nombre}
                  onChange={(evento) => editarNuevoPeriodo('nombre', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="periodo-cupos" className={CLASE_ETIQUETA}>
                    Total de cupos
                  </label>
                  <input
                    id="periodo-cupos"
                    type="number"
                    min={0}
                    value={nuevoPeriodo.totalCupos}
                    onChange={(evento) => editarNuevoPeriodo('totalCupos', evento.target.value)}
                    className={CLASE_CAMPO}
                  />
                </div>
                <div>
                  <label htmlFor="periodo-plazo" className={CLASE_ETIQUETA}>
                    Días de plazo
                  </label>
                  <input
                    id="periodo-plazo"
                    type="number"
                    min={1}
                    value={nuevoPeriodo.diasPlazoPago}
                    onChange={(evento) => editarNuevoPeriodo('diasPlazoPago', evento.target.value)}
                    className={CLASE_CAMPO}
                  />
                </div>
                <div>
                  <label htmlFor="periodo-monto" className={CLASE_ETIQUETA}>
                    Matrícula (ARS)
                  </label>
                  <input
                    id="periodo-monto"
                    type="number"
                    min={1}
                    value={nuevoPeriodo.montoArs}
                    onChange={(evento) => editarNuevoPeriodo('montoArs', evento.target.value)}
                    className={CLASE_CAMPO}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="periodo-cierre" className={CLASE_ETIQUETA}>
                  Cierra el
                </label>
                <input
                  id="periodo-cierre"
                  type="datetime-local"
                  value={nuevoPeriodo.cierraEl}
                  onChange={(evento) => editarNuevoPeriodo('cierraEl', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                El nombre no se puede repetir dentro de la institución.
              </p>

              <Button
                type="submit"
                disabled={deshabilitado || nuevoPeriodo.cierraEl === ''}
              >
                POST /api/periodos
              </Button>
            </form>
          ) : null}
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
              <p className={CLASE_ETIQUETA}>Crear Postulación (solo ASPIRANTE)</p>
              <p className="text-sm text-muted-foreground">
                {periodoId.trim() === '' ? (
                  'Elegí un período en la tarjeta de arriba.'
                ) : (
                  <>
                    Período:{' '}
                    <span className="break-all font-mono text-xs">{periodoId.trim()}</span>
                  </>
                )}
              </p>
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
              <p className="font-medium text-foreground">1. Una cuenta de Secretaría</p>
              <p className="mt-1">
                El registro siempre crea <code>ASPIRANTE</code>. Para poder dar de alta períodos,
                promové una cuenta desde el SQL Editor de Supabase y volvé a entrar:
              </p>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">{`update public.perfiles
set rol = 'SECRETARIA'
where email = 'tu@email.com';`}</pre>
            </div>

            <div>
              <p className="font-medium text-foreground">2. Creá el período</p>
              <p className="mt-1">
                Con la cuenta <code>SECRETARIA</code> (o <code>DIRECCION</code>) aparece el alta en la
                tarjeta de Períodos. Al crearlo queda abierto y lo ve cualquier usuario de la
                institución.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">3. Como aspirante</p>
              <p className="mt-1">
                Entrá con una cuenta <code>ASPIRANTE</code>, elegí el período con “Usar” y probá{' '}
                <code>POST /api/postulaciones</code>, <code>GET /api/postulaciones/mias</code>,{' '}
                <code>GET /api/postulaciones/:id</code> y{' '}
                <code>POST /api/postulaciones/:id/iniciar-pago</code>.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">4. Como admin</p>
              <p className="mt-1">
                Con <code>SECRETARIA</code>, <code>DIRECCION</code> o <code>TESORERIA</code>,{' '}
                <code>GET /api/postulaciones/:id</code> de otro aspirante responde 200. Crear e
                iniciar pago responden 403.
              </p>
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

function esPeriodo(valor: unknown): valor is Periodo {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    typeof valor.totalCupos === 'number' &&
    typeof valor.cierraEl === 'string' &&
    typeof valor.diasPlazoPago === 'number' &&
    typeof valor.montoMatriculaCentavos === 'number'
  )
}

function periodosDe(cuerpo: unknown): Periodo[] {
  const datos = datosDe(cuerpo)

  return Array.isArray(datos) ? datos.filter(esPeriodo) : []
}

function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso

  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatearPesos(centavos: number): string {
  return (centavos / 100).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })
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
