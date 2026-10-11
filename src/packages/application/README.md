# packages/application — casos de uso y puertos

Orquesta: verifica el rol, pide datos a los puertos, delega la regla al dominio y guarda.
No sabe nada de HTTP ni de Supabase.

| Carpeta | Función |
|---|---|
| `casos-de-uso/` | Una acción del sistema por archivo (ej. `AcreditarPagosDelInforme`) |
| `puertos/` | Contratos que el núcleo necesita del exterior |

**Puede importar:** `domain`.

**Antes (propuesta de Santi):** "para después", con una carpeta `ports/` vacía. Ahora el contenido está definido.
