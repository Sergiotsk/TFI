# 0007 - Renombrar Procedure a Postulación y alinear los roles

## Estado

Aceptado (2026-10-20, acordado por el equipo)

## Contexto

La constitución (Principio II) fija el lenguaje ubicuo: la entidad central es la **Postulación**, con su ID de
Postulación. El código y la base usan otro nombre y otro modelo:

- La entidad `Procedure`, el puerto `RepositorioDeProcedure`, las rutas `app/api/procedure` y la tabla
  `procedures` modelan un **trámite de aprobación** con 4 estados (`INICIADO`, `EN PROCESO`, `APROBADO`,
  `RECHAZADO`).
- La Postulación del dominio sigue el **flujo invertido** de [docs/architecture/overview.md](../architecture/overview.md):
  primero el pago confirma la vacante y después se revisa la documentación. Son 10 estados, más
  `PAGO_EN_REVISION` ([ADR-0005](0005-excepciones-de-vacante-decide-direccion.md)).

**No hay un mapeo 1 a 1** entre los dos modelos: no es un renombre cosmético. Además, el esquema mezcla inglés
(`profiles`, `procedures`) con español, y los roles (`INTERESADO`, `SECRETARIO`, `DIRECTOR`, `ADMIN`) no coinciden
con los de la constitución. `ADMIN` en realidad era Tesorería, y el nombre invita a darle permisos de superusuario.

Es el momento más barato para cambiarlo: la raíz de composición usa **solo fakes**, todavía no existe el adaptador
de Supabase y la base remota es de desarrollo, sin datos reales.

## Decisión

- `Procedure` pasa a **`Postulacion`** en todas las capas: entidad, puerto (`RepositorioDePostulaciones`), fake,
  rutas de la API y tabla (`postulaciones`). El estado pasa a ser el enum `estado_postulacion` del overview.
- El **esquema** queda 100 % en español, en `snake_case` y sin ñ ni tildes en los identificadores (`perfiles`,
  `postulaciones`, `documentos`, `periodos_de_ingreso`, `pagos`). Se elimina `procedure_documents`, porque
  `documentos.postulacion_id` alcanza.
- Los **roles** se nombran por su **función** en el sistema, no por la institución ni la carrera:

  | Antes | Ahora | Etiqueta en UTN FRH (configuración) |
  |---|---|---|
  | `INTERESADO` | `ASPIRANTE` | "Aspirante" (la constitución dice "Alumno": no es alumno hasta que ingresa) |
  | `SECRETARIO` | `SECRETARIA` | "Secretaría TUP" |
  | `DIRECTOR` | `DIRECCION` | "Director de la TUP" |
  | `ADMIN` | `TESORERIA` | "Administración / Tesorería" |

  Las etiquetas visibles van en un único punto de configuración de `apps/web` (Principio VIII). No hay un rol de
  superusuario en la app: para eso está el dashboard de Supabase.
- `User` pasa a **`Perfil`** y pierde el campo `password` (la contraseña la maneja Supabase Auth).
- El cambio se hace con **migraciones incrementales** (ADR-0004): renombres y enums nuevos con conversión de los
  valores existentes. Postgres no permite borrar valores de un enum, así que se crean enums nuevos y se eliminan
  los viejos.

## Alternativas descartadas

- **Mantener `Procedure` y que el adaptador traduzca**: la traducción sería permanente, y como los modelos de
  estados son distintos, el adaptador terminaría tomando decisiones de negocio.
- **Esquema en inglés**: sigue la convención de los ejemplos de Supabase, pero el dominio y el código ya están en
  español, así que el adaptador traduciría todo. Lo peor sería **mixto**.
- **Roles con el nombre de la institución** (`SECRETARIA_TUP`): cablea la institución y la carrera en el núcleo,
  contra el ADR-0002 y los Principios VI y VIII.

## Consecuencias

- ✅ El dominio, el código y la base hablan el mismo idioma: el adaptador mapea casi 1 a 1.
- ✅ Desaparece una escalada de privilegios latente (el nombre `ADMIN` y el rol que se tomaba de la metadata del
  registro).
- ⚠️ Cambia un **puerto existente** y la máquina de estados: los PRs de código que lo implementen requieren doble aprobación (constitución, flujo de
  desarrollo).
- ⚠️ Hay que tocar los fakes, las rutas y los tests que hoy usan `Procedure` y `User`. Hoy son pocos, y crecen con
  cada semana que pasa.
- ⚠️ La constitución nombra los roles como "Alumno", "Secretaría TUP", "Director" y "Administración/Tesorería".
  Siguen siendo válidos como **etiquetas**; los identificadores del código son los de esta tabla.

## Cuándo re-evaluar

Si se define la entrega de la lista de confirmados al sistema académico y cambia el estado final de la Postulación
(hoy `CONFIRMADO_PARA_EXPORTAR`, que es provisorio).
