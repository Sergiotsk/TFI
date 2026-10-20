# Quickstart: validar la feature

Guía para probar que la feature funciona de punta a punta. No contiene implementación: los detalles están en
[data-model.md](data-model.md) y en [contracts/](contracts/).

## Requisitos

- Node 24 y pnpm (versión del `packageManager` de `src/package.json`).
- Docker Desktop corriendo (ADR-0004: cada uno trabaja contra su base local).
- Todos los comandos se corren desde `src/` (ADR-0003).

## 1. Base local desde cero

```bash
cd src
pnpm dlx supabase start          # levanta Postgres, Auth y Studio en Docker
pnpm dlx supabase db reset       # aplica TODAS las migraciones de src/supabase/migrations + seed
```

**Se espera**: el reset termina sin errores y, en Studio, existen `instituciones` (con `FRH`), `perfiles`,
`periodos_de_ingreso`, `postulaciones`, `documentos`, `pagos`, `cargas_de_informe` y `decisiones_de_direccion`. No
existen `procedures`, `procedure_documents`, `reservations` ni nada en inglés. **No** hay una carpeta
`supabase/` en la raíz del repo.

Verificaciones rápidas en el SQL editor de Studio (rol `postgres`):

| Qué | Se espera |
|---|---|
| RLS activo en todas las tablas de `public` | `relrowsecurity = true` en todas |
| `anon` no puede ejecutar ninguna función `SECURITY DEFINER` | `has_function_privilege('anon', ..., 'EXECUTE') = false` |
| Los enums viejos ya no existen | `procedure_state`, `user_role` y `user_sex` no están en `pg_type` |

## 2. Tests (sin red ni base)

> Los scripts `test` y `test:contratos` los agrega la tarjeta "Config de Vitest y CI" (research R4).

```bash
pnpm test                        # Vitest: dominio + casos de uso + contratos contra los fakes
```

**Se espera** que pasen, entre otros:
- Las transiciones válidas e inválidas de la máquina de estados (incluida `PAGO_EN_REVISION`).
- El vencimiento perezoso con `RelojFijo` (avanzar el reloj más allá de `vence_el` da `VENCIDO`, y en
  `PAGO_EN_REVISION` no vence).
- La tabla de `evaluarPago` en el orden de [data-model.md](data-model.md#evaluación-de-un-pago-informado-regla-del-dominio).
- Los contratos de [puertos.md](contracts/puertos.md) contra los fakes.

## 3. Contratos contra Supabase local

```bash
SUPABASE_TEST_URL=http://127.0.0.1:54321 pnpm test:contratos
```

**Se espera**: los mismos contratos pasan contra el adaptador. Los críticos:
- **Último cupo en paralelo**: exactamente un `REGISTRADO` y un `CONFLICTO`.
- **Idempotencia**: la misma referencia dos veces da una sola fila.
- **Doble decisión de Dirección**: la segunda devuelve `conflicto`.

Esta salida se adjunta al PR del adaptador (la CI todavía no levanta Supabase, research R4).

## 4. Registro (trigger estricto)

Con la app corriendo (`pnpm dev`), o con el cliente de Supabase contra la base local:

| Prueba | Se espera |
|---|---|
| `signUp` con todos los datos y `role: 'TESORERIA'` en la metadata | Perfil con rol `ASPIRANTE` e institución `FRH` |
| `signUp` sin `dni` | Falla (y el formulario ya lo frena antes, con Zod) |
| Dos `signUp` seguidos sin `dni` | Fallan los dos; ninguno deja un perfil con `dni = ''` |
| Cambiar el email del usuario en Auth | `perfiles.email` queda actualizado |

## 5. Recorrido de negocio

Con un período de 2 cupos y un plazo de 3 días, y tres aspirantes (A, B y C):

1. A, B y C crean su Postulación e inician el pago. Las tres quedan `PAGO_PENDIENTE` con `vence_el` y ven el
   aviso de que su lugar no está reservado.
2. Tesorería importa un informe con los pagos de A y B. Los dos quedan `VACANTE_CONFIRMADA`. Ocupación: 2 / 2.
3. Un nuevo aspirante D intenta iniciar el pago: lo rechaza `SinCuposParaIniciar` (FR-011).
4. Tesorería importa el pago de C (dentro del plazo). C queda `PAGO_EN_REVISION` y el pago `A_DECIDIR`
   (`SIN_CUPO`), y aparece en el panel de Dirección.
5. Se vuelve a importar el mismo informe. El resumen de la carga da todo `duplicados` y no cambia nada (SC-002).
6. Dirección acepta el caso de C. C queda `VACANTE_CONFIRMADA`, la ocupación da 3 / 2 y queda registrada la
   decisión (SC-007).
7. Con el reloj después del vencimiento, un aspirante E pendiente se consulta como `VENCIDO`. Si después llega su
   pago, queda `PAGO_EN_REVISION` con `FUERA_DE_PLAZO`. Dirección lo rechaza: E vuelve a `VENCIDO` y el pago
   queda `DEVUELTO`, visible para Tesorería.
8. Un pago con un número de Postulación existente pero un DNI que no coincide queda `NO_IMPUTADO`
   (`DNI_NO_COINCIDE`), visible para Tesorería y Secretaría.
