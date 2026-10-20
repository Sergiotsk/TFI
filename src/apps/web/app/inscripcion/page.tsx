// src/apps/web/app/inscripcion/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ClipboardCheck, 
  Mail, 
  IdCard, 
  MapPin, 
  Lock, 
  ArrowRight, 
  Info,
  PhoneCall
} from 'lucide-react'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { CargaDatosSchema, type CargaDatosInput } from '@/http/schemas/carga-datos.schema'

export default function InscripcionPage() {
  const router = useRouter()
  const [errores, setErrores] = useState<Partial<Record<keyof CargaDatosInput, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    genero: '',
    telefono: '',
    direccion: '',
    aceptaTerminosFacturacion: false,
    aceptaReglamento: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errores[name as keyof CargaDatosInput]) {
      setErrores((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validacion = CargaDatosSchema.safeParse(formData)

    if (!validacion.success) {
      const fieldErrors: Partial<Record<keyof CargaDatosInput, string>> = {}
      validacion.error.issues.forEach((err) => {
        const campo = err.path[0] as keyof CargaDatosInput
        fieldErrors[campo] = err.message
      })
      setErrores(fieldErrors)
      setIsSubmitting(false)
      return
    }
    try {
      // ID provisorio hasta conectar con el caso de uso del backend
      const idPostulacionFalsa = 'postulacion-temp-123'
      router.push(`/postulacion/${idPostulacionFalsa}/requisitos`)
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
      <HeaderInstitucional />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            <ClipboardCheck className="h-4 w-4" /> PASO PREVIO · IDENTIFICACIÓN
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Requisito administrativo obligatorio
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-md sm:p-10">
          <div className="mb-6 border-b border-border pb-6">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Carga de datos
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Ingresá tus datos personales y fiscales básicos para iniciar el expediente del trámite,
              emitir la factura correspondiente a la reserva de vacante y darte acceso a las siguientes etapas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Nombre/s *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Como figura en tu DNI</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Lucas Martín"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground transition outline-none placeholder:text-muted-foreground ${
                    errores.nombre ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                  }`}
                />
                {errores.nombre && <p className="mt-1 text-xs text-destructive">{errores.nombre}</p>}
              </div>

              <div>
                <label htmlFor="apellido" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Apellido/s *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Completos</span>
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Ej: Rossi"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground transition outline-none placeholder:text-muted-foreground ${
                    errores.apellido ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                  }`}
                />
                {errores.apellido && <p className="mt-1 text-xs text-destructive">{errores.apellido}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                <span>Correo electrónico *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Aquí recibirás comprobantes y notificaciones</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className={`w-full rounded-xl border py-3 pr-4 pl-10 text-sm text-foreground transition outline-none placeholder:text-muted-foreground ${
                    errores.email ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                  }`}
                />
                <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errores.email && <p className="mt-1 text-xs text-destructive">{errores.email}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dni" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                  <span>DNI *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Sin puntos ni espacios</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="Ej: 43829114"
                    maxLength={8}
                    className={`w-full rounded-xl border py-3 pr-4 pl-10 text-sm text-foreground transition outline-none placeholder:text-muted-foreground ${
                      errores.dni ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                    }`}
                  />
                  <IdCard className="absolute top-3.5 left-3.5 h-4 w-4 text-muted-foreground" />
                </div>
                {errores.dni && <p className="mt-1 text-xs text-destructive">{errores.dni}</p>}
              </div>

              <div>
                <label htmlFor="genero" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Género / Sexo Registral *</span>
                </label>
                <select
                  id="genero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground transition outline-none ${
                    errores.genero ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                  }`}
                >
                  <option value="" disabled>Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No binario / Otro">No binario / Otro</option>
                </select>
                {errores.genero && <p className="mt-1 text-xs text-destructive">{errores.genero}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                <span>Teléfono celular *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Con código de área, sin 0 ni 15</span>
              </label>
              <div className={`flex overflow-hidden rounded-xl border shadow-xs transition focus-within:ring-2 focus-within:ring-primary ${
                errores.telefono ? 'border-destructive' : 'border-input'
              }`}>
                <span className="inline-flex select-none items-center border-r border-input bg-muted px-4 text-sm font-bold text-foreground">
                  +54
                </span>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="11 6543-9821"
                  className="w-full bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <span className="mt-1 flex items-center text-[11px] text-muted-foreground">
                <PhoneCall className="mr-1 h-3 w-3 text-emerald-600" /> Se enviarán recordatorios de vencimiento de vacante y avisos académicos.
              </span>
              {errores.telefono && <p className="mt-1 text-xs text-destructive">{errores.telefono}</p>}
            </div>

            <div>
              <label htmlFor="direccion" className="mb-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                <span>Dirección *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Calle, altura, piso/dpto y localidad</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Av. Rivadavia 16240, Haedo"
                  className={`w-full rounded-xl border py-3 pr-4 pl-10 text-sm text-foreground transition outline-none placeholder:text-muted-foreground ${
                    errores.direccion ? 'border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive' : 'border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary'
                  }`}
                />
                <MapPin className="absolute top-3.5 left-3.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errores.direccion && <p className="mt-1 text-xs text-destructive">{errores.direccion}</p>}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5 transition hover:bg-muted/70">
                <input
                  type="checkbox"
                  name="aceptaTerminosFacturacion"
                  checked={formData.aceptaTerminosFacturacion}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs leading-relaxed text-foreground">
                  Declaro bajo juramento que los datos ingresados son fidedignos y autorizo a la{' '}
                  <strong>Universidad Tecnológica Nacional - Facultad Regional Haedo</strong> a emitir la
                  factura legal y generar mi legajo de postulante para la{' '}
                  <strong>Tecnicatura Universitaria en Programación (TUP)</strong>.
                </span>
              </label>
              {errores.aceptaTerminosFacturacion && (
                <p className="text-xs text-destructive">{errores.aceptaTerminosFacturacion}</p>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5 transition hover:bg-muted/70">
                <input
                  type="checkbox"
                  name="aceptaReglamento"
                  checked={formData.aceptaReglamento}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs leading-relaxed text-foreground">
                  Entiendo que al presionar <strong>Siguiente</strong> pasaré a la lectura de los requisitos
                  académicos, condiciones de la seña de reserva de vacante y métodos de pago.
                </span>
              </label>
              {errores.aceptaReglamento && (
                <p className="text-xs text-destructive">{errores.aceptaReglamento}</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-muted-foreground" /> Tus datos fiscales están protegidos (Ley 25.326).
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full min-w-[220px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-70 sm:w-auto"
              >
                <span>{isSubmitting ? 'Iniciando...' : 'Siguiente'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-accent bg-accent/30 p-4 text-xs text-accent-foreground sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Info className="h-5 w-5 text-primary" />
            <span>
              <strong>Facturación Oficial:</strong> UTN Facultad Regional Haedo · CUIT 30-54667232-4 · IVA Exento.
            </span>
          </div>
          <span className="font-medium text-muted-foreground">Arancel de Reserva TUP: $100.000 ARS</span>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}