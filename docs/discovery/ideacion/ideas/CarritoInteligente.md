# CarritoInteligente

**Plataforma Inteligente de Ahorro, Geolocalización Comercial y Promociones Financieras**

- **Categoría:** Aplicación Web & Mobile / Plataforma de Comercio Local
- **Público Objetivo:** B2B (Kioscos, Almacenes y Comercios de Barrio) & B2C (Jefes de Hogar y Consumidores)
- **Enfoque:** Full Stack + Geolocalización + Inteligencia de Negocios y Promociones

---

## 1. Visión General del Proyecto

**CarritoInteligente** es una plataforma integral diseñada para resolver la dispersión de precios y potenciar las compras inteligentes según la ubicación del usuario. Conecta la lista de compras con los **comercios reales de la zona** (supermercados, mayoristas, distribuidoras, verdulerías, carnicerías y almacenes de barrio), ponderando:

- **Recomendación Hiperlocal de Comercios:** Detección de negocios activos a la redonda con catálogo disponible, horarios de atención y calificación de la comunidad.
- **Matriz de Promociones y Medios de Pago:** Cruce automático de días de descuento, reintegros con billeteras virtuales (Mercado Pago, Cuenta DNI, MODO, Ualá, BNA+) y topes máximos de reintegro.
- **Ruta de Compras Eficiente:** Sugerencia de comercios cercanos para maximizar el ahorro sin recorrer distancias excesivas ni incurrir en costos elevados de traslado.

> **Propuesta Central:** Permitir al usuario armar su lista (desde 1 hasta 100 productos) y recibir una recomendación personalizada: _"Para tu lista, tenés el 70% de los productos con 30% de reintegro en el Almacén X a 3 cuadras (pagando con Cuenta DNI) y los productos restantes en el Mayorista Y a 1.5 km (ahorro total estimado: $35.000)"_.

---

## 2. ¿Qué Nos Destaca Frente a Otros Proyectos Parecidos?

A diferencia de las herramientas actuales que operan de forma aislada, **CarritoInteligente unifica precio, ubicación y método de pago en un solo flujo inteligente**:

- **Integración Total de la Economía Real (No solo hipermercados):** Los comparadores existentes solo leen datos de 3 o 4 grandes cadenas nacionales. Esta plataforma incorpora al **comercio de proximidad** (kioscos, distribuidoras barriales, carnicerías y almacenes), digitalizando el tejido comercial local.
- **Cálculo Dinámico con Topes de Reintegro Reales:** Las apps bancarias solo muestran _"30% off los miércoles"_, pero no calculan el impacto en un carrito específico. La plataforma descuenta automáticamente hasta alcanzar el **tope mensual/semanal** de cada billetera y redirige el saldo excedente al siguiente mejor medio de pago.
- **División Inteligente de Carrito (_Split Cart_ Geográfico):** No te obliga a comprar todo en un único lugar ni te manda a 10 tiendas inviables. Recomienda el balance óptimo de compras agrupadas por cercanía (ej. 2 paradas a menos de 1 km).
- **Doble Impacto B2B + B2C:** Sirve tanto para la compra familiar mensual como para el abastecimiento y reposición de mercadería de pequeños comerciantes que buscan comprar por bulto a precios de escala.
- **Validación Comunitaria y Precios Vivos:** Combina la carga de precios oficiales con reportes colaborativos de la comunidad para alertar faltantes de stock y ofertas relámpago de barrio.

---

## 3. Análisis Comparativo con el Mercado

| Funcionalidad / Dimensión             | Ratoneando / Precios Claros   | Apps de Billeteras (MODO / MP)  | CarritoInteligente (Tu App)                               |
| :------------------------------------ | :---------------------------- | :------------------------------ | :-------------------------------------------------------- |
| **Comparativa de Precios**            | Sí (Solo grandes cadenas)     | No                              | **Sí (Grandes cadenas + Comercios de barrio)**            |
| **Recomendación por Cercanía / Zona** | Limitada o inexistente        | Solo mapa estático de adheridos | **Dinámica (Filtra comercios cercanos con stock/precio)** |
| **Cruce de Descuentos & Reintegros**  | No / Carga manual del usuario | Lista básica de promociones     | **Cálculo automático con topes de reintegro por día**     |
| **Segmento Kioscos / Mayoristas**     | No                            | No                              | **Sí (Compras por bulto y reposición para comercios)**    |
| **Perfil para Comercios Locales**     | No disponible                 | No incluye precios de productos | **Panel autogestionable para publicar ofertas locales**   |

---

## 4. Módulo de Geolocalización y Descubrimiento Local

- **Radio Dinámico de Búsqueda:** Configuración de rangos personalizados (ej. _"a menos de 10 cuadras caminando"_ o _"hasta 5 km en auto"_).
- **Radar de Negocios Cercanos:** Mapeo interactivo categorizado (Almacenes, Mayoristas, Fiambrerías, Dietéticas, Farmacias) que resalta comercios con convenios bancarios activos en el día.
- **Perfil de Comercio de Barrio (Portal B2B):** Permite a los negocios locales publicar sus listas de precios, ofertas del día y medios de pago aceptados para captar clientes zonales.
- **Reputación y Validación Comunitaria:** Reporte colaborativo de stock y confirmación de precios para mantener la base de datos actualizada en tiempo real.

---

## 5. Arquitectura del Sistema

- **1. Ingestión y Gestión de Datos:**
  - Integración de catálogos y feeds de precios de cadenas y distribuidores.
  - Panel autogestionable para que pequeños comercios carguen sus listas de precios (vía web o archivo Excel/CSV).
  - Normalización de productos mediante código de barras EAN-13 y matching de nombres.

- **2. Backend & Motor de Reglas (API REST):**
  - Backend en **Node.js (NestJS / Express)** o **Python (FastAPI)**.
  - Base de datos relacional con soporte geoespacial (**PostgreSQL + PostGIS**) para indexación y consultas de distancia.
  - Gestor de reglas financieras para aplicar descuentos según día de la semana, banco y billetera.

- **3. Aplicaciones de Cliente (Mobile & Web):**
  - App móvil (**React Native** o **Flutter**) con geolocalización en tiempo real, lector de códigos de barra con cámara y mapa interactivo.
  - Plataforma Web (**Next.js / React**) para usuarios generales y panel de administración comercial.

---

## 6. Modelado de Datos (Entidades Clave)

- **Comercio (Store):** Nombre, rubro, coordenadas geográficas, horarios, radio de cobertura y billeteras adheridas.
- **Producto Maestro (Master Product):** Código de barras (EAN), marca, categoría, unidad de medida y descripción.
- **Precio por Comercio (Store Price):** Comercio asociado, precio unitario, precio mayorista/bulto, fecha de actualización y stock.
- **Promoción Financiera (Promo):** Entidad emisora (Banco/Billetera), días de vigencia, porcentaje de reintegro, tope de reintegro y términos.
- **Lista de Compras del Usuario (User List):** Productos solicitados, cantidades, ubicación del usuario y medios de pago activos.

---

## 7. Plan de Desarrollo por Fases

| Fase                                   | Duración     | Entregables Principales                                                                       |
| :------------------------------------- | :----------- | :-------------------------------------------------------------------------------------------- |
| **Fase 1: Base de Datos & Comercios**  | Sprint 1 - 2 | Modelo de datos espacial (PostGIS), módulo de comercios y carga inicial de productos/precios. |
| **Fase 2: Motor de Descuentos & Zona** | Sprint 3 - 4 | Lógica de promociones bancarias, filtros por radio/cercanía y API REST central.               |
| **Fase 3: App Móvil & UX**             | Sprint 5 - 6 | Interfaz de armado de listas, mapa de comercios recomendados y lector de códigos de barra.    |
| **Fase 4: Portal Web B2B & Testing**   | Sprint 7     | Panel de gestión de precios para comerciantes, pruebas integrales y despliegue en la nube.    |

---

## 8. Modelo de Monetización e Impacto Comercial

1. **Visibilidad Destacada para Comercios Locales:** Almacenes y distribuidores pueden promocionarse como "Comercio Recomendado" en su radio geográfico.
2. **Suscripción Premium B2B para Comercios:** Acceso a compras conjuntas mayoristas, alertas de reposición y análisis de precios del mercado.
3. **Acuerdos de Afiliación con Billeteras y Bancos:** Comisiones por derivación y apertura de cuentas promocionadas dentro de la plataforma.
