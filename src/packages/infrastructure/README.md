# packages/infrastructure — adaptadores de salida

Implementan los puertos con tecnología concreta. Lo específico de Supabase o de Pagos360 solo puede
existir acá y en `apps/web`.

| Carpeta | Función |
|---|---|
| `supabase/` | Repositorios, cliente y tipos generados |
| `informe-de-pagos/` | Lector del CSV/XLSX de SysAdmin que sube Tesorería |
| `exportacion/` | Lista de confirmados para SysAcad (a definir) |
| `pagos360/` | Pasarela de pago digital (por confirmar) |
| `mail/` | Notificaciones (post-MVP) |

**Puede importar:** `application`, `domain`.

**Antes (propuesta de Santi):** "conexiones externas, a la db o a servicios externos o Pagos360". Exacto.
Acá se suman `repository/` y `lib/`, que estaban sueltas en `src/`.
