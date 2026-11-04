# UTN Haedo — Sistema de diseño de los paneles

Sistema de diseño de la Facultad Regional Haedo (UTN), relevado de https://frh.utn.edu.ar/ (kit global de Elementor) y aplicado al TFI como **tema de institución**. Hoy lo usa el panel del personal (Secretaría, Tesorería y Dirección); esta guía explica cómo sumarlo a otro panel, como el del aspirante.

No inventes colores, radios ni tipografías fuera de esta guía.

## Cómo funcionan los temas en el proyecto

- **`app/globals.css` no se toca.** Define los tokens base en `:root` (los usan el login y el registro) y el `@theme inline` que convierte cada variable en utilidad de Tailwind (`bg-primary`, `text-muted-foreground`, `rounded-lg`, etc.).
- **Cada institución tiene su tema en `temas/<codigo>.css`.** El de UTN Haedo es `temas/frh.css`. El código sale de `config/institucion.ts` (`INSTITUCION.codigo = 'FRH'`, el mismo de `public.instituciones`).
- **El tema se acota con atributos, no con rutas.** El CSS de Next es global, así que:
  - `app/(paneles)/layout.tsx` importa `@/temas/frh.css` y envuelve todo en `data-institucion="FRH"`. Así el tema solo vale dentro de los paneles y no pisa la landing.
  - Cada panel se marca con `data-panel="..."`. El sistema UTN Haedo completo hoy está acotado a `data-panel="personal"`, en `(personal)/layout.tsx`.
- **Los portales también llevan el tema.** Los tooltips y el Sheet de la barra en el celular se renderizan en `<body>`, fuera del div con el atributo. Por eso cada selector va acompañado de su versión `:root:has(...)`.
- **Los componentes usan solo tokens semánticos** (`bg-primary`, `text-foreground`, `border-border`), **nunca hex fijos**. Así el mismo componente sirve para cualquier institución.

## Sumarlo al panel del aspirante

**1. En el layout del panel** (`app/(paneles)/aspirante/layout.tsx`), marcá el contenedor y cargá la fuente, igual que en `(personal)/layout.tsx`:

```tsx
import { Public_Sans } from 'next/font/google'
import { cn } from '@/lib/utils'

// Solo define la variable: temas/frh.css la elige como --font-sans.
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

// ...
<div data-panel="aspirante" className={cn(publicSans.variable, 'min-h-screen bg-background font-sans text-foreground')}>
  {/* encabezado + children */}
</div>
```

El fondo y la fuente se repiten en ese div porque el div de `(paneles)/layout.tsx` ya los resolvió con los valores de afuera.

**2. En `temas/frh.css`**, sumá el panel al selector del sistema en vez de duplicar el bloque:

```css
[data-institucion='FRH'] :is([data-panel='personal'], [data-panel='aspirante']),
:root:has([data-institucion='FRH'] :is([data-panel='personal'], [data-panel='aspirante'])) {
  /* ...los mismos tokens de hoy... */
}

[data-institucion='FRH'] :is([data-panel='personal'], [data-panel='aspirante']) {
  --font-sans: var(--font-public-sans);
}
```

Los valores de la barra lateral (`--sidebar-*`) quedan definidos igual, pero el aspirante no tiene barra, así que no le afectan.

Las reglas de componentes de más abajo en `frh.css` (botones de 44 px, fondo con trama, insignias por tono) hoy están acotadas a `[data-panel='personal']`. Si el aspirante las quiere, se extienden con el mismo `:is(...)`. El fondo con trama apunta a `[data-slot='sidebar-inset']`, que el aspirante no tiene: para él habría que elegir otro contenedor.

## Tokens del tema (`temas/frh.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#f3f7f8` | Fondo general del panel (gris azulado muy suave) |
| `--foreground` | `#454545` | Texto de cuerpo |
| `--card` / `--popover` | `#ffffff` | Tarjetas, menús, diálogos |
| `--primary` | `#00455c` | Azul petróleo de marca: títulos, botón primario |
| `--primary-foreground` | `#ffffff` | Texto sobre primario |
| `--secondary` / `--accent` | `#e6f0f3` | Fondos suaves de botones secundarios y hover |
| `--secondary-foreground` / `--accent-foreground` | `#00455c` | Texto sobre esos fondos |
| `--muted` | `#eef3f5` | Zonas apagadas, encabezados de tabla |
| `--muted-foreground` | `#454545` | Texto secundario |
| `--destructive` | `#d1243c` | Errores y acciones destructivas |
| `--border` | `#d8e2e6` | Bordes y separadores |
| `--input` | `#7d9fab` | Borde de inputs (gris acero, más marcado) |
| `--ring` | `#157feb` | Anillo de foco (azul de acción) |
| `--radius` | `0rem` | Esquinas rectas en todo |
| `--sidebar` | `#00455c` | Barra lateral petróleo (solo personal) |
| `--sidebar-primary` | `#00d2f2` | Cian del ítem activo, sobre petróleo |
| `--senal-verde` | `#8dcc3d` | Éxito (texto petróleo encima) |
| `--senal-ambar` | `#ffab00` | Avisos (texto petróleo encima) |
| `--senal-violeta` | `#b047b3` | En revisión, categorías (texto blanco encima) |
| `--senal-rojo` | `#d1243c` | Errores (borde y texto sobre blanco) |
| `--senal-neutro` | `#eeeeee` | Estados neutros |
| `--senal-cian` | `#00b8d5` | Gráficos: lo pendiente, al lado del petróleo de lo ocupado |
| `--sombra-tarjeta` | `0 0 10px 0 rgb(0 0 0 / 0.13)` | Despega las tarjetas del fondo, sin borde |
| `--alto-barra-superior` | `58px` | Alto de la barra superior del panel |

Los `--senal-*`, `--sombra-tarjeta` y `--alto-barra-superior` no están en el `@theme inline` de `globals.css`, así que no hay `bg-senal-ambar`. Se usan con la sintaxis de variable de Tailwind v4, **siempre con un valor de respaldo**, para que una institución sin ese token no quede sin color:

```tsx
<div className="bg-card p-5 shadow-(--sombra-tarjeta)">…</div>
<span className="bg-(--senal-ambar,var(--accent)) text-primary">…</span>
```

## Reglas de la marca

- **Marca:** azul petróleo `#00455C` (`primary`) sobre blanco. Títulos, botón primario, encabezados.
- **Acción y foco:** azul `#157FEB`, que en el proyecto es `--ring`. Texto blanco sobre ese azul da 3.99:1, así que no lo uses de fondo de botones con texto chico: para eso está `primary`.
- **Acento cian `#00D2F2`:** solo sobre fondo petróleo (5.7:1), como en la barra lateral. Nunca como texto sobre blanco.
- **Forma:** con `--radius: 0` todos los `rounded-sm`…`rounded-4xl` de Tailwind quedan rectos, porque `globals.css` los calcula a partir de `--radius`. Usá las clases de shadcn tal cual y el tema hace el resto. `rounded-full` (insignias, avatares) sigue siendo redondo.
- **Tarjetas:** `bg-card shadow-(--sombra-tarjeta)`, sin borde. Se despegan del fondo por la sombra.
- **Botones:** en el panel del personal miden 44 px de alto (el mínimo táctil), y el `outline` es blanco con borde petróleo. Lo pone `frh.css` por `data-slot` y `data-variant`, así que se usa el `Button` de shadcn sin clases extra.
- **Fondo del contenido:** trazos en los colores de señal (el eco del logo), trama de X y grilla de puntos en petróleo al 9 %, todo sutil para que resalten las tarjetas blancas. Los SVG están en `public/instituciones/frh/`.
- **Tipografía:** Public Sans para todo, cargada con `next/font` en el layout del panel (ver arriba). No va en `app/layout.tsx`, para no cambiar la landing ni el login.
- **Voz:** español rioplatense con voseo en los llamados a la acción ("Inscribite", "Consultá", "Subí tu documentación"). MAYÚSCULAS solo para el nombre institucional y los accesos rápidos.
- **Sin modo oscuro y sin degradés de color en los paneles.** La grilla de puntos del fondo es un `radial-gradient`, pero es una trama, no un degradé.

## Colores de señal

Viven en el tema como `--senal-*` (ver la tabla). Reglas de contraste, ya medidas:
- **Verde y ámbar:** siempre con texto petróleo. Con blanco no dan contraste.
- **Violeta:** con texto blanco.
- **Rojo:** como borde y texto sobre blanco, no de relleno.

Si hace falta un color de señal nuevo, va como `--senal-*` en `frh.css`, nunca en hex dentro del componente.

## Escala tipográfica

| Estilo | Tamaño / interlineado | Peso | Uso |
| --- | --- | --- | --- |
| display-xl | 46px / 54px | 600 | Hero |
| display-lg | 38px / 48px | 500 | Títulos de sección |
| heading-1 | 30px / 36px | 500 | Título de página |
| heading-institutional | 28px / 38px | 700, MAYÚSCULAS, petróleo | "UNIVERSIDAD TECNOLÓGICA NACIONAL" |
| heading-2 | 24px / 30px | 700 | Títulos de tarjeta |
| heading-3 | 20px / 28px | 500 | Subtítulos |
| heading-4 | 18px / 26px | 500 | Titulares |
| lead | 18px / 24px | 400 | Bajadas |
| body | 16px / 24px | 400 | Cuerpo |
| button | 15px / 20px | 500 | Botones, sin mayúsculas |
| nav-label | 16px / 16px | 800, MAYÚSCULAS, +0.1px | Accesos rápidos |
| caption | 12px / 14px | 400 | Fechas, notas |

En los paneles casi siempre alcanza con heading-1 para abajo: los display son de la landing.

## Patrones de componentes

- **Botón primario:** el `Button` de shadcn sin variante (`bg-primary text-primary-foreground`). No hace falta `rounded-none`: lo pone el tema.
- **Botón secundario:** `variant="secondary"` u `"outline"`.
- **Enlace:** `text-primary underline underline-offset-4 hover:no-underline`.
- **Input:** el `Input` de shadcn tal cual. El borde sale de `--input` y el foco de `--ring`.
- **Insignias de estado:** `components/panel/insignia-de-estado.tsx`, con su `data-tono` (`exito`, `aviso`, `revision`, `error`, `neutro`). En el personal, `frh.css` las pinta con los colores de señal llenos, esquinas de 3 px y sin el punto. No inventes colores por estado.
- **Logo:** el oficial que ya está en el repo (`public/instituciones/frh/logo-utn-haedo.png`). No redibujarlo. Si no carga, va el nombre con el estilo heading-institutional.
