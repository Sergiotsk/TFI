# Idea candidata — Índice de costo de vida por barrio

## El problema

Saber cuánto cuesta vivir en un lugar es una decisión grande —mudarse, alquilar,
elegir dónde poner un negocio— y hoy se toma a ojo o preguntando a conocidos.

Los datos existen, pero están desparramados: los precios en un lado, los alquileres
en otro, el transporte en un tercero. Nadie los cruza.

## La solución

Un índice propio que combine varias fuentes públicas y muestre, por zona, cuánto
cuesta vivir ahí: canasta de productos, alquiler, transporte. Comparable entre
barrios y con evolución en el tiempo.

**Lo que lo hace un TFI fuerte:** el cruce de varias fuentes distintas es lo más
rico técnicamente de todo lo que evaluamos. No es mostrar un dataset, es construir
un indicador que antes no existía.

## Por qué se defiende bien

- Cruce de fuentes real, no una sola tabla
- El producto final lo entiende cualquiera
- Valor público claro, cero ecommerce
- Se puede extender: el mismo motor sirve para agregar más variables después

---

## Fuentes de datos

| Fuente | Estado | Notas |
|---|---|---|
| **SEPA** (precios) | ✅ Sólida | Más de 70.000 productos en todo el país, con ubicación de comercio. Es el pilar del índice. |
| **Alquileres** | ⚠️ El punto débil | No hay dataset público oficial. Habría que scrapear portales inmobiliarios, y ahí sí hay términos de uso que restringen. **Verificar antes de comprometerse.** |
| **Transporte** | ⚠️ A definir | Las tarifas son nacionales o regionales, no por barrio. Habría que modelarlo como costo de trasladarse desde la zona a centros de trabajo, no como precio de boleto. |

**La decisión clave del proyecto:** si el dato de alquileres no se consigue de forma
limpia, el índice se arma igual con precios más transporte, y queda un producto más
chico pero honesto. Conviene decidir esto temprano, no a mitad de camino.

---

## El componente propio

Lo que ustedes construyen y defienden:

1. **Normalización.** Un mismo producto se llama distinto en cada comercio. Unificarlo
   es trabajo real y es la parte que más se subestima.
2. **La canasta.** Qué productos entran en el índice y con qué peso cada uno. Esa
   decisión es metodológica y hay que justificarla.
3. **La agregación por zona.** Cómo se pasa de precios de comercios sueltos a un
   número por barrio, y qué se hace cuando una zona tiene pocos datos.
4. **La serie temporal.** Cómo evoluciona el índice mes a mes.

Los puntos 2 y 3 son el corazón académico: son decisiones metodológicas defendibles,
no código.

---

## Riesgos

- **Cobertura desigual.** SEPA cubre bien donde hay grandes comercios y mal donde no.
  Los barrios con pocos supermercados van a tener datos flojos. Hay que decir qué se
  hace en ese caso, no esconderlo.
- **"Esto ya existe".** El INDEC publica índices de precios. El diferencial es la
  granularidad geográfica: el índice oficial no te dice tu barrio.
- **Volumen de datos.** SEPA es grande. Hay que pensar el almacenamiento y el
  procesamiento desde el principio, no improvisarlo.

---

## Relación con la idea del Boletín Oficial

Son las dos finalistas del mismo molde: dato público disperso → producto consultable.

| | Boletín Oficial | Costo de vida por barrio |
|---|---|---|
| Fuente | Una sola, pero pesada de extraer | Varias, y una es incierta |
| Aporte principal | Comprensión de texto y clasificación | Metodología y cruce de datos |
| Riesgo mayor | Que el scraping sea más difícil de lo previsto | Que no se consiga el dato de alquileres |
| Ángulo social | Democratizar información legal | Transparentar el costo de vivir en cada zona |

Ninguna de las dos depende de pedirle permiso a nadie para arrancar.
