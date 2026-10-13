# application/puertos

Interfaces que el núcleo necesita del exterior (ej. `RepositorioDePostulaciones`, `PasarelaDePago`).
Cada puerto tiene su carpeta con `puerto.ts`, un `fake.ts` en memoria y un `contrato.ts`: la suite de
tests que tienen que pasar el fake y el adaptador real (Principio III).

**Puerto ≠ tipo:** un tipo describe datos; un puerto es un contrato de comportamiento.

**Antes (propuesta de Santi):** `ports/` vacía, más `src/interfaces/` y `src/types/` con tipos de modelos.
Los tipos no invierten la dependencia; los puertos sí.
