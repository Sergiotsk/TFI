# 0010 - Circuito de documentación sobre un bucket privado

## Estado

Aceptado (2026-10-22, acordado por el equipo)

## Contexto

La Postulación ya tiene una máquina de estados, pero la documentación seguía siendo un placeholder:
la tabla `documentos` existía desde el esquema inicial y el endpoint leía de un fake. Hay que resolver
tres problemas a la vez:

1. **Quién puede tocar un documento.** Secretaría y Dirección revisan la documentación de cualquier
   postulante de su institución; el aspirante solo la propia; Tesorería no participa del circuito.
2. **Dónde vive el archivo.** Los documentos personales no pueden quedar públicos ni viajar en la
   fila de la base. La Constitución exige datos personales bajo la Ley 25.326 y un bucket privado.
3. **Cómo avanza la Postulación.** El trigger `proteger_transiciones_de_postulacion` solo permite
   escrituras directas para las transiciones de pago. Las de documentación tienen que pasar por una
   RPC `SECURITY DEFINER` que revalide el rol y el grafo.

## Decisión

- **La entidad `Documento` es inmutable.** `revisar()` y `conMetadatos()` devuelven una copia; el
  estado y la revisión se persisten con un `UPDATE` explícito. Observar exige un motivo no vacío y
  reabrir (`OBSERVADO` o `APROBADO` → `PENDIENTE`) limpia la marca de revisión.
- **El archivo va a un bucket privado `documentos`.** La ruta es
  `institucion_id/postulacion_id/<documento_id>-<nombre-seguro>`. La tabla guarda solo la ruta, el
  nombre visible, el MIME y el tamaño. La descarga usa una URL firmada de cinco minutos que se genera
  después de autorizar; nunca se expone el bucket.
- **La autorización vive en el caso de uso y se repite en RLS/RPC.** Secretaría y Dirección operan
  sobre las Postulaciones de su institución; el aspirante solo sobre la propia. Tesorería recibe 403.
  El aspirante puede subir, consultar y borrar; revisar y corregir metadatos es solo del personal.
- **Las transiciones de la Postulación son automáticas.** Al subir el primer documento, una
  `VACANTE_CONFIRMADA` pasa a `ESPERANDO_DOCUMENTACION`. Al revisar, la Postulación se recalcula
  según el conjunto: algún `OBSERVADO` → `OBSERVADO`; todos `APROBADO` → `DOCUMENTACION_VALIDADA`;
  en el resto → `DOCUMENTACION_EN_REVISION`. Si hace falta, el caso de uso encadena las
  transiciones permitidas (`VACANTE_CONFIRMADA → ESPERANDO_DOCUMENTACION →
  DOCUMENTACION_EN_REVISION`). Una vez validada, la documentación no se reabre en el MVP.
- **La RPC `cambiar_estado_de_documentacion` es la única puerta.** Lockea la Postulación, valida el
  rol, el alcance por institución y el grafo, y devuelve un resultado discriminado
  (`OK`, `NO_ENCONTRADA`, `NO_AUTORIZADO`, `TRANSICION_INVALIDA`). El adaptador lo traduce a errores
  de aplicación y HTTP. El trigger guardián no se relaja.
- **Los archivos se validan dos veces.** Zod en el borde y el caso de uso comparten el límite de
  10 MB y los MIME permitidos (PDF, JPG, PNG). La subida compensa: si la fila no se guarda, borra el
  archivo recién subido.

## Alternativas descartadas

- **Guardar el archivo en una columna `bytea` de `documentos`.** La fila se vuelve enorme, las
  políticas de RLS tienen que proteger el binario y no se puede servir una URL temporal. Descartada.
- **Bucket público con URLs adivinables.** Un documento de identidad no puede quedar accesible sin
  autenticación. Descartada.
- **Escribir `estado` de la Postulación directo desde el cliente de sesión.** Salta el lock, el
  control de cupo y el trigger. Descartada.
- **Un `PATCH` libre con `estado` en `documentos` y en `postulaciones`.** Permite observar sin
  motivo, validar con documentos pendientes y saltear el grafo. Descartada.
- **Permitir a Tesorería revisar documentos.** La Tesorería concilia pagos, no identidad ni
  antecedentes académicos. Descartada.
- **Importar el informe de pagos en esta tanda.** El MVP cobra a mano desde los endpoints del
  personal; el importador queda para una US posterior.

## Consecuencias

- ✅ El aspirante completa su documentación sin intervención del personal y ve una URL temporal solo
  cuando el caso de uso autoriza.
- ✅ El personal puede revisar, corregir y borrar con el mismo alcance por institución que el resto
  de los recursos.
- ✅ RLS y la RPC son una segunda barrera real: aunque el cliente llame directo a Supabase, no puede
  cambiar el estado ni leer el archivo de otra institución.
- ✅ Los casos de uso se testean con fakes; la migración deja el bucket y las policies versionadas.
- ⚠️ Cambia el contrato: aparecen `/api/documentos`, `/api/documentos/:id` y el puerto
  `AccionesDeDocumentacion`; `contracts/puertos.md` y `contracts/api-http.md` quedan a cargo del
  equipo hasta actualizarlos.
- ⚠️ El bucket y las policies de Storage se aplican a mano en el remoto; no hay Supabase CLI ni
  Docker en el entorno local, así que la prueba real de RLS/Storage queda pendiente.
- ⚠️ La validación de que todos los documentos estén aprobados se hace en el caso de uso, no en la
  base. Si en el futuro se agrega un documento obligatorio por tipo, la regla debe mudarse al
  dominio.

## Cuándo re-evaluar

Cuando exista la importación del informe de pagos o cuando se quiera reabrir una documentación ya
validada. También si se agregan documentos obligatorios por tipo o si el volumen de archivos exige
un almacenamiento externo al proyecto de Supabase.
