# Secuencia — Pago y confirmación de vacante

Cómo una Postulación llega a `VACANTE_CONFIRMADA`. El camino principal del MVP es el **pago en
ventanilla, cuyo informe sube Administración/Tesorería**; el pago digital por Pagos360 se contempla
pero **no está confirmado**.

Vista general en [overview.md](./overview.md).

## Camino principal: ventanilla, informe de SysAdmin y carga por Tesorería

```mermaid
sequenceDiagram
    autonumber
    participant ALU as Alumno
    participant WEB as apps/web
    participant APP as application
    participant DOM as domain
    participant DB as Supabase
    participant TES as Tesorería

    ALU->>WEB: Preinscripción y elección de pago en ventanilla
    WEB->>APP: Preinscribir y elegir medio de pago
    APP->>DOM: Crear Postulación
    DOM-->>APP: Estado PAGO_PENDIENTE
    APP->>DB: Guardar con ID de Postulación
    APP-->>WEB: ID de Postulación
    WEB-->>ALU: Muestra el ID para pagar

    Note over ALU,TES: El alumno paga en ventanilla y la facultad lo registra en SysAdmin

    TES->>WEB: Inicia sesión y sube el informe de pagos de SysAdmin
    WEB->>APP: Acreditar pagos del informe
    APP->>APP: Verifica rol Tesorería y valida el archivo
    APP->>DB: Postulaciones con pago pendiente
    DB-->>APP: Postulaciones
    APP->>DOM: Acreditar pago de cada fila que coincide
    DOM-->>APP: Estado VACANTE_CONFIRMADA
    APP->>DB: Guardar transiciones
    APP-->>WEB: Resultado (acreditados y filas sin coincidencia)
    WEB-->>TES: Resumen de la carga
    WEB-->>ALU: Vacante confirmada, se habilita la carga de documentación
```

> Cómo se cruza cada fila del informe con una Postulación (ID, DNI u otro dato) y qué columnas trae
> el informe **no está definido**: es información que falta pedirle a Administración.

## Cierre del día: carga del informe de pagos

Una carga por día, al final del día, acordada con Administración. Tesorería baja el informe de
SysAdmin con las interfaces de ese sistema y lo sube al nuestro con su login y su rol; el sistema
no toca la base de SysAdmin. Es el mismo paso del camino principal, visto desde el archivo.

```mermaid
sequenceDiagram
    autonumber
    participant SADM as SysAdmin
    participant TES as Tesorería
    participant WEB as apps/web
    participant APP as application
    participant DB as Supabase

    SADM-->>TES: Informe de pagos del día (CSV/XLSX)
    TES->>WEB: Inicia sesión y sube el archivo
    WEB->>APP: Importar pagos
    APP->>APP: Verifica rol Tesorería
    APP->>APP: Valida formato (Zod)
    APP->>DB: Guarda pagos y transiciones
    APP-->>WEB: Acreditados y filas sin coincidencia
    WEB-->>TES: Resumen de la carga
```

## Alternativa por confirmar: pago digital con Pagos360

Depende de que se confirme el convenio y la interfaz. Va detrás del puerto `PasarelaDePago`, de
modo que cambiar o quitar la pasarela sea cambiar un adaptador, sin tocar el dominio.

```mermaid
sequenceDiagram
    autonumber
    participant ALU as Alumno
    participant WEB as apps/web
    participant APP as application
    participant DOM as domain
    participant P360 as Pagos360 por confirmar

    ALU->>WEB: Elige pago digital
    WEB->>APP: Elegir medio de pago
    APP->>P360: Generar cobro (puerto PasarelaDePago)
    P360-->>ALU: Medio para pagar
    ALU->>P360: Paga
    P360-->>WEB: Webhook o archivo con quién pagó
    WEB->>APP: Acreditar pago digital (payload validado con Zod)
    APP->>DOM: Acreditar pago
    DOM-->>APP: Estado VACANTE_CONFIRMADA
```

> El payload del webhook o del archivo se valida en runtime con Zod en el borde (constitución,
> Principio IV).
