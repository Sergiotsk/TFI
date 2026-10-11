# packages/domain — el negocio

Entidades, reglas y máquina de estados. **TypeScript puro, sin dependencias** (ni Zod, ni Supabase,
ni Next). Se testea con Vitest sin mocks.

| Carpeta | Función |
|---|---|
| `postulacion/` | Entidad `Postulacion`, sus estados y transiciones |
| `pago/` | Value objects del pago |

**Puede importar:** nada.

**Antes (propuesta de Santi):** "todas las cosas de las que van a depender las demás: reglas de negocio,
objetos base". Esa es exactamente la idea. Lo que cambia: las reglas que estaban pensadas para `services/`
también vienen acá.
