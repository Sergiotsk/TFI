# apps/web/app — rutas (App Router)

Páginas y layouts de Next.js, organizados por portal: Alumno, Secretaría TUP, Director y
Administración/Tesorería. Si un Server Component necesita datos, llama a un **caso de uso**,
nunca a Supabase directo.

- `(landing)/`: sitio de presentación (Inicio, Institución, Sobre nosotros, Contacto). Tiene su
  layout propio con header, pie y `landing.css`. Migrada desde el prototipo PHP que vivía en
  `app/api/landing/`; los datos configurables (equipo, links, sede) están en
  `lib/landing/datos.ts` y las imágenes opcionales en `public/landing/img/`.
- `api/contacto/route.ts`: recibe el formulario de contacto de la landing, lo valida con Zod
  (`http/contacto.ts`) y lo deja en el log del servidor. Todavía no persiste ni manda mail.
