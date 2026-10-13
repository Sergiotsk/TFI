# packages — núcleo y adaptadores de salida

| Paquete | Función | Puede importar |
|---|---|---|
| `domain/` | Reglas del negocio | Nada |
| `application/` | Casos de uso y puertos | `domain` |
| `infrastructure/` | Adaptadores de salida (Supabase, informe de pagos, Pagos360, mail) | `application`, `domain` |

Cada paquete solo puede importar lo que declara en su `package.json`, y una regla de lint lo controla en CI.
