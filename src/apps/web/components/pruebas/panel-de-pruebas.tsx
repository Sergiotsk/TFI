'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import {
  ESTADOS_DE_POSTULACION,
  ROLES_DEL_PERSONAL,
  TIPOS_DE_DOCUMENTO,
} from '@tfi/domain'
import type { Rol } from '@tfi/domain'
import { Button } from '@/components/ui/button'
import { CLASE_CAMPO, CLASE_ETIQUETA } from '@/components/auth/clases'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'

const ROLES: Rol[] = ['ASPIRANTE', 'SECRETARIA', 'DIRECCION', 'TESORERIA']

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

interface PeriodoEnEdicion extends NuevoPeriodo {
  id: string
}

const NUEVO_PERIODO_INICIAL: NuevoPeriodo = {
  nombre: 'Período de prueba',
  totalCupos: '50',
  cierraEl: '',
  diasPlazoPago: '3',
  montoArs: '94000',
}

interface PerfilEnEdicion {
  nombre: string
  apellido: string
  dni: string
  cuil: string
  fechaNacimiento: string
  sexo: '' | 'M' | 'F' | 'O'
  telefono: string
  direccion: string
}

const PERFIL_INICIAL: PerfilEnEdicion = {
  nombre: '',
  apellido: '',
  dni: '',
  cuil: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  direccion: '',
}

interface PerfilDeApi {
  id: string
  nombre: string
  apellido: string
  dni: string
  cuil: string
  fechaNacimiento: string
  sexo: 'M' | 'F' | 'O'
  telefono: string | null
  direccion: string | null
}

export function PanelDePruebas() {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [rolFiltro, setRolFiltro] = useState('')
  const [dniPerfil, setDniPerfil] = useState('')
  const [paginaPerfiles, setPaginaPerfiles] = useState('1')
  const [porPaginaPerfiles, setPorPaginaPerfiles] = useState('20')
  const [perfilId, setPerfilId] = useState('')
  const [perfilEnEdicion, setPerfilEnEdicion] = useState<PerfilEnEdicion>(PERFIL_INICIAL)

  const [periodoId, setPeriodoId] = useState('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [nuevoPeriodo, setNuevoPeriodo] = useState<NuevoPeriodo>(NUEVO_PERIODO_INICIAL)
  const [periodoEnEdicion, setPeriodoEnEdicion] = useState<PeriodoEnEdicion | null>(null)

  const [postulacionId, setPostulacionId] = useState('')
  const [diasDeProrroga, setDiasDeProrroga] = useState('3')
  const [dniPostulante, setDniPostulante] = useState('')
  const [paginaPostulaciones, setPaginaPostulaciones] = useState('1')
  const [porPaginaPostulaciones, setPorPaginaPostulaciones] = useState('20')
  const [documentoId, setDocumentoId] = useState('')
  const [documentoTipo, setDocumentoTipo] = useState('DNI')
  const [documentoVigencia, setDocumentoVigencia] = useState('365')
  const [documentoEstado, setDocumentoEstado] = useState('APROBADO')
  const [documentoObservaciones, setDocumentoObservaciones] = useState('')
  const [archivoDocumento, setArchivoDocumento] = useState<File | null>(null)
  const [filtroEstadoDocumento, setFiltroEstadoDocumento] = useState('')
  const [paginaDocumentos, setPaginaDocumentos] = useState('1')
  const [porPaginaDocumentos, setPorPaginaDocumentos] = useState('20')
  const [filtroAspiranteId, setFiltroAspiranteId] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [soloPeriodoElegido, setSoloPeriodoElegido] = useState(false)

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
      if (sesionNueva) {
        setPerfilId((actual) => actual || sesionNueva.perfilId)
        await cargarPeriodos()
      } else {
        setPeriodos([])
      }
    } finally {
      setCargandoSesion(false)
    }
  }, [cargarPeriodos])

  useEffect(() => {
    void cargarSesion()
  }, [cargarSesion])

  async function llamar(
    metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    cuerpo?: unknown,
  ) {
    setOcupado(true)
    try {
      const esFormulario = cuerpo instanceof FormData
      const respuesta = await fetch(url, {
        method: metodo,
        headers:
          cuerpo === undefined || esFormulario
            ? undefined
            : { 'Content-Type': 'application/json' },
        body:
          cuerpo === undefined
            ? undefined
            : esFormulario
              ? cuerpo
              : JSON.stringify(cuerpo),
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

      // Atajos para encadenar las pruebas sin copiar ids a mano.
      if (respuesta.ok && metodo === 'POST' && url === '/api/postulaciones') {
        const id = idDe(json)
        if (id) setPostulacionId(id)
      }
      if (
        respuesta.ok &&
        metodo === 'GET' &&
        url.startsWith('/api/postulaciones/por-dni')
      ) {
        const id = primerIdDe(json)
        if (id) setPostulacionId(id)
      }
      if (respuesta.ok && metodo === 'POST' && url === '/api/documentos') {
        const id = idDe(json)
        if (id) setDocumentoId(id)
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
      if (respuesta.ok && metodo === 'PATCH' && url.startsWith('/api/periodos/')) {
        await cargarPeriodos()
        setPeriodoEnEdicion(null)
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
      setPeriodos([])
      setPeriodoEnEdicion(null)
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

  async function modificarPeriodo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!periodoEnEdicion || periodoEnEdicion.cierraEl === '') return

    await llamar('PATCH', `/api/periodos/${periodoEnEdicion.id}`, {
      nombre: periodoEnEdicion.nombre.trim(),
      totalCupos: Number(periodoEnEdicion.totalCupos),
      diasPlazoPago: Number(periodoEnEdicion.diasPlazoPago),
      montoMatriculaCentavos: Math.round(Number(periodoEnEdicion.montoArs) * 100),
      cierraEl: new Date(periodoEnEdicion.cierraEl).toISOString(),
    })
  }

  function editarNuevoPeriodo(campo: keyof NuevoPeriodo, valor: string) {
    setNuevoPeriodo((actual) => ({ ...actual, [campo]: valor }))
  }

  function editarPeriodoEnEdicion(campo: keyof NuevoPeriodo, valor: string) {
    setPeriodoEnEdicion((actual) => (actual ? { ...actual, [campo]: valor } : actual))
  }

  function empezarEdicion(periodo: Periodo) {
    setPeriodoId(periodo.id)
    setPeriodoEnEdicion({
      id: periodo.id,
      nombre: periodo.nombre,
      totalCupos: String(periodo.totalCupos),
      cierraEl: aDatetimeLocal(periodo.cierraEl),
      diasPlazoPago: String(periodo.diasPlazoPago),
      montoArs: String(periodo.montoMatriculaCentavos / 100),
    })
  }

  function urlDeListado(): string {
    const parametros = new URLSearchParams()
    if (filtroAspiranteId.trim() !== '') {
      parametros.set('aspiranteId', filtroAspiranteId.trim())
    }
    if (filtroEstado !== '') parametros.set('estado', filtroEstado)
    if (soloPeriodoElegido && periodoId.trim() !== '') {
      parametros.set('periodoId', periodoId.trim())
    }
    if (paginaPostulaciones.trim() !== '') parametros.set('pagina', paginaPostulaciones.trim())
    if (porPaginaPostulaciones.trim() !== '') {
      parametros.set('porPagina', porPaginaPostulaciones.trim())
    }

    const consulta = parametros.toString()

    return consulta === '' ? '/api/postulaciones' : `/api/postulaciones?${consulta}`
  }

  function urlDePerfiles(): string {
    const parametros = new URLSearchParams()
    if (rolFiltro !== '') parametros.set('rol', rolFiltro)
    if (dniPerfil.trim() !== '') parametros.set('dni', dniPerfil.trim())
    if (paginaPerfiles.trim() !== '') parametros.set('pagina', paginaPerfiles.trim())
    if (porPaginaPerfiles.trim() !== '') parametros.set('porPagina', porPaginaPerfiles.trim())

    const consulta = parametros.toString()

    return consulta === '' ? '/api/perfiles' : `/api/perfiles?${consulta}`
  }

  function urlDeDocumentos(): string {
    const parametros = new URLSearchParams()
    if (postulacionId.trim() !== '') parametros.set('postulacionId', postulacionId.trim())
    if (filtroEstadoDocumento !== '') parametros.set('estado', filtroEstadoDocumento)
    if (paginaDocumentos.trim() !== '') parametros.set('pagina', paginaDocumentos.trim())
    if (porPaginaDocumentos.trim() !== '') parametros.set('porPagina', porPaginaDocumentos.trim())

    const consulta = parametros.toString()

    return consulta === '' ? '/api/documentos' : `/api/documentos?${consulta}`
  }

  async function subirDocumento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!archivoDocumento || postulacionId.trim() === '') return

    const formulario = new FormData()
    formulario.set('postulacionId', postulacionId.trim())
    formulario.set('tipo', documentoTipo)
    formulario.set('vigencia', documentoVigencia.trim() || '365')
    formulario.set('archivo', archivoDocumento)

    await llamar('POST', '/api/documentos', formulario)
  }

  function editarPerfil<K extends keyof PerfilEnEdicion>(
    campo: K,
    valor: PerfilEnEdicion[K],
  ) {
    setPerfilEnEdicion((actual) => ({ ...actual, [campo]: valor }))
  }

  function cambiarSexo(valor: string) {
    if (valor === '' || valor === 'M' || valor === 'F' || valor === 'O') {
      editarPerfil('sexo', valor)
    }
  }

  function cuerpoDePerfil(incluirDni = true): Record<string, unknown> | null {
    const cuerpo: Record<string, unknown> = {}

    if (perfilEnEdicion.nombre.trim() !== '') cuerpo.nombre = perfilEnEdicion.nombre.trim()
    if (perfilEnEdicion.apellido.trim() !== '') cuerpo.apellido = perfilEnEdicion.apellido.trim()
    if (incluirDni && perfilEnEdicion.dni.trim() !== '') {
      cuerpo.dni = perfilEnEdicion.dni.trim()
    }
    if (perfilEnEdicion.cuil.trim() !== '') cuerpo.cuil = perfilEnEdicion.cuil.trim()
    if (perfilEnEdicion.fechaNacimiento !== '') {
      cuerpo.fechaNacimiento = perfilEnEdicion.fechaNacimiento
    }
    if (perfilEnEdicion.sexo !== '') cuerpo.sexo = perfilEnEdicion.sexo
    if (perfilEnEdicion.telefono.trim() !== '') cuerpo.telefono = perfilEnEdicion.telefono.trim()
    if (perfilEnEdicion.direccion.trim() !== '') {
      cuerpo.direccion = perfilEnEdicion.direccion.trim()
    }

    return Object.keys(cuerpo).length === 0 ? null : cuerpo
  }

  async function cargarPerfilParaEditar() {
    setOcupado(true)
    try {
      const respuesta = await fetch(`/api/perfiles/${perfilId.trim()}`, { cache: 'no-store' })
      const cuerpo: unknown = await interpretarJson(await respuesta.text())

      if (!respuesta.ok) {
        setMensaje(mensajeDeError(cuerpo) ?? 'No se pudo cargar el perfil')
        return
      }

      volcarPerfil(datosDe(cuerpo))
    } finally {
      setOcupado(false)
    }
  }

  async function cargarMiPerfilParaEditar() {
    setOcupado(true)
    try {
      const respuesta = await fetch('/api/perfiles/mio', { cache: 'no-store' })
      const cuerpo: unknown = await interpretarJson(await respuesta.text())

      if (!respuesta.ok) {
        setMensaje(mensajeDeError(cuerpo) ?? 'No se pudo cargar el perfil')
        return
      }

      volcarPerfil(datosDe(cuerpo))
    } finally {
      setOcupado(false)
    }
  }

  function volcarPerfil(datos: unknown) {
    if (!esPerfil(datos)) {
      setMensaje('La respuesta del perfil no tiene el formato esperado')
      return
    }

    setPerfilId(datos.id)
    setPerfilEnEdicion({
      nombre: datos.nombre,
      apellido: datos.apellido,
      dni: datos.dni,
      cuil: datos.cuil,
      fechaNacimiento: datos.fechaNacimiento.slice(0, 10),
      sexo: datos.sexo,
      telefono: datos.telefono ?? '',
      direccion: datos.direccion ?? '',
    })
    setMensaje(null)
  }

  const sinSesion = sesion === null
  const deshabilitado = sinSesion || ocupado
  const puedeGestionarPeriodos = sesion?.rol === 'DIRECCION'

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
            Un apartado por recurso. Cada botón muestra la respuesta cruda y los permisos de cada
            rol.
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
                  ? 'Como aspirante podés crear tu Postulación, ver las tuyas e iniciar el pago. Perfiles y documentos te responden 403.'
                  : 'Como personal podés ver cualquier Postulación, listar todas y filtrarlas por perfil, período o estado. Crear Postulación e iniciar pago responden 403.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => void llamar('GET', '/api/auth/yo')}
                >
                  GET /api/auth/yo
                </Button>
                <Button
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => void llamar('GET', '/api/health')}
                >
                  GET /api/health
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

        <details className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <summary className="cursor-pointer text-base font-semibold text-foreground">
            Permisos por rol (para chequear los 403)
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            La autorización se decide en los casos de uso y RLS es la segunda barrera. Probá con
            cada cuenta y fijate el status de la respuesta.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-1 pr-4 font-medium">Endpoint</th>
                  <th className="py-1 font-medium">Quién</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <FilaPermiso endpoint="GET /api/health" quien="Público" />
                <FilaPermiso endpoint="POST /api/auth/registro" quien="Público (crea ASPIRANTE)" />
                <FilaPermiso endpoint="POST /api/auth/inicio-de-sesion" quien="Público" />
                <FilaPermiso endpoint="GET /api/auth/yo" quien="Autenticado" />
                <FilaPermiso endpoint="GET /api/perfiles" quien={rolesDe(ROLES_DEL_PERSONAL)} />
                <FilaPermiso endpoint="GET /api/perfiles/:id" quien="El propio o personal" />
                <FilaPermiso endpoint="GET /api/perfiles/mio" quien="Autenticado" />
                <FilaPermiso endpoint="PATCH /api/perfiles/mio" quien="Autenticado (propio)" />
                <FilaPermiso
                  endpoint="PATCH /api/perfiles/:id"
                  quien={rolesDe(ROLES_DEL_PERSONAL)}
                />
                <FilaPermiso endpoint="GET /api/periodos" quien="Autenticado" />
                <FilaPermiso endpoint="GET /api/periodos/todos" quien={rolesDe(ROLES_DEL_PERSONAL)} />
                <FilaPermiso endpoint="GET /api/periodos/:id" quien="Autenticado" />
                <FilaPermiso
                  endpoint="GET /api/periodos/:id/ocupacion"
                  quien={rolesDe(ROLES_DEL_PERSONAL)}
                />
                <FilaPermiso endpoint="POST /api/periodos" quien="Director" />
                <FilaPermiso endpoint="PATCH /api/periodos/:id" quien="Director" />
                <FilaPermiso endpoint="GET /api/postulaciones" quien={rolesDe(ROLES_DEL_PERSONAL)} />
                <FilaPermiso
                  endpoint="GET /api/postulaciones/por-dni"
                  quien={rolesDe(ROLES_DEL_PERSONAL)}
                />
                <FilaPermiso endpoint="POST /api/postulaciones" quien="Aspirante" />
                <FilaPermiso endpoint="GET /api/postulaciones/mias" quien="Aspirante" />
                <FilaPermiso endpoint="GET /api/postulaciones/:id" quien="El propio o personal" />
                <FilaPermiso
                  endpoint="POST /api/postulaciones/:id/iniciar-pago"
                  quien="Aspirante dueño"
                />
                <FilaPermiso
                  endpoint="POST /api/postulaciones/:id/acreditar-pago"
                  quien={rolesDe(ROLES_DEL_PERSONAL)}
                />
                <FilaPermiso
                  endpoint="POST /api/postulaciones/:id/prorrogar-plazo"
                  quien={rolesDe(ROLES_DEL_PERSONAL)}
                />
                <FilaPermiso
                  endpoint="GET /api/documentos"
                  quien="Aspirante dueño (con postulacionId) o Secretaría/Dirección"
                />
                <FilaPermiso
                  endpoint="POST /api/documentos"
                  quien="Aspirante dueño o Secretaría/Dirección"
                />
                <FilaPermiso
                  endpoint="GET /api/documentos/:id"
                  quien="Aspirante dueño o Secretaría/Dirección"
                />
                <FilaPermiso
                  endpoint="PATCH|DELETE /api/documentos/:id"
                  quien="Aspirante dueño (DELETE) o Secretaría/Dirección"
                />
              </tbody>
            </table>
          </div>
        </details>

        <Tarjeta
          titulo="Perfiles"
          descripcion={
            <>
              <code>GET /api/perfiles</code> lista (solo personal, con filtros opcionales por rol y DNI
              y paginación); <code>GET /api/perfiles/:id</code> devuelve uno (el propio o personal).{' '}
              <code>PATCH /api/perfiles/:id</code> lo puede hacer el personal;{' '}
              <code>PATCH /api/perfiles/mio</code> deja que cualquier persona corrija sus propios
              datos. En ambos casos no cambia DNI, rol, email ni institución. No hay alta ni baja: el
              perfil lo crea el trigger de registro.
            </>
          }
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-52">
              <label htmlFor="perfiles-rol" className={CLASE_ETIQUETA}>
                Filtrar por rol
              </label>
              <select
                id="perfiles-rol"
                value={rolFiltro}
                onChange={(evento) => setRolFiltro(evento.target.value)}
                className={CLASE_CAMPO}
              >
                <option value="">Todos</option>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {ETIQUETAS_DE_ROL[rol]}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-52">
              <label htmlFor="perfiles-dni" className={CLASE_ETIQUETA}>
                Buscar por DNI
              </label>
              <input
                id="perfiles-dni"
                inputMode="numeric"
                placeholder="Ej. 30123456"
                value={dniPerfil}
                onChange={(evento) => setDniPerfil(evento.target.value)}
                className={CLASE_CAMPO}
              />
            </div>
            <div className="w-24">
              <label htmlFor="perfiles-pagina" className={CLASE_ETIQUETA}>
                Página
              </label>
              <input
                id="perfiles-pagina"
                type="number"
                min="1"
                value={paginaPerfiles}
                onChange={(evento) => setPaginaPerfiles(evento.target.value)}
                className={CLASE_CAMPO}
              />
            </div>
            <div className="w-24">
              <label htmlFor="perfiles-por-pagina" className={CLASE_ETIQUETA}>
                Por página
              </label>
              <input
                id="perfiles-por-pagina"
                type="number"
                min="1"
                max="100"
                value={porPaginaPerfiles}
                onChange={(evento) => setPorPaginaPerfiles(evento.target.value)}
                className={CLASE_CAMPO}
              />
            </div>
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', urlDePerfiles())}
            >
              GET /api/perfiles
            </Button>
          </div>

          <div className="mt-4">
            <label htmlFor="perfil-id" className={CLASE_ETIQUETA}>
              Perfil por id
            </label>
            <input
              id="perfil-id"
              placeholder="perfilId (UUID)"
              value={perfilId}
              onChange={(evento) => setPerfilId(evento.target.value)}
              className={CLASE_CAMPO}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={deshabilitado || perfilId.trim() === ''}
                onClick={() => void llamar('GET', `/api/perfiles/${perfilId.trim()}`)}
              >
                GET /api/perfiles/:id
              </Button>
              {sesion ? (
                <Button
                  variant="ghost"
                  disabled={ocupado}
                  onClick={() => {
                    setPerfilId(sesion.perfilId)
                    void llamar('GET', `/api/perfiles/${sesion.perfilId}`)
                  }}
                >
                  Mi perfil
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Mi perfil (cualquier rol)</p>
            <p className="text-sm text-muted-foreground">
              <code>GET /api/perfiles/mio</code> devuelve el perfil de la sesión y{' '}
              <code>PATCH /api/perfiles/mio</code> permite corregir nombre, apellido, CUIL,
              nacimiento, sexo, teléfono y dirección. El DNI no se puede cambiar.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={deshabilitado}
                onClick={() => void llamar('GET', '/api/perfiles/mio')}
              >
                GET /api/perfiles/mio
              </Button>
              <Button
                variant="outline"
                disabled={deshabilitado || sesion === null}
                onClick={() => {
                  const cuerpo = cuerpoDePerfil(false)
                  if (!cuerpo) {
                    setMensaje('Completá al menos un campo para actualizar tu perfil')
                    return
                  }
                  void llamar('PATCH', '/api/perfiles/mio', cuerpo)
                }}
              >
                PATCH /api/perfiles/mio
              </Button>
              <Button
                variant="ghost"
                disabled={ocupado || sesion === null}
                onClick={() => void cargarMiPerfilParaEditar()}
              >
                Cargar mis datos
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Editar perfil (solo personal)</p>
            <p className="text-sm text-muted-foreground">
              Corrige los datos personales del perfil elegido arriba. No cambia rol, email,
              institución ni verificación.
            </p>
            <Button
              className="mt-2"
              variant="outline"
              disabled={deshabilitado || perfilId.trim() === ''}
              onClick={() => void cargarPerfilParaEditar()}
            >
              Cargar datos
            </Button>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="perfil-nombre" className={CLASE_ETIQUETA}>
                  Nombre
                </label>
                <input
                  id="perfil-nombre"
                  value={perfilEnEdicion.nombre}
                  onChange={(evento) => editarPerfil('nombre', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-apellido" className={CLASE_ETIQUETA}>
                  Apellido
                </label>
                <input
                  id="perfil-apellido"
                  value={perfilEnEdicion.apellido}
                  onChange={(evento) => editarPerfil('apellido', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-dni" className={CLASE_ETIQUETA}>
                  DNI
                </label>
                <input
                  id="perfil-dni"
                  inputMode="numeric"
                  value={perfilEnEdicion.dni}
                  onChange={(evento) => editarPerfil('dni', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-cuil" className={CLASE_ETIQUETA}>
                  CUIL
                </label>
                <input
                  id="perfil-cuil"
                  inputMode="numeric"
                  value={perfilEnEdicion.cuil}
                  onChange={(evento) => editarPerfil('cuil', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-nacimiento" className={CLASE_ETIQUETA}>
                  Fecha de nacimiento
                </label>
                <input
                  id="perfil-nacimiento"
                  type="date"
                  value={perfilEnEdicion.fechaNacimiento}
                  onChange={(evento) => editarPerfil('fechaNacimiento', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-sexo" className={CLASE_ETIQUETA}>
                  Sexo
                </label>
                <select
                  id="perfil-sexo"
                  value={perfilEnEdicion.sexo}
                  onChange={(evento) => cambiarSexo(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  <option value="">Sin cambios</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label htmlFor="perfil-telefono" className={CLASE_ETIQUETA}>
                  Teléfono
                </label>
                <input
                  id="perfil-telefono"
                  value={perfilEnEdicion.telefono}
                  onChange={(evento) => editarPerfil('telefono', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="perfil-direccion" className={CLASE_ETIQUETA}>
                  Dirección
                </label>
                <input
                  id="perfil-direccion"
                  value={perfilEnEdicion.direccion}
                  onChange={(evento) => editarPerfil('direccion', evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
            </div>

            <Button
              className="mt-3"
              disabled={deshabilitado || perfilId.trim() === ''}
              onClick={() => {
                const cuerpo = cuerpoDePerfil()
                if (!cuerpo) {
                  setMensaje('Completá al menos un campo para actualizar el perfil')
                  return
                }
                void llamar('PATCH', `/api/perfiles/${perfilId.trim()}`, cuerpo)
              }}
            >
              PATCH /api/perfiles/:id
            </Button>
          </div>
        </Tarjeta>

        <Tarjeta
          titulo="Períodos"
          descripcion={
            <>
              <code>GET /api/periodos</code> lo ve cualquier usuario autenticado (solo los abiertos);{' '}
              <code>GET /api/periodos/todos</code>, <code>GET /api/periodos/:id</code> y{' '}
              <code>GET /api/periodos/:id/ocupacion</code> completan la consulta del personal.{' '}
              <code>POST</code> y <code>PATCH</code> son solo del Director. Secretaría y Tesorería
              solo consultan. No hay DELETE: el período se cierra cambiando la fecha.
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', '/api/periodos')}
            >
              GET /api/periodos
            </Button>
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', '/api/periodos/todos')}
            >
              GET /api/periodos/todos
            </Button>
            <Button
              variant="outline"
              disabled={deshabilitado || periodoId.trim() === ''}
              onClick={() => void llamar('GET', `/api/periodos/${periodoId.trim()}`)}
            >
              GET /api/periodos/:id
            </Button>
            <Button
              variant="outline"
              disabled={deshabilitado || periodoId.trim() === ''}
              onClick={() => void llamar('GET', `/api/periodos/${periodoId.trim()}/ocupacion`)}
            >
              GET /api/periodos/:id/ocupacion
            </Button>
          </div>

          <div className="mt-4">
            <label htmlFor="periodo-id" className={CLASE_ETIQUETA}>
              Período elegido (se completa al tocar “Usar”)
            </label>
            <input
              id="periodo-id"
              placeholder="periodoId (UUID)"
              value={periodoId}
              onChange={(evento) => setPeriodoId(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </div>

          {sinSesion ? null : periodos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay períodos abiertos.{' '}
              {puedeGestionarPeriodos
                ? 'Creá uno acá abajo.'
                : 'Pedile al Director que cree uno para poder postularte.'}
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ocupado || periodoId === periodo.id}
                      onClick={() => setPeriodoId(periodo.id)}
                    >
                      {periodoId === periodo.id ? 'Elegido' : 'Usar'}
                    </Button>
                    {puedeGestionarPeriodos ? (
                      <Button variant="ghost" size="sm" onClick={() => empezarEdicion(periodo)}>
                        Editar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {puedeGestionarPeriodos ? (
            <form onSubmit={crearPeriodo} className="mt-5 space-y-3 border-t border-border pt-5">
              <p className="text-sm font-medium text-foreground">
                Crear período (solo Director)
              </p>

              <CamposDePeriodo
                idPrefijo="nuevo"
                valores={nuevoPeriodo}
                alCambiar={editarNuevoPeriodo}
              />

              <p className="text-xs text-muted-foreground">
                El nombre no se puede repetir dentro de la institución.
              </p>

              <Button type="submit" disabled={deshabilitado || nuevoPeriodo.cierraEl === ''}>
                POST /api/periodos
              </Button>
            </form>
          ) : null}

          {puedeGestionarPeriodos && periodoEnEdicion ? (
            <form
              onSubmit={modificarPeriodo}
              className="mt-5 space-y-3 border-t border-border pt-5"
            >
              <p className="text-sm font-medium text-foreground">
                Modificar período{' '}
                <span className="break-all font-mono text-xs">{periodoEnEdicion.id}</span>
              </p>

              <CamposDePeriodo
                idPrefijo="editar"
                valores={periodoEnEdicion}
                alCambiar={editarPeriodoEnEdicion}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={deshabilitado || periodoEnEdicion.cierraEl === ''}>
                  PATCH /api/periodos/:id
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={ocupado}
                  onClick={() => setPeriodoEnEdicion(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}
        </Tarjeta>

        <Tarjeta
          titulo="Postulaciones"
          descripcion={
            <>
              Crear, listar las propias e iniciar el pago son de <strong>Aspirante</strong>. El
              personal (Secretaría, Dirección y Tesorería) puede listar todas y filtrar por perfil,
              período o estado, con paginación, y buscar el historial completo de una persona por DNI
              con <code>GET /api/postulaciones/por-dni</code>. Ver una por id lo puede hacer el dueño o
              cualquier rol del personal. Las acciones manuales del personal son explícitas: acreditar
              un pago o prorrogar el plazo. No hay PATCH ni DELETE de estados: el estado lo mueve la
              máquina de estados.
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', '/api/postulaciones/mias')}
            >
              GET /api/postulaciones/mias
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Listar todas (solo personal)</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="filtro-aspirante" className={CLASE_ETIQUETA}>
                  Perfil del aspirante (opcional)
                </label>
                <input
                  id="filtro-aspirante"
                  placeholder="aspiranteId (UUID)"
                  value={filtroAspiranteId}
                  onChange={(evento) => setFiltroAspiranteId(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor="filtro-estado" className={CLASE_ETIQUETA}>
                  Estado (opcional)
                </label>
                <select
                  id="filtro-estado"
                  value={filtroEstado}
                  onChange={(evento) => setFiltroEstado(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todos</option>
                  {ESTADOS_DE_POSTULACION.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={soloPeriodoElegido}
                onChange={(evento) => setSoloPeriodoElegido(evento.target.checked)}
                className="size-4 accent-primary"
              />
              Solo el período elegido
            </label>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="w-24">
                <label htmlFor="postulaciones-pagina" className={CLASE_ETIQUETA}>
                  Página
                </label>
                <input
                  id="postulaciones-pagina"
                  type="number"
                  min="1"
                  value={paginaPostulaciones}
                  onChange={(evento) => setPaginaPostulaciones(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div className="w-24">
                <label htmlFor="postulaciones-por-pagina" className={CLASE_ETIQUETA}>
                  Por página
                </label>
                <input
                  id="postulaciones-por-pagina"
                  type="number"
                  min="1"
                  max="100"
                  value={porPaginaPostulaciones}
                  onChange={(evento) => setPorPaginaPostulaciones(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <Button
                variant="outline"
                disabled={deshabilitado}
                onClick={() => void llamar('GET', urlDeListado())}
              >
                GET /api/postulaciones
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Buscar por DNI (solo personal)</p>
            <p className="text-sm text-muted-foreground">
              Devuelve todas las Postulaciones de la persona, en cualquier estado, sin importar el
              período. Acepta el DNI con o sin puntos.
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <div className="w-52">
                <label htmlFor="postulaciones-dni" className={CLASE_ETIQUETA}>
                  DNI
                </label>
                <input
                  id="postulaciones-dni"
                  inputMode="numeric"
                  placeholder="Ej. 30123456"
                  value={dniPostulante}
                  onChange={(evento) => setDniPostulante(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <Button
                variant="outline"
                disabled={deshabilitado || dniPostulante.trim() === ''}
                onClick={() =>
                  void llamar(
                    'GET',
                    `/api/postulaciones/por-dni?dni=${encodeURIComponent(
                      dniPostulante.trim(),
                    )}&pagina=1&porPagina=20`,
                  )
                }
              >
                GET /api/postulaciones/por-dni
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className={CLASE_ETIQUETA}>Crear Postulación (solo Aspirante)</p>
            <p className="text-sm text-muted-foreground">
              {periodoId.trim() === '' ? (
                'Elegí un período en el apartado anterior.'
              ) : (
                <>
                  Período: <span className="break-all font-mono text-xs">{periodoId.trim()}</span>
                </>
              )}
            </p>
            <Button
              className="mt-2"
              disabled={deshabilitado || periodoId.trim() === ''}
              onClick={() =>
                void llamar('POST', '/api/postulaciones', { periodoId: periodoId.trim() })
              }
            >
              POST /api/postulaciones
            </Button>
          </div>

          <div className="mt-4">
            <label htmlFor="postulacion-id" className={CLASE_ETIQUETA}>
              Postulación por id (se completa al crear o listar)
            </label>
            <input
              id="postulacion-id"
              placeholder="postulacionId (UUID)"
              value={postulacionId}
              onChange={(evento) => setPostulacionId(evento.target.value)}
              className={CLASE_CAMPO}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={deshabilitado || postulacionId.trim() === ''}
                onClick={() => void llamar('GET', `/api/postulaciones/${postulacionId.trim()}`)}
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
              <Button
                disabled={deshabilitado || postulacionId.trim() === ''}
                onClick={async () => {
                  setOcupado(true)
                  setMensaje(null)
                  try {
                    const respuesta = await fetch('/api/pagos/iniciar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ postulacionId: postulacionId.trim() }),
                    })
                    const json: unknown = await interpretarJson(await respuesta.text())

                    secuencia.current += 1
                    setHistorial((previas) => [
                      {
                        id: secuencia.current,
                        hora: new Date().toLocaleTimeString('es-AR'),
                        metodo: 'POST',
                        url: '/api/pagos/iniciar',
                        status: respuesta.status,
                        cuerpo: json,
                      },
                      ...previas,
                    ])

                    const datos = esObjeto(json) ? (json as Record<string, unknown>).data : undefined
                    const initPoint =
                      esObjeto(datos) && typeof (datos as Record<string, unknown>).initPoint === 'string'
                        ? ((datos as Record<string, unknown>).initPoint as string)
                        : esObjeto(datos) && typeof (datos as Record<string, unknown>).init_point === 'string'
                          ? ((datos as Record<string, unknown>).init_point as string)
                          : undefined

                    if (respuesta.ok && initPoint) {
                      window.location.href = initPoint
                      return
                    }

                    setMensaje(mensajeDeError(json) ?? 'No se pudo iniciar el pago con Mercado Pago')
                  } finally {
                    setOcupado(false)
                  }
                }}
              >
                Pagar con Mercado Pago
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Acciones manuales del personal</p>
            <p className="text-sm text-muted-foreground">
              Secretaría, Tesorería y Dirección. Acreditar confirma la vacante y controla el cupo;
              prorrogar extiende el plazo o reactiva una VENCIDO (nunca pasa el cierre del período).
            </p>
            <Button
              className="mt-2"
              disabled={deshabilitado || postulacionId.trim() === ''}
              onClick={() =>
                void llamar(
                  'POST',
                  `/api/postulaciones/${postulacionId.trim()}/acreditar-pago`,
                )
              }
            >
              POST /:id/acreditar-pago
            </Button>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="w-32">
                <label htmlFor="dias-prorroga" className={CLASE_ETIQUETA}>
                  Días
                </label>
                <input
                  id="dias-prorroga"
                  type="number"
                  min="1"
                  max="365"
                  value={diasDeProrroga}
                  onChange={(evento) => setDiasDeProrroga(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <Button
                disabled={
                  deshabilitado || postulacionId.trim() === '' || diasDeProrroga.trim() === ''
                }
                onClick={() =>
                  void llamar(
                    'POST',
                    `/api/postulaciones/${postulacionId.trim()}/prorrogar-plazo`,
                    { dias: Number(diasDeProrroga) },
                  )
                }
              >
                POST /:id/prorrogar-plazo
              </Button>
            </div>
          </div>
        </Tarjeta>

        <Tarjeta
          titulo="Documentos"
          descripcion={
            <>
              El aspirante sube, consulta y borra los documentos de su Postulación; Secretaría y
              Dirección pueden ver, revisar, corregir y borrar los de cualquier postulante de su
              institución. Tesorería no participa. Los archivos van a un bucket privado y{' '}
              <code>GET /api/documentos/:id</code> devuelve una URL firmada de cinco minutos. La
              Postulación avanza sola: al subir el primero pasa a{' '}
              <code>ESPERANDO_DOCUMENTACION</code>, al revisar a{' '}
              <code>DOCUMENTACION_EN_REVISION</code>, <code>OBSERVADO</code> o{' '}
              <code>DOCUMENTACION_VALIDADA</code>.
            </>
          }
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-40">
              <label htmlFor="documentos-estado" className={CLASE_ETIQUETA}>
                Estado
              </label>
              <select
                id="documentos-estado"
                value={filtroEstadoDocumento}
                onChange={(evento) => setFiltroEstadoDocumento(evento.target.value)}
                className={CLASE_CAMPO}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="APROBADO">APROBADO</option>
                <option value="OBSERVADO">OBSERVADO</option>
              </select>
            </div>
            <div className="w-24">
              <label htmlFor="documentos-pagina" className={CLASE_ETIQUETA}>
                Página
              </label>
              <input
                id="documentos-pagina"
                type="number"
                min="1"
                value={paginaDocumentos}
                onChange={(evento) => setPaginaDocumentos(evento.target.value)}
                className={CLASE_CAMPO}
              />
            </div>
            <div className="w-24">
              <label htmlFor="documentos-por-pagina" className={CLASE_ETIQUETA}>
                Por página
              </label>
              <input
                id="documentos-por-pagina"
                type="number"
                min="1"
                max="100"
                value={porPaginaDocumentos}
                onChange={(evento) => setPorPaginaDocumentos(evento.target.value)}
                className={CLASE_CAMPO}
              />
            </div>
            <Button
              variant="outline"
              disabled={deshabilitado}
              onClick={() => void llamar('GET', urlDeDocumentos())}
            >
              GET /api/documentos
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            El filtro por Postulación usa el id del apartado de arriba. Un aspirante tiene que
            indicarlo; Secretaría y Dirección pueden listar toda la institución.
          </p>

          <form onSubmit={subirDocumento} className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Subir documento</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="documento-tipo" className={CLASE_ETIQUETA}>
                  Tipo
                </label>
                <select
                  id="documento-tipo"
                  value={documentoTipo}
                  onChange={(evento) => setDocumentoTipo(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  {TIPOS_DE_DOCUMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="documento-vigencia" className={CLASE_ETIQUETA}>
                  Vigencia en días (0 = sin vencimiento)
                </label>
                <input
                  id="documento-vigencia"
                  type="number"
                  min="0"
                  max="3650"
                  value={documentoVigencia}
                  onChange={(evento) => setDocumentoVigencia(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="documento-archivo" className={CLASE_ETIQUETA}>
                  Archivo (PDF, JPG o PNG, máximo 10 MB)
                </label>
                <input
                  id="documento-archivo"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(evento) => setArchivoDocumento(evento.target.files?.[0] ?? null)}
                  className={CLASE_CAMPO}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="mt-3"
              disabled={
                deshabilitado ||
                postulacionId.trim() === '' ||
                archivoDocumento === null
              }
            >
              POST /api/documentos
            </Button>
            {postulacionId.trim() === '' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Elegí o creá una Postulación para habilitar la subida.
              </p>
            ) : null}
          </form>

          <div className="mt-4 border-t border-border pt-4">
            <label htmlFor="documento-id" className={CLASE_ETIQUETA}>
              Documento por id (copiá el id de la respuesta de la lista)
            </label>
            <input
              id="documento-id"
              placeholder="documentoId (UUID)"
              value={documentoId}
              onChange={(evento) => setDocumentoId(evento.target.value)}
              className={CLASE_CAMPO}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={deshabilitado || documentoId.trim() === ''}
                onClick={() => void llamar('GET', `/api/documentos/${documentoId.trim()}`)}
              >
                GET /api/documentos/:id
              </Button>
              <Button
                variant="ghost"
                disabled={deshabilitado || documentoId.trim() === ''}
                onClick={() => void llamar('DELETE', `/api/documentos/${documentoId.trim()}`)}
              >
                DELETE /api/documentos/:id
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className={CLASE_ETIQUETA}>Revisar documento (solo Secretaría/Dirección)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="documento-revision-estado" className={CLASE_ETIQUETA}>
                  Nuevo estado
                </label>
                <select
                  id="documento-revision-estado"
                  value={documentoEstado}
                  onChange={(evento) => setDocumentoEstado(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="APROBADO">APROBADO</option>
                  <option value="OBSERVADO">OBSERVADO</option>
                </select>
              </div>
              <div>
                <label htmlFor="documento-observaciones" className={CLASE_ETIQUETA}>
                  Motivo (obligatorio al observar)
                </label>
                <input
                  id="documento-observaciones"
                  value={documentoObservaciones}
                  onChange={(evento) => setDocumentoObservaciones(evento.target.value)}
                  className={CLASE_CAMPO}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={deshabilitado || documentoId.trim() === ''}
                onClick={() =>
                  void llamar('PATCH', `/api/documentos/${documentoId.trim()}`, {
                    estado: documentoEstado,
                    ...(documentoObservaciones.trim() === ''
                      ? {}
                      : { observaciones: documentoObservaciones.trim() }),
                  })
                }
              >
                PATCH /api/documentos/:id (revisión)
              </Button>
              <Button
                variant="ghost"
                disabled={deshabilitado || documentoId.trim() === ''}
                onClick={() =>
                  void llamar('PATCH', `/api/documentos/${documentoId.trim()}`, {
                    tipo: documentoTipo,
                    vigencia: Number(documentoVigencia),
                  })
                }
              >
                PATCH /api/documentos/:id (metadatos)
              </Button>
            </div>
          </div>
        </Tarjeta>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Respuestas</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Todavía no llamaste a ningún endpoint.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setHistorial([])}>
                  Limpiar
                </Button>
              </div>
              {historial.map((llamada) => (
                <article
                  key={llamada.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
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
              <p className="font-medium text-foreground">1. Una cuenta de Director</p>
              <p className="mt-1">
                El registro siempre crea <code>ASPIRANTE</code>. Para poder dar de alta períodos,
                promové una cuenta a <code>DIRECCION</code> desde el SQL Editor de Supabase y volvé a
                entrar:
              </p>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">{`update public.perfiles
set rol = 'DIRECCION'
where email = 'tu@email.com';`}</pre>
            </div>

            <div>
              <p className="font-medium text-foreground">2. Creá el período</p>
              <p className="mt-1">
                Con la cuenta <code>DIRECCION</code> aparece la gestión en el apartado de Períodos:
                es el único rol que puede crear y modificar. Secretaría y Tesorería solo los ven.
                Al crearlo queda abierto y lo ve cualquier usuario de la institución.
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
                <code>GET /api/postulaciones</code> devuelve todas y podés filtrar por{' '}
                <code>aspiranteId</code>, período o estado, y paginar (el id del perfil sale del
                apartado de Perfiles). También podés buscar el historial completo de una persona por
                DNI. <code>GET /api/postulaciones/:id</code> de otro aspirante responde 200. Crear e
                iniciar pago responden 403. En Perfiles podés listar, filtrar por rol o DNI y corregir
                datos personales con <code>PATCH</code>; en Documentos, revisar los archivos. Con{' '}
                <code>SECRETARIA</code> o <code>TESORERIA</code> los períodos son de solo lectura; con{' '}
                <code>DIRECCION</code> podés crearlos y modificarlos. <code>/periodos/todos</code>,{' '}
                <code>/periodos/:id</code> y <code>/periodos/:id/ocupacion</code> completan la
                consulta.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">5. Ayudar a un postulante</p>
              <p className="mt-1">
                Con cualquier rol del personal, en Postulaciones tenés dos acciones sobre el id
                elegido: <code>acreditar-pago</code> confirma la vacante de una{' '}
                <code>PAGO_PENDIENTE</code> o <code>VENCIDO</code> (si no hay cupo responde 409) y{' '}
                <code>prorrogar-plazo</code> extiende el vencimiento o reactiva una{' '}
                <code>VENCIDO</code> con los días que indiques. No se puede editar el estado
                libremente: la máquina de estados y el control de cupos lo impiden.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">6. Documentación</p>
              <p className="mt-1">
                Una Postulación recién creada no admite documentos: primero hay que acreditar el pago
                y confirmar la vacante. Desde ahí, el aspirante sube sus archivos con{' '}
                <code>POST /api/documentos</code>. Secretaría o Dirección los revisan con{' '}
                <code>PATCH /api/documentos/:id</code>: observar exige un motivo y deja la
                Postulación en <code>OBSERVADO</code>; aprobar el último documento la deja en{' '}
                <code>DOCUMENTACION_VALIDADA</code>. Tesorería recibe 403 en todo el circuito.
              </p>
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}

function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
      <div className="mt-1 text-sm text-muted-foreground">{descripcion}</div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function FilaPermiso({ endpoint, quien }: { endpoint: string; quien: string }) {
  return (
    <tr>
      <td className="py-1 pr-4 font-mono text-xs text-foreground">{endpoint}</td>
      <td className="py-1">{quien}</td>
    </tr>
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

function CamposDePeriodo({
  idPrefijo,
  valores,
  alCambiar,
}: {
  idPrefijo: string
  valores: NuevoPeriodo
  alCambiar: (campo: keyof NuevoPeriodo, valor: string) => void
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefijo}-nombre`} className={CLASE_ETIQUETA}>
          Nombre
        </label>
        <input
          id={`${idPrefijo}-nombre`}
          value={valores.nombre}
          onChange={(evento) => alCambiar('nombre', evento.target.value)}
          className={CLASE_CAMPO}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idPrefijo}-cupos`} className={CLASE_ETIQUETA}>
            Total de cupos
          </label>
          <input
            id={`${idPrefijo}-cupos`}
            type="number"
            min={0}
            value={valores.totalCupos}
            onChange={(evento) => alCambiar('totalCupos', evento.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefijo}-plazo`} className={CLASE_ETIQUETA}>
            Días de plazo
          </label>
          <input
            id={`${idPrefijo}-plazo`}
            type="number"
            min={1}
            value={valores.diasPlazoPago}
            onChange={(evento) => alCambiar('diasPlazoPago', evento.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefijo}-monto`} className={CLASE_ETIQUETA}>
            Matrícula (ARS)
          </label>
          <input
            id={`${idPrefijo}-monto`}
            type="number"
            min={1}
            value={valores.montoArs}
            onChange={(evento) => alCambiar('montoArs', evento.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefijo}-cierre`} className={CLASE_ETIQUETA}>
          Cierra el
        </label>
        <input
          id={`${idPrefijo}-cierre`}
          type="datetime-local"
          value={valores.cierraEl}
          onChange={(evento) => alCambiar('cierraEl', evento.target.value)}
          className={CLASE_CAMPO}
        />
      </div>
    </>
  )
}

function rolesDe(roles: readonly Rol[]): string {
  return roles.map((rol) => ETIQUETAS_DE_ROL[rol]).join(' o ')
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

function esPerfil(valor: unknown): valor is PerfilDeApi {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    typeof valor.apellido === 'string' &&
    typeof valor.dni === 'string' &&
    typeof valor.cuil === 'string' &&
    typeof valor.fechaNacimiento === 'string' &&
    (valor.sexo === 'M' || valor.sexo === 'F' || valor.sexo === 'O') &&
    (valor.telefono === null || typeof valor.telefono === 'string') &&
    (valor.direccion === null || typeof valor.direccion === 'string')
  )
}

function datosDe(cuerpo: unknown): unknown {
  return esObjeto(cuerpo) ? cuerpo.data : undefined
}

function periodosDe(cuerpo: unknown): Periodo[] {
  const datos = datosDe(cuerpo)

  return Array.isArray(datos) ? datos.filter(esPeriodo) : []
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

function aDatetimeLocal(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''

  const dosDigitos = (numero: number) => String(numero).padStart(2, '0')

  return [
    fecha.getFullYear(),
    '-',
    dosDigitos(fecha.getMonth() + 1),
    '-',
    dosDigitos(fecha.getDate()),
    'T',
    dosDigitos(fecha.getHours()),
    ':',
    dosDigitos(fecha.getMinutes()),
  ].join('')
}
