// src/apps/web/app/aspirante/inscripcion/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
      // Sin id en la URL: la Postulación sale de la sesión (una activa por aspirante y período)
      router.push('/aspirante/postulacion/requisitos')
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-foreground">
      {/* Capa de Fondo Fija (Cubre toda la pantalla detrás del contenido) */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none">
        <Image
          src="/fondo-utn.jpg"
          alt="Fachada UTN Haedo"
          fill
          priority
          className="object-cover object-center opacity-90"
        />
        {/* Overlay tenue para mantener la nitidez y los colores de la foto */}
        <div className="absolute inset-0 bg-background/15" />
      </div>

      <HeaderInstitucional />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-xs">
            <ClipboardCheck className="w-4 h-4" /> PASO PREVIO · IDENTIFICACIÓN
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border">
            Requisito administrativo obligatorio
          </span>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border p-6 sm:p-10 shadow-xl">
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
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span>Nombre/s *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Como figura en tu DNI</span>
                </label>
                <Input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Lucas Martín"
                  className={errores.nombre ? 'border-destructive bg-destructive/10' : ''}
                />
                {errores.nombre && <p className="text-destructive text-xs mt-1">{errores.nombre}</p>}
              </div>

              <div>
                <label htmlFor="apellido" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span>Apellido/s *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Completos</span>
                </label>
                <Input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Ej: Rossi"
                  className={errores.apellido ? 'border-destructive bg-destructive/10' : ''}
                />
                {errores.apellido && <p className="text-destructive text-xs mt-1">{errores.apellido}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                <span>Correo electrónico *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Aquí recibirás comprobantes y notificaciones</span>
              </label>
              <div className="relative">
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className={`pl-10 ${errores.email ? 'border-destructive bg-destructive/10' : ''}`}
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errores.email && <p className="text-destructive text-xs mt-1">{errores.email}</p>}
            </div>

            {/* DNI y Género */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dni" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span>DNI *</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Sin puntos ni espacios</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="Ej: 43829114"
                    maxLength={8}
                    className={`pl-10 ${errores.dni ? 'border-destructive bg-destructive/10' : ''}`}
                  />
                  <IdCard className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {errores.dni && <p className="text-destructive text-xs mt-1">{errores.dni}</p>}
              </div>

              <div>
                <label htmlFor="genero" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span>Género / Sexo Registral *</span>
                </label>
                <select
                  id="genero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className={`h-9 w-full rounded-md border px-3 py-1 text-sm text-foreground shadow-xs transition outline-none ${
                    errores.genero ? 'border-destructive bg-destructive/10' : 'border-input bg-card'
                  }`}
                >
                  <option value="" disabled>Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No binario / Otro">No binario / Otro</option>
                </select>
                {errores.genero && <p className="text-destructive text-xs mt-1">{errores.genero}</p>}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                <span>Teléfono celular *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Con código de área, sin 0 ni 15</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm font-bold border border-r-0 border-input rounded-l-md bg-muted text-foreground">
                  +54
                </span>
                <Input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="11 6543-9821"
                  className={`rounded-l-none ${errores.telefono ? 'border-destructive bg-destructive/10' : ''}`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 flex items-center">
                <PhoneCall className="w-3 h-3 text-emerald-600 mr-1" /> Se enviarán recordatorios de vencimiento de vacante y avisos académicos.
              </span>
              {errores.telefono && <p className="text-destructive text-xs mt-1">{errores.telefono}</p>}
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                <span>Dirección *</span>
                <span className="text-[10px] font-normal text-muted-foreground">Calle, altura, piso/dpto y localidad</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Av. Rivadavia 16240, Haedo"
                  className={`pl-10 ${errores.direccion ? 'border-destructive bg-destructive/10' : ''}`}
                />
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errores.direccion && <p className="text-destructive text-xs mt-1">{errores.direccion}</p>}
            </div>

            {/* Checkboxes de Términos */}
            <div className="pt-4 border-t border-border space-y-3">
              <label className="flex items-start gap-3 p-3.5 bg-muted/40 hover:bg-muted/70 rounded-xl border border-border cursor-pointer transition">
                <input
                  type="checkbox"
                  name="aceptaTerminosFacturacion"
                  checked={formData.aceptaTerminosFacturacion}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-primary rounded border-input focus:ring-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  Declaro bajo juramento que los datos ingresados son fidedignos y autorizo a la{' '}
                  <strong>Universidad Tecnológica Nacional - Facultad Regional Haedo</strong> a emitir la
                  factura legal y generar mi legajo de postulante para la{' '}
                  <strong>Tecnicatura Universitaria en Programación (TUP)</strong>.
                </span>
              </label>
              {errores.aceptaTerminosFacturacion && (
                <p className="text-destructive text-xs">{errores.aceptaTerminosFacturacion}</p>
              )}

              <label className="flex items-start gap-3 p-3.5 bg-muted/40 hover:bg-muted/70 rounded-xl border border-border cursor-pointer transition">
                <input
                  type="checkbox"
                  name="aceptaReglamento"
                  checked={formData.aceptaReglamento}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-primary rounded border-input focus:ring-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  Entiendo que al presionar <strong>Siguiente</strong> pasaré a la lectura de los requisitos
                  académicos, condiciones de la seña de reserva de vacante y métodos de pago.
                </span>
              </label>
              {errores.aceptaReglamento && (
                <p className="text-destructive text-xs">{errores.aceptaReglamento}</p>
              )}
            </div>

            {/* Botón Shadcn */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" /> Tus datos fiscales están protegidos (Ley 25.326).
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[220px]"
              >
                <span>{isSubmitting ? 'Iniciando...' : 'Siguiente'}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Banner de Facturación */}
        <div className="mt-6 p-4 rounded-xl border border-accent bg-card/90 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-accent-foreground shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-primary" />
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