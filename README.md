# SmartCart Optimizer
**Motor Inteligente de Comparación de Precios, Descuentos Bancarios y Optimización Logística**

* **Categoría:** Proyecto de Software & Algoritmos
* **Público Objetivo:** B2B (Kioscos/Comercios) & B2C (Hogares)
* **Enfoque:** Full Stack + Big Data + Optimización

---

## 1. Visión General del Proyecto
**SmartCart Optimizer** es una plataforma integral diseñada para resolver la ineficiencia económica y la fragmentación de precios en el aprovisionamiento de mercadería. A diferencia de los comparadores convencionales que se limitan a listar productos en un único comercio, este sistema modela la compra como un **problema de optimización multivariable**, ponderando:

* **Precios base e históricos** en cadenas de supermercados, mayoristas, distribuidoras y comercios locales.
* **Matriz de promociones financieras:** Descuentos bancarios diarios, reintegros con billeteras virtuales (Mercado Pago, Cuenta DNI, MODO, Ualá) y topes de reintegro periódicos.
* **Restricciones de proximidad y costo de transporte:** Relación entre distancia recorrida (combustible/tiempo) vs. porcentaje real de ahorro neto.

> **Propuesta Central:** Permitir al usuario (kiosquero o jefe de hogar) armar una lista masiva de 20 a 100 productos y obtener la combinación óptima de compra: *"Comprá 12 ítems en Mayorista A con MODO (20% off) y 18 ítems en Supermercado B con Cuenta DNI (ahorro neto total: $48.500)"*.

---

## 2. Análisis Comparativo con el Mercado

| Funcionalidad / Dimensión | Ratoneando / Precios Claros | Apps de Billeteras (MODO/MP) | SmartCart Optimizer (Tu App) |
| :--- | :--- | :--- | :--- |
| **Comparativa Monoproducto** | Sí (Búsqueda 1 a 1) | No | **Sí (Catálogo unificado)** |
| **Optimización de Carrito Masivo** | Parcial (1 solo supermercado) | No | **Multi-tienda óptimo (Split Carts)** |
| **Cruce de Descuentos & Bancos** | No / Manual | Solo lista estática de comercios | **Cálculo dinámico con topes de reintegro**[cite: 1] |
| **Segmento Mayorista / Kioscos** | No (Solo hipermercados)[cite: 1] | No[cite: 1] | **Sí (Precios por bulto/escala)**[cite: 1] |
| **Factor Distancia / Logística** | No[cite: 1] | Geolocalización básica[cite: 1] | **Cálculo de costo de desplazamiento**[cite: 1] |

---

## 3. Arquitectura del Sistema y Pipeline de Datos

El sistema está estructurado bajo una arquitectura de microservicios orientada a eventos para garantizar escalabilidad y aislamiento de responsabilidades[cite: 1]:

* **1. Data Ingestion & ETL:** Scrapers distribuidos (Playwright / Scrapy) + Consumo de APIs públicas y feeds de precios con normalización EAN/código de barra[cite: 1].
* **2. Core Engine & Rules:** Motor de optimización en Python (FastAPI + PuLP/OR-Tools) que procesa la combinatoria de promociones y restricciones espaciales[cite: 1].
* **3. Client Apps:** Frontend multiplataforma en React Native / Flutter y Web App responsive en Next.js con soporte offline-first[cite: 1].

### Pipeline de Normalización de Productos
Uno de los mayores desafíos técnicos es la **resolución de entidades** (desambiguación de nombres de productos heterogéneos entre distintos proveedores)[cite: 1]. Se implementa un modelo de Matching Híbrido[cite: 1]:
1. **Clave Canónica (EAN-13):** Identificación exacta mediante código de barras universal cuando esté disponible[cite: 1].
2. **Embeddings Vectoriales & Similitud Coseno:** Procesamiento de texto con modelos de lenguaje ligeros para emparejar títulos disímiles (ej: *"Leche Entera La Serenísima 1L Sachet"* vs *"Sachet Leche LS Ent 1000cc"*)[cite: 1].

---

## 4. Algoritmo de Optimización: Modelo Matemático
El problema de armado de carritos óptimos se formaliza como una variante del **Problema de la Mochila Multidimensional (Knapsack) y Programación Entera Mixta (MIP)**[cite: 1]:

Sea $I$ el conjunto de productos en la lista, $S$ el conjunto de comercios disponibles dentro del radio $R$, y $B$ el conjunto de medios de pago/promociones activas en el día $d$[cite: 1]:

```text
Minimizar:  Costo_Total = Σ (P_i,s * (1 - D_s,b) * X_i,s,b) + Σ (C_viaje * Y_s)
Sujeto a:
  1. Σ X_i,s,b = 1  ∀ i ∈ I         (Todo producto se compra exactamente una vez)
  2. Ahorro_b ≤ Tope_Reintegro_b ∀ b ∈ B  (No exceder topes mensuales/semanales)
  3. Σ Y_s ≤ K_max_paradas                (Límite de comercios a visitar para no perder tiempo)
  4. X_i,s,b ≤ Y_s                              (Si se compra en s, el comercio s se marca como visitado)