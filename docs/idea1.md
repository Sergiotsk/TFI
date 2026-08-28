# SmartCart Optimizer

**Plataforma Inteligente de Ahorro, Geolocalización Comercial y Promociones Financieras**

- **Categoría:** Aplicación Web & Mobile / Plataforma de Comercio Local
- **Público Objetivo:** B2B (Kioscos, Almacenes y Comercios de Barrio) & B2C (Jefes de Hogar y Consumidores)
- **Enfoque:** Full Stack + Geolocalización + Inteligencia de Negocios y Promociones

---

## 1. Visión General del Proyecto

**SmartCart Optimizer** es una plataforma integral diseñada para resolver la dispersión de precios y potenciar las compras inteligentes según la ubicación del usuario. A diferencia de los comparadores tradicionales que solo muestran catálogos genéricos, este sistema conecta la lista de compras del usuario con los **comercios reales de su zona** (supermercados, mayoristas, distribuidoras, verdulerías, carnicerías y almacenes de barrio), ponderando:

- **Recomendación Hiperlocal de Comercios:** Detección de negocios activos a la redonda con catálogo disponible, horarios de atención y calificación de la comunidad.
- **Matriz de Promociones y Medios de Pago:** Cruce automático de días de descuento, reintegros con billeteras virtuales (Mercado Pago, Cuenta DNI, MODO, Ualá, BNA+) y topes máximos de reintegro.
- **Ruta de Compras Eficiente:** Sugerencia de comercios cercanos para maximizar el ahorro sin tener que recorrer distancias excesivas ni gastar de más en traslado.

> **Propuesta Central:** Permitir al usuario armar su lista (desde 1 hasta 100 productos) y recibir una recomendación personalizada: _"Para tu lista, tenés el 70% de los productos con 30% de reintegro en el Almacén X a 3 cuadras (pagando con Cuenta DNI) y los productos restantes en el Mayorista Y a 1.5 km (ahorro total estimado: $35.000)"_.

---

## 2. Análisis Comparativo con el Mercado

| Funcionalidad / Dimensión             | Ratoneando / Precios Claros   | Apps de Billeteras (MODO / MP)            | SmartCart Optimizer (Tu App)                                 |
| :------------------------------------ | :---------------------------- | :---------------------------------------- | :----------------------------------------------------------- |
| **Comparativa de Precios**            | Sí (Solo grandes cadenas)     | No                                        | **Sí (Grandes cadenas + Comercios de barrio)**               |
| **Recomendación por Cercanía / Zona** | Limitada o inexistente        | Solo mapa estático de comercios adheridos | **Inteligente (Filtra comercios cercanos con stock/precio)** |
| **Cruce de Descuentos & Reintegros**  | No / Carga manual del usuario | Lista básica de promociones               | **Cálculo automático con topes de reintegro por día**        |
| **Segmento Kioscos / Mayoristas**     | No                            | No                                        | **Sí (Compras por bulto y reposición para comercios)**       |
| **Perfil de Comercios Locales**       | No disponible                 | No incluye precios de productos           | **Panel para que almacenes de barrio carguen sus ofertas**   |

---

## 3. Módulo de Geolocalización y Descubrimiento Local

El sistema incorpora un motor de recomendación geográfica pensado tanto para el consumidor como para el comercio de cercanía:

- **Radio Dinámico de Búsqueda:** El usuario puede configurar su radio de interés (ej. "a menos de 10 cuadras caminando" o "hasta 5 km en auto").
- **Radar de Negocios Cercanos:** Mapeo interactivo categorizado (Almacenes, Mayoristas, Fiambrerías, Dietéticas, Farmacias) que resalta comercios con convenios bancarios activos en el día.
- **Perfil de Comercio de Barrio (Portal B2B):** Permite a los negocios locales publicar sus listas de precios, ofertas del día y medios de pago aceptados para atraer clientes de su propio barrio.
- **Reputación y Validación Comunitaria:** Reporte colaborativo de stock y confirmación de precios por parte de los usuarios para mantener la base de datos actualizada en tiempo real.

---

## 4. Arquitectura del Sistema

El proyecto se estructura bajo un diseño moderno, desacoplado y fácil de mantener:

- **1. Ingestión y Gestión de Datos:**
  - Integración de catálogos y feeds de precios de cadenas y distribuidores.
  - Panel autogestionable para que pequeños comercios carguen y actualicen sus listas de precios de forma simple (vía web o archivo Excel/CSV).
  - Módulo de normalización para reconocer productos idénticos con nombres ligeramente diferentes (EAN-13 / Códigos de barra y matching de texto).

- **2. Backend & Motor de Reglas (API REST):**
  - Desarrollado en **Node.js (NestJS / Express)** o **Python (FastAPI)**.
  - Base de datos relacional con soporte geoespacial (**PostgreSQL + PostGIS**) para consultas ultrarrápidas de comercios por latitud/longitud.
  - Gestor de reglas financieras para aplicar los descuentos correctos según día de la semana, banco y billetera virtual.

- **3. Aplicaciones de Cliente (Mobile & Web):**
  - App móvil (**React Native** o **Flutter**) con soporte de geolocalización en tiempo real, lector de códigos de barra con la cámara y mapa interactivo.
  - Plataforma Web (**Next.js / React**) para acceso de usuarios y panel administrativo para comerciantes.

---

## 5. Modelado de Datos (Entidades Clave)

- **Comercio (Store):** Nombre, rubro, ubicación geográfica (coordenadas), horarios, radio de entrega/cobertura y medios de pago/billeteras adheridas.
- **Producto Maestro (Master Product):** Código de barras (EAN), marca, categoría, unidad de medida y descripción.
- **Precio por Comercio (Store Price):** Comercio asociado, precio unitario, precio por bulto/mayorista, fecha de actualización y disponibilidad de stock.
- **Promoción Financiera (Promo):** Entidad emisora (Banco/Billetera), días de vigencia, porcentaje de reintegro, tope máximo mensual/semanal y condiciones.
- **Lista de Compras del Usuario (User List):** Productos solicitados, cantidades deseadas, ubicación actual del usuario y medios de pago habilitados en su perfil.

---

## 6. Plan de Desarrollo por Fases

| Fase                                           | Duración     | Entregables Principales                                                                                        |
| :--------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------- |
| **Fase 1: Base de Datos & Comercios**          | Sprint 1 - 2 | Modelo de datos espacial (PostGIS), módulo de registro de comercios y carga inicial de productos/precios.      |
| **Fase 2: Motor de Descuentos & Zona**         | Sprint 3 - 4 | Lógica de cálculo de promociones bancarias, filtros por cercanía/radio y API REST central.                     |
| **Fase 3: App Móvil & Experiencia de Usuario** | Sprint 5 - 6 | Interfaz para armar listas de compra, mapa interactivo de comercios recomendados y lector de códigos de barra. |
| **Fase 4: Portal Web para Negocios & Testing** | Sprint 7     | Panel para que almacenes gestionen sus precios, pruebas integrales de usabilidad y despliegue en la nube.      |

---

## 7. Modelo de Monetización e Impacto Comercial

1. **Visibilidad Destacada para Comercios Locales:** Almacenes y distribuidores pueden pagar una suscripción accesible para aparecer como "Comercio Recomendado" en su zona cuando los usuarios busquen productos de su rubro.
2. **Suscripción Premium B2B para Kioscos y Pequeños Negocios:** Acceso a alertas mayoristas, compras conjuntas con otros comerciantes de la zona y reportes de variaciones de precios.
3. **Acuerdos de Afiliación con Fintechs y Billeteras:** Promoción de apertura de cuentas y uso de billeteras virtuales a través de la app a cambio de comisiones por conversión.
