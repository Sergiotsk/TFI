# apps/web/components — componentes de UI

Componentes visuales (shadcn/ui). Usan los tokens del tema (`primary`, `background`), sin colores ni
marcas escritos a mano (Principio VIII). **Sin reglas de negocio.**

- `ui/`: componentes shadcn/ui sobre Base UI.
- `landing/`: componentes del sitio de presentación. Usan las clases de `app/(landing)/landing.css`
  (el diseño propio de la landing), no los tokens de Tailwind.

**Antes (propuesta de Santi):** `src/components/` ("un input que después usás en el front").
Es lo mismo, pero adentro de `web/`, porque los componentes son de la app web y no del núcleo.
