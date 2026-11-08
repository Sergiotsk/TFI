# 0006 - La institución como dato del esquema desde ahora

## Estado

Aceptado (2026-10-20, acordado por el equipo). Supersede parcialmente a [0002](0002-disenar-para-multi-institucion.md): reemplaza el punto **"NO
construir todavía la estructura para multi-institución"** solo en lo que respecta al **esquema de la base**. El
resto del ADR-0002 sigue vigente.

## Contexto

El [ADR-0002](0002-disenar-para-multi-institucion.md) pide diseñar con la institución como concepto de primer
orden, pero **no construir** multi-tenancy hasta que exista una segunda institución real. El Principio VI de la
constitución dice lo mismo.

El PR 76 agregó una tabla de instituciones y una FK en perfiles y trámites. Al revisarlo, el equipo decidió
mantener la institución **en el esquema**. Los motivos:

- Agregar `institucion_id` cuando ya hay datos reales es una migración de datos (backfill, `NOT NULL`, revisar las
  policies), con riesgo. Agregarla hoy, con la base de desarrollo y sin datos reales, cuesta casi nada.
- La regla de que las etiquetas visibles de los roles ("Secretaría TUP") no se cableen en el código (Principio
  VIII) necesita un lugar donde colgar la institución.

## Decisión

- Existe una tabla **`instituciones`** mínima: código, nombre y si está activa. La migración inserta `FRH` /
  `UTN FRH` como dato de referencia, porque sin una institución activa nadie se puede registrar.
- **`institucion_id` va solo en las raíces**: `periodos_de_ingreso`, `perfiles` y `cargas_de_informe`. Las
  postulaciones y los pagos la **derivan** (a través del período), para que no pueda existir una Postulación de
  una institución dentro de un período de otra.
- El registro asigna la **única institución activa**. Si hay cero o más de una, falla.
- **Sigue sin construirse**: administración de instituciones (alta y baja desde la UI), selección de institución
  en el registro, subdominios, y aislamiento por tenant más allá de las policies de RLS que filtran por la
  institución del usuario.

### Datos personales

Los pagos del informe guardan el DNI informado (`pagos.dni_informado`) para poder imputarlos. Es un dato personal
(Ley 25.326): su plazo de conservación queda atado al `TODO(RETENCION_DATOS)` de la constitución, y se define
cuando se resuelva esa política. Hasta entonces, no se guarda ningún otro dato personal del informe (por ejemplo,
nombre y apellido) mientras no haga falta.

## Alternativas descartadas

- **Una constante de configuración** con la institución: no toca el esquema, pero el día que entre una segunda
  institución obliga a una migración de datos sobre datos reales.
- **`institucion_id` en todas las tablas** (como en el PR 76): permite inconsistencias entre la institución de la
  Postulación y la de su período.

## Consecuencias

- ✅ Sumar una segunda institución no requiere migrar datos, solo construir lo que hoy se difiere.
- ✅ Las policies de RLS ya filtran por institución desde el primer día.
- ⚠️ Se paga hoy una columna y una tabla que todavía no aportan valor funcional. Es una excepción explícita al
  Principio VI, acotada a la estructura mínima.
- ⚠️ El trigger de registro depende de que haya **exactamente una** institución activa. Cuando haya dos, se
  rediseña el registro.

## Cuándo re-evaluar

Cuando aparezca una segunda institución real (ahí se construye lo diferido), o si mantener la columna resulta más
caro de lo previsto.
