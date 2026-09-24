# RescatAR 

## Plataforma Inteligente de Asistencia y Rescate Off-Road con Comunidad Unificada y Sistema de Recompensas
**Categoría:** Aplicación Web & Mobile / Red de Asistencia Colaborativa  
**Público Objetivo:** B2C (Conductores 4x4, Motoviajeros, Enduristas) y B2B (Sponsors, Talleres, Lavaderos, Marcas del rubro)  
**Enfoque:** Full Stack (TypeScript) + Geolocalización Offline/Online + Gamificación Solidaria

---

### 1. Visión General del Proyecto

**RescatAR** es una plataforma comunitaria diseñada para centralizar la ayuda ante emergencias en rutas, montañas, médanos y picadas. Funciona como una red solidaria unificada donde cualquier usuario puede ser tanto damnificado como rescatista, eliminando la dependencia de estar en el grupo de WhatsApp correcto en el momento indicado.

* **Alerta SOS y Diagnóstico Visual:** Ante un problema (encajado, rotura, accidente), el usuario genera una alerta rápida adjuntando 1 o 2 fotos del inconveniente y seleccionando qué necesita (malacate, herramientas, auxilio). 
* **Tolerancia a Zonas Sin Señal (Modo Offline):** Si no hay datos, la app encola la solicitud a nombre de la cuenta del usuario. Apenas el dispositivo capta un mínimo de señal, la alerta se dispara automáticamente a los usuarios en el radio de cercanía.
* **Asistencia a Distancia (Fallback de Rescate):** Si el sistema detecta que no hay nadie físicamente cerca, conecta al damnificado con usuarios expertos a distancia (vía chat o videollamada) para brindar asistencia mecánica o guía de supervivencia/rescate paso a paso.
* **Comunidad Gigante y Unificada:** Todo el ecosistema off-road y motero del país centralizado en un solo lugar, actuando como una red de seguridad masiva.

---

### 2. ¿Qué Nos Destaca Frente a Otras Alternativas?

Frente a la dispersión de los grupos de WhatsApp, Telegram o foros:
* **El Poder de la Comunidad Unificada:** En vez de miles de grupos fragmentados por zona o marca, RescatAR concentra toda la fuerza solidaria en un solo mapa activo.
* **Sistema de Reputación Bidireccional:** Tanto el que ayuda como el que recibe ayuda son evaluados. Esto filtra a los usuarios tóxicos, previene "alertas falsas" o bromas, y destaca a los miembros más solidarios.
* **Gamificación y Recompensas:** Ayudar tiene premio. Los rescates exitosos suman "Puntos de Rescatista", fidelizando a los usuarios mediante un ranking de confiabilidad.
* **Validación Visual:** La posibilidad de subir fotos del problema evita viajes en vano (ej. ir a rescatar una moto y encontrarse con una F100 hundida en el barro).

---

### 3. Análisis Comparativo con el Mercado

| Funcionalidad / Dimensión | Grupos de WhatsApp / Telegram | RescatAR (Tu App) |
| :--- | :--- | :--- |
| **Volumen de Comunidad** | Fragmentada, limitada por administradores | **Comunidad Gigante y Unificada** a nivel nacional |
| **Funcionamiento Sin Señal** | Imposible (el mensaje no sale) | **Modo Caché / Offline** con autodisparo al tener señal |
| **Confiabilidad del Usuario** | Nula (no hay historial de comportamiento) | **Sistema de reseñas bidireccional** (evita alertas falsas) |
| **Asistencia ante Aislamiento Total**| Depende de la suerte | **Conexión a distancia (Chat/Video)** si no hay nadie cerca |
| **Incentivo Solidario** | Gratitud moral | **Puntos canjeables y reputación pública** |

---

### 4. Módulos y Roles de la Plataforma

El sistema es dinámico: el perfil es único y el usuario puede alternar entre pedir ayuda o brindarla según la situación.

**A. Módulo de Emergencias (Damnificado)**
* Carga de alerta con geolocalización automática, descripción rápida y subida de 1-2 fotos.
* Match con rescatistas cercanos o, en su defecto, conexión con "Guias a distancia" (videollamada/chat).
* Calificación del rescatista una vez solucionado el problema.

**B. Módulo de Asistencia y Gamificación (Rescatista)**
* Mapa en vivo con alertas radiadas según proximidad.
* Evaluación previa de las fotos del problema antes de aceptar el viaje.
* **Billetera de Puntos:** Acumulación de puntos por cada rescate exitoso confirmado por la otra parte.

---

### 5. Arquitectura del Sistema (Stack Tecnológico)

El proyecto utilizará un ecosistema moderno, escalable y unificado basado en JavaScript/TypeScript:
* **Frontend Mobile/Web:** Desarrollado en **React / React Native** (con TypeScript), permitiendo compilar para iOS y Android con una misma base de código, garantizando un desarrollo ágil para el MVP.
* **Backend & Lógica de Negocio:** **Node.js** (con frameworks como Express o NestJS) usando TypeScript, lo que facilita que los desarrolladores front y back hablen el mismo lenguaje.
* **Base de Datos:** Motor relacional (ej. PostgreSQL con extensión PostGIS) para manejar de forma eficiente las consultas de geolocalización ("¿Quién está a X kilómetros de estas coordenadas?").

---

### 6. Modelado Base de Datos (Entidades Clave)

* **Usuario:** `id`, `nombre`, `puntos_acumulados`, `rating_promedio`, `es_cuenta_verificada`.
* **Alerta_SOS:** `id`, `user_id`, `lat`, `lng`, `fotos_urls`, `descripcion`, `estado`, `necesita_asistencia_remota`.
* **Reseña:** `id`, `autor_id`, `receptor_id`, `alerta_id`, `puntuacion` (1 a 5), `comentario`, `es_reporte_alerta_falsa` (booleano).
* **Transaccion_Puntos:** `id`, `user_id`, `cantidad_puntos`, `motivo` (Rescate exitoso, Alerta falsa penalizada, Canje en tienda).

---

### 7. Plan de Desarrollo (MVP Iterativo)

Dado que la plataforma evolucionará en base al feedback de los usuarios, el enfoque será ágil e incremental:
* **MVP (Producto Mínimo Viable):** App básica donde un usuario emite una alerta, sube una foto, y otro usuario cercano la acepta. Sistema de puntos básico implementado.
* **Fase 2 (Iteración por Feedback):** Inclusión de la "Asistencia a distancia" (videollamada) y optimización del modo offline persistente.
* **Fase 3 (Expansión Comercial):** Lanzamiento del marketplace de recompensas y canjes automáticos mediante lectura de códigos QR en los locales adheridos.

---

### 8. Modelo de Sostenibilidad y Recompensas (Monetización)

El espíritu de **RescatAR** es 100% solidario entre los usuarios (no se cobra dinero por rescatar a alguien), pero el proyecto es económicamente sostenible a través de alianzas B2B:
* **Marketplace de Recompensas (Sponsors):** Los usuarios canjean los "Puntos de Rescatista" por beneficios tangibles. Marcas de repuestos, lubricantes, lavaderos de autos/motos, o aseguradoras pagan una suscripción o tarifa a la app para aparecer en este catálogo, atrayendo a clientes altamente segmentados a sus locales.
* **Publicidad Segmentada No Invasiva:** Marcas de nicho (off-road, camping, motoviajeros) patrocinan el mapa o secciones de la app.
