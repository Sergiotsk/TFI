# TFI — Ideas candidatas, rankeadas

> Orden de mejor a peor según: originalidad, valor público, sustancia técnica,
> disponibilidad de datos/usuarios y encaje con las restricciones de la cátedra
> (sin ecommerce, sin rubros saturados).

---

## 1. Presupuesto nacional masticado

**Qué es:** tomar los datasets de Presupuesto Abierto y mostrar en qué gasta el
Estado, explicado para cualquier persona. El cruce estrella: **lo presupuestado
versus lo efectivamente ejecutado**, y la brecha entre ambos.

**Por qué gana:** dato público, nacional, árido e ilegible — transformarlo ya es
el aporte. Servicio público evidente, cero ecommerce, nadie lo tiene masticado.
El "prometido vs. ejecutado" es un ángulo que se defiende solo.

**Riesgo:** entender la estructura del presupuesto (jurisdicción, programa,
partida) lleva tiempo. Hay que acotar a un par de áreas, no al presupuesto entero.

---

## 2. Avance de obra sobre plano PDF

**Qué es:** app para que el supervisor marque puntos sobre un plano en PDF y
cargue fotos, estados y eventos en cada punto. Historial por punto.

**Por qué está arriba:** el usuario existe, lo pidió él solo, y está disponible
para entrevistar y validar prototipos. Dolor caro y medible. Técnicamente rico:
render de PDF, coordenadas sobre el plano, adjuntos, y **funcionamiento sin señal**
en la calle.

**Riesgo:** existen Fieldwire y PlanGrid. El ángulo es la obra chica argentina,
que no paga licencias en dólares ni carga un BIM. Hay que decirlo de entrada.

---

## 3. Índice de precios propio con datos de SEPA

**Qué es:** SEPA publica precios de más de 70.000 productos en todo el país. En vez
de otro comparador, construir un **índice de inflación real por producto y por
región**, calculado con el dato crudo.

**Por qué sirve:** dato nacional, actualizado, y el trabajo de normalizar y comparar
es genuinamente técnico. Valor público claro.

**Riesgo:** comparadores de precios hay varios. Si se presenta como "buscador de
precios" se cae; hay que presentarlo como análisis, no como buscador.

---

## 4. Comparador de aseguradoras

**Qué es:** la Superintendencia de Seguros publica datasets de entidades, balances
e indicadores. Producto: qué aseguradora paga mejor y más rápido los siniestros.

**Por qué sirve:** nadie lo tiene, el dato es público y la decisión que ayuda a
tomar es real y cara.

**Riesgo:** entender indicadores del mercado asegurador es un dominio pesado y
ajeno. Curva de aprendizaje alta para el grupo.

---

## 5. Mapa de la investigación argentina

**Qué es:** con datos abiertos del MINCYT, mostrar dónde se investiga qué, con qué
financiamiento y qué becas hay disponibles.

**Por qué sirve:** académico, original, y útil para estudiantes.

**Riesgo:** el usuario final es difuso. ¿Quién lo consulta y con qué frecuencia?
Si no se responde eso, queda como un lindo tablero sin demanda.

---

## 6. Currícula versus mercado laboral

**Qué es:** cruzar los planes de estudio de la carrera con lo que piden las
búsquedas laborales reales, para mostrar dónde está el hueco.

**Por qué sirve:** cruce de datos real, usuarios al lado (los compañeros).

**Riesgo:** depende de scrapear portales de empleo, que cambian y bloquean.
Además el tema "conseguir el primer trabajo" está bastante transitado.

---

## 7. Rendición de donaciones en merenderos

**Qué es:** registrar qué mercadería entra a un comedor o merendero y en qué se usó,
para poder mostrarlo a quienes donan.

**Por qué sirve:** peso social genuino, observable en un día, dolor medible en
donaciones perdidas.

**Riesgo:** técnicamente es un CRUD. Para un TFI de la carrera puede quedar corto
si no se le suma algo más.

---

## 8. Asistente para confeccionar facturas en ARCA

**Qué es:** app que toma datos de un archivo y guía a un monotributista para emitir
su factura.

**Por qué baja:** el problema es más de capacitación que de software, hay competencia
local fuerte (TusFacturas, Xubio, Facturante) y ata el proyecto a una API estatal
que cambia sola.

---

## 9. App de organización familiar

**Qué es:** reparto de tareas del hogar entre los integrantes de la familia.

**Por qué baja:** mercado saturado y el usuario sos vos mismo. Se defiende mal como
trabajo académico.

---

## Descartadas

| Idea | Motivo |
|---|---|
| Administración de alquileres Airbnb | Mercado poblado, sin ángulo diferencial |
| Plataforma de oficios | Ídem, y muy cerca de lo que la cátedra desalienta |
| Seguimiento de colectivos en tiempo real | Moovit y Cuándo Llega ya lo resuelven con datos oficiales; el mérito sería consumir una API existente |

---

## Criterio que usé

1. ¿Existe el dato o el usuario, hoy, sin pedir permiso a nadie?
2. ¿El trabajo de transformar es nuestro, o solo consumimos algo ya hecho?
3. ¿Lo entiende una persona que no es del rubro?
4. ¿Sobrevive a la pregunta "esto ya existe"?
