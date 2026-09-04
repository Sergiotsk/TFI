# SolucionAR

**Marketplace Inteligente de Servicios del Hogar con Diagnóstico Visual por IA y Geolocalización en Tiempo Real**

- **Categoría:** Aplicación Web & Mobile / On-Demand Service Marketplace
- **Público Objetivo:** B2C (Hogares, Inquilinos y Propietarios) & B2Pro (Profesionales independientes: Plomeros, Electricistas, Gasistas, Pintores, Técnicos, etc.)
- **Enfoque:** Full Stack + Visión por Computadora / LLM Multimodal + Geolocalización + Real-Time

---

## 1. Visión General del Proyecto

**SolucionAR** es una plataforma integral diseñada para resolver la fricción, incertidumbre e informalidad en la contratación de servicios técnicos y reparaciones para el hogar. Funciona mediante un modelo bidireccional estilo "Uber de los oficios":

- **Diagnóstico Visual Asistido por IA:** El usuario toma una foto o video corto del problema (ej. una pérdida bajo la bacha, una térmica quemada, una rajadura en la pared) y el modelo multimodal clasifica automáticamente el **rubro exacto necesario**, describe el posible origen de la falla y sugiere una lista preliminar de materiales requeridos.
- **Matching y Despacho On-Demand:** La plataforma conecta la solicitud con profesionales verificados en un radio cercano en tiempo real o permite programar visitas según franja horaria.
- **Flujo Integral de Trabajo:** Cubre desde el diagnóstico, solicitud de presupuestos y geolocalización del técnico en camino, hasta el chat interno, pago en custodia (_escrow_) y validación de conformidad del trabajo.

> **Propuesta Central:** Eliminar la duda de _"¿a quién tengo que llamar para esto?"_. El usuario sube una foto, la IA diagnostica: _"Problema: Fuga en sifón de desagüe de PVC. Rubro: Plomería. Nivel de urgencia: Medio"_, y con un solo botón envía la solicitud a los plomeros calificados más cercanos a su domicilio.

---

## 2. ¿Qué Nos Destaca Frente a Otros Proyectos Parecidos?

Frente a plataformas tradicionales de clasificados o directorios estáticos (IguanaFix, TimbrApp, TaskRabbit, Páginas Amarillas):

- **Diagnóstico Guiado por IA (Sin Selección Manual a Ciegas):** Muchas personas no saben si un cortocircuito requiere un electricista matriculado o un técnico de electrodomésticos. La IA multimodal elimina el error humano y pre-clasifica la orden con precisión técnica.
- **Modelo "Uber-Like" en Tiempo Real:** En lugar de esperar 48 horas a que 3 profesionales respondan un formulario web, la app permite solicitar un servicio de **Urgencia / Inmediato** donde el profesional disponible más cercano acepta y se desplaza con seguimiento en mapa en vivo.
- **Presupuestación Transparente y Pre-evaluación de Materiales:** La IA genera un resumen estructurado para el técnico antes de salir de su taller (fotos, descripción del daño y medidas aproximadas), reduciendo las visitas diagnósticas innecesarias.
- **Seguridad y Confianza con Perfiles Verificados:** Sistema de matriculación / DNI validado, antecedentes, portfolio de trabajos anteriores verificados con fotos reales de "antes y después", y reputación mutua cliente/profesional.
- **Pagos Protegidos (Escrow):** El cliente abona en la plataforma; el dinero queda en custodia segura y se libera al trabajador una vez que ambas partes confirman la finalización del trabajo mediante código PIN/QR de conformidad.

---

## 3. Análisis Comparativo con el Mercado

| Funcionalidad / Dimensión           | Directorios Tradicionales / Clasificados | IguanaFix / TaskRabbit         | SolucionAR (Tu App)                                    |
| :---------------------------------- | :--------------------------------------- | :----------------------------- | :----------------------------------------------------- |
| **Identificación del Problema**     | Búsqueda manual por categoría            | Menús desplegables estáticos   | **Diagnóstico automático por Foto / IA Multimodal**    |
| **Modalidad de Contratación**       | Contacto informal por teléfono/WhatsApp  | Cotizaciones demoradas por web | **Doble modo: Inmediato (Uber-like) o Programado**     |
| **Seguimiento en Vivo del Técnico** | No                                       | No disponible en la mayoría    | **Sí (Geolocalización en tiempo real en mapa)**        |
| **Estimación Previa de Materiales** | No                                       | No                             | **Sí (Sugerencia automática de repuestos/insumos)**    |
| **Protección de Pago (Escrow)**     | No (Efectivo/Transferencia sin garantía) | Parcial                        | **Sí (Liberación de fondos contra validación QR/PIN)** |

---

## 4. Módulos y Roles de la Plataforma

### A. Experiencia del Cliente (Usuario Demandante)

- **Carga Rápida de Solicitud:** Captura de foto/video, escaneo de la falla y confirmación de la recomendación de la IA.
- **Selector de Modalidad:** _"Lo necesito ahora"_ (búsqueda radial inmediata) o _"Programar visita"_ (agenda con calendario).
- **Mapa de Seguimiento:** Visualización de la llegada del profesional y tiempo estimado de arribo (ETA).
- **Chat & Videollamada Rápida:** Canal de comunicación integrado sin necesidad de compartir números personales.
- **Calificación y Feedback:** Sistema de 5 estrellas, reseñas y tags de desempeño (puntualidad, prolijidad, precio).

### B. Experiencia del Profesional (Usuario Prestador)

- **Panel de Oportunidades Cercanas:** Radar de trabajos disponibles en su zona con radio de cobertura configurable en kilómetros.
- **Ficha Técnica Detallada:** Vista de fotos en alta resolución, diagnóstico de IA y descripción antes de aceptar o cotizar.
- **Gestión de Agenda y Estado de Turnos:** Calendario integrado de visitas confirmadas, trabajos en curso y finalizados.
- **Billetera Virtual & Métricas:** Panel de ingresos netos, comisiones de plataforma, transferencias a CBU/CVU y estadísticas de reputación.

---

## 5. Arquitectura del Sistema

El sistema utiliza una arquitectura orientada a servicios desacoplados con soporte en tiempo real y procesamiento asincrónico:

- **1. Módulo de IA y Visión Computacional:**
  - Endpoint de inferencia conectado a modelos multimodales (ej. OpenAI Vision API, Gemini Vision o modelo custom YOLO/ResNet finetuneado) para clasificación de categorías (Plomería, Gas, Electricidad, Cerrajería, Pintura, Climatización, Albañilería).
  - Generador de diagnósticos técnicos estructurados en JSON (problema detectado, nivel de criticidad, herramientas sugeridas).

- **2. Backend & Motor de Matching en Tiempo Real:**
  - Desarrollado en **Node.js (NestJS)** o **Python (FastAPI)**.
  - Comunicación bidireccional mediante **WebSockets / Socket.io** para notificación instantánea de viajes/trabajos y tracking de ubicación.
  - Base de datos relacional y geoespacial (**PostgreSQL + PostGIS**) para consultas espaciales de distancia (`ST_DWithin`).
  - Cola de mensajes (**Redis / BullMQ**) para gestión de reintentos de matching y expiración de ofertas de trabajo.

- **3. Aplicaciones Móviles (React Native / Flutter):**
  - Dos perfiles unificados o apps dedicadas con background location tracking (geolocalización en segundo plano para profesionales).
  - Integración nativa de cámara, permisos de ubicación de alta precisión y notificaciones Push (Firebase Cloud Messaging).

---

## 6. Modelado de Base de Datos (Entidades Clave)

- **User (Usuario Base):** ID, nombre, email, teléfono, rol (Cliente / Profesional / Admin), rating promedio, estado de verificación de identidad.
- **Professional Profile (Perfil Prestador):** Rubros habilitados, matrículas/certificados, radio de trabajo (km), estado de disponibilidad (Online/Offline), coordenadas actuales.
- **Service Request (Orden de Trabajo):** ID_Cliente, ID_Profesional_Asignado, Foto_URL, Diagnóstico_IA, Rubro_Detectado, Modalidad (Urgente/Programado), Estado (Buscando, Aceptado, En Camino, En Progreso, Completado, Cancelado).
- **Location Snapshot:** Coordenadas históricas en vivo del prestador durante el servicio activo.
- **Payment & Escrow Transaction:** ID_Orden, Monto_Total, Comisión_Plataforma, Estado_Pago (Retenido, Liberado, Reembolsado).
- **Review / Review Tag:** Puntuación, comentario, fotos del trabajo terminado, autor y receptor.

---

## 7. Plan de Desarrollo por Fases

| Fase                                       | Duración     | Entregables Principales                                                                                |
| :----------------------------------------- | :----------- | :----------------------------------------------------------------------------------------------------- |
| **Fase 1: Auth, Roles & Pipeline IA**      | Sprint 1 - 2 | Registro con verificación, módulo de inferencia multimodal por foto y categorización automática.       |
| **Fase 2: Geolocalización & Matching**     | Sprint 3 - 4 | Consultas PostGIS, lógica de despacho en tiempo real vía WebSockets y estados de la orden de servicio. |
| **Fase 3: Mobile Apps & Comunicación**     | Sprint 5 - 6 | Interfaces para Cliente y Profesional en Flutter/React Native, mapa con ruta en vivo y chat interno.   |
| **Fase 4: Pasarela de Pagos, Escrow & QA** | Sprint 7     | Integración de pagos con retención de fondos, validación QR de entrega de obra y despliegue cloud.     |

---

## 8. Modelo de Monetización y Sostenibilidad

1. **Comisión por Servicio Completado (Take Rate):** Cobro de una comisión del 10% al 15% sobre el valor de la mano de obra cerrada a través de la plataforma.
2. **Suscripción Pro para Prestadores (SolucionAR Pro):** Destacado en búsquedas programadas, badge de "Profesional Premium Verificado", seguro de accidentes personales bonificado y exención parcial de comisiones.
3. **Comisiones por Venta de Materiales (Ferreterías Asociadas):** La app sugiere comprar los repuestos diagnosticados por la IA en corralones/ferreterías asociadas con retiro prioritario o delivery al domicilio del cliente.
