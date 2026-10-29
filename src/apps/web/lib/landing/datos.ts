/**
 * Datos del sitio de presentación (landing).
 * Es el equivalente al includes/config.php del prototipo PHP: lo que puede cambiar
 * (nombre, links, equipo, sede) vive acá, y no en los componentes.
 */

/** Nombre del producto. */
export const PROYECTO_NOMBRE = 'Sistema de Ingreso TUP'

/**
 * Destino de todos los botones "Ir al sistema de inscripción". Se puede sobrescribir con la variable de
 * entorno NEXT_PUBLIC_SISTEMA_URL (tiene que llevar ese prefijo para llegar también al navegador).
 */
export const SISTEMA_URL = process.env.NEXT_PUBLIC_SISTEMA_URL ?? '/login'

/** Navegación principal (encabezado y pie). */
export const NAVEGACION = [
  { ruta: '/', texto: 'Inicio' },
  { ruta: '/institucion', texto: 'Institución' },
  { ruta: '/nosotros', texto: 'Sobre nosotros' },
  { ruta: '/contacto', texto: 'Contacto' },
] as const

// Sede y enlaces institucionales.
export const SEDE_DIRECCION = 'París 532, Haedo, Buenos Aires'
export const SEDE_MAPA_URL =
  'https://www.google.com/maps?q=UTN+Facultad+Regional+Haedo,+Par%C3%ADs+532,+Haedo&output=embed'
export const SEDE_MAPA_LINK =
  'https://www.google.com/maps/search/?api=1&query=UTN+Facultad+Regional+Haedo+Par%C3%ADs+532+Haedo'
export const FRH_SITIO = 'https://frh.utn.edu.ar'
export const UTN_SITIO = 'https://www.utn.edu.ar'

/** Imágenes oficiales: van en public/landing/img/ con estos nombres (si no están, se ve un marcador). */
export const IMG_LOGO = '/landing/img/logo-utn-frh.png'

/** Imagen del encabezado de Institución (se ve del lado derecho, con degradado hacia el azul). */
export const IMG_SEDE_PORTADA = '/landing/img/sede-portada.jpg'

/** Fotos del carrusel de la sede: se muestran solo las que existan, en este orden (hasta 6). */
export const FOTOS_SEDE: readonly string[] = [
  '/landing/img/facultad-1.jpg',
  '/landing/img/facultad-2.jpg',
  '/landing/img/facultad-3.jpg',
  '/landing/img/facultad-4.jpg',
  '/landing/img/facultad-5.jpg',
  '/landing/img/facultad-6.jpg',
]

export const DOCENTE = 'Lic. Leila Coronel'

/** Pasos del flujo propuesto (Home). El que tiene `hito` es el que confirma la vacante. */
export const PASOS_PROPUESTOS = [
  {
    titulo: 'Preinscripción ligera',
    detalle: 'Datos mínimos y aceptación de las condiciones.',
    hito: false,
  },
  {
    titulo: 'Paga la matrícula',
    detalle: 'Online o en la ventanilla de Tesorería.',
    hito: false,
  },
  {
    titulo: 'Vacante confirmada',
    detalle: 'El pago acreditado asegura el lugar.',
    hito: true,
  },
  {
    titulo: 'Carga la documentación',
    detalle: 'Recién ahora, y Secretaría la revisa.',
    hito: false,
  },
] as const

export type ClaveDeRol = 'postulante' | 'secretario' | 'tesoreria' | 'director'

/** Roles del sistema (Home). */
export const ROLES: readonly {
  clave: ClaveDeRol
  nombre: string
  funcion: string
}[] = [
  {
    clave: 'postulante',
    nombre: 'Postulante',
    funcion: 'Maneja su postulación y gestiona sus documentos.',
  },
  {
    clave: 'secretario',
    nombre: 'Secretario',
    funcion:
      'Puede gestionar y ayudar a los postulantes en los pasos de los ingresos.',
  },
  {
    clave: 'tesoreria',
    nombre: 'Tesorería',
    funcion: 'Puede gestionar la confirmación de los pagos.',
  },
  {
    clave: 'director',
    nombre: 'Director',
    funcion:
      'Puede ver las estadísticas generales y gestionar el ingreso en general.',
  },
]

/** Tecnología del sistema, agrupada en capas (Home). */
export const CAPAS_TECNOLOGICAS = [
  {
    nombre: 'Lo que ve la persona',
    piezas: [
      { nombre: 'Next.js', uso: 'las páginas y el servidor' },
      { nombre: 'React', uso: 'la interfaz' },
      { nombre: 'TypeScript', uso: 'código más seguro' },
      { nombre: 'Tailwind CSS y shadcn/ui', uso: 'el diseño' },
    ],
  },
  {
    nombre: 'Lo que guarda y protege',
    piezas: [
      {
        nombre: 'Supabase',
        uso: 'base de datos PostgreSQL, usuarios y archivos',
      },
    ],
  },
  {
    nombre: 'Lo que verifica',
    piezas: [
      { nombre: 'Zod', uso: 'valida los datos que llegan' },
      { nombre: 'Vitest', uso: 'pruebas automáticas' },
    ],
  },
] as const

/** Claves válidas de motivo de consulta. La usan la vista y el endpoint. */
export const CLAVES_DE_ASUNTOS = [
  'inscripcion',
  'proyecto',
  'equipo',
  'otro',
] as const

export type ClaveDeAsunto = (typeof CLAVES_DE_ASUNTOS)[number]

/** Motivos de consulta del formulario (clave => texto), en el orden del select. */
export const ASUNTOS = [
  { clave: 'inscripcion', texto: 'Consulta sobre el proceso de inscripción' },
  { clave: 'proyecto', texto: 'Consulta sobre el proyecto' },
  { clave: 'equipo', texto: 'Quiero contactar al equipo' },
  { clave: 'otro', texto: 'Otro motivo' },
] as const satisfies readonly { clave: ClaveDeAsunto; texto: string }[]

export interface Integrante {
  nombre: string
  rol: 'Frontend' | 'Backend'
  /** Nombre del archivo dentro de public/landing/img/ (ej. 'federico.jpg'); si no existe, se muestra la inicial. */
  foto: string
  resumen: string
  tecnologias: string[]
  github: string
  linkedin: string
}

/** Equipo. Cada integrante completa su resumen, tecnologías y links. */
export const EQUIPO: Integrante[] = [
  {
    nombre: 'Federico De Vivo',
    rol: 'Frontend',
    foto: '/landing/img/federico.jpg',
    resumen:
      'Desarrollo de las interfaces del sistema y de este sitio de presentación.',
    tecnologias: [],
    github: '',
    linkedin: '',
  },
  {
    nombre: 'Lucia Enriquez Aveiro',
    rol: 'Frontend',
    foto: '/landing/img/lucia.jpg',
    resumen:
      'Desarrollo de las interfaces del sistema y de este sitio de presentación.',
    tecnologias: [],
    github: '',
    linkedin: '',
  },
  {
    nombre: 'Santiago Vadone',
    rol: 'Backend',
    foto: '/landing/img/santiago.jpg',
    resumen: 'Desarrollo de la lógica del sistema y de la base de datos.',
    tecnologias: [],
    github: '',
    linkedin: '',
  },
  {
    nombre: 'Sergio Tschernitschek',
    rol: 'Backend',
    foto: '/landing/img/sergio.jpg',
    resumen: 'Desarrollo de la lógica del sistema y de la base de datos.',
    tecnologias: [],
    github: '',
    linkedin: '',
  },
]
