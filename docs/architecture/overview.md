# Arquitectura — Visión general (MVP)

Vista consolidada de la solución inicial. Las decisiones que la originan están en
[ADR-0001](../decisions/0001-usar-arquitectura-hexagonal.md) y
[ADR-0002](../decisions/0002-disenar-para-multi-institucion.md); las reglas que la gobiernan, en la
constitución del proyecto (`.specify/memory/constitution.md`).

> **Estado:** borrador inicial. Los elementos con trazo punteado o marcados *(por confirmar)* /
> *(a definir)* dependen de conversaciones pendientes con la facultad (ver
> [Pendientes](#pendientes-por-definir)).

## 1. Flujo invertido: pago acreditado = vacante confirmada

Regla central del negocio, definida por el Director: el pago filtra y confirma la vacante; la
documentación se revisa recién después.

```mermaid
flowchart LR
    subgraph Propuesta["FLUJO INVERTIDO (MVP)"]
        B1["Preinscripción ligera"] --> B2["Paga la matrícula<br/>(ventanilla, confirma Tesorería)"] --> B3["VACANTE CONFIRMADA"] --> B4["Recién ahí carga<br/>documentación"]
    end
    subgraph Hoy["FLUJO ACTUAL (ineficiente)"]
        A1["Se inscribe"] --> A2["Sube documentos"] --> A3["Secretaría TUP<br/>revisa a mano"] --> A4["Se pide el pago"]
    end

    classDef hito fill:#16a34a,stroke:#15803d,color:#fff
    class B3 hito
```

## 2. Arquitectura hexagonal

Núcleo de dominio puro (sin frameworks ni base de datos) más puertos y adaptadores. Los trazos
punteados son lo que todavía no está confirmado o es post-MVP.

```mermaid
flowchart TD
    subgraph Entrada["ADAPTADORES DE ENTRADA (driving)"]
        FE["Frontend Next.js<br/>Alumno · Secretaría TUP · Director<br/>Tesorería sube el informe de pagos"]
        WH["Webhook / archivo de pagos<br/>Pagos360 (por confirmar)"]
    end
    subgraph Core["NÚCLEO DEL DOMINIO"]
        CORE["Gestión de Postulaciones<br/>- Pago acreditado = vacante confirmada<br/>- Acreditación por informe de pagos<br/>- Control de cupos<br/>- Estados + ID de Postulación"]
    end
    subgraph Salida["ADAPTADORES DE SALIDA (driven)"]
        DB[("Supabase<br/>PostgreSQL + Storage + Auth")]
        EXP["Exportador de confirmados<br/>CSV/XLSX → SysAcad (a definir)"]
        PG["Pasarela de pago<br/>adapter Pagos360 (por confirmar)"]
        MAIL["Mail SMTP / Resend<br/>(post-MVP)"]
    end
    FE -->|API Web| CORE
    WH -->|Webhook / archivo| CORE
    CORE -->|Persistencia| DB
    CORE -.->|Exportación| EXP
    CORE -.->|Cobro digital| PG
    CORE -.->|Notificaciones| MAIL
```

En el código, el núcleo se divide en `packages/domain` (entidades, reglas, máquina de estados) y
`packages/application` (casos de uso y puertos), según la constitución (Principio I). Los casos de
uso son **preliminares**: se afinan al especificar cada feature.

## 3. Paquetes del monorepo y dependencias

Cómo se parte el hexágono en código (constitución, Principio I). La flecha significa "depende de":
todo termina en `domain`, que no depende de nadie. Un paquete no puede importar lo que no declara
en su `package.json`, y una regla de lint de límites entre capas falla en CI.

```mermaid
flowchart TD
    WEB["apps/web<br/>Next.js · adaptador de entrada<br/>y raíz de composición"]
    INFRA["packages/infrastructure<br/>adaptadores: Supabase, lector de informes,<br/>exportador, Pagos360, mail"]
    APP["packages/application<br/>casos de uso y puertos"]
    DOM["packages/domain<br/>entidades, reglas y máquina de estados<br/>sin dependencias externas"]
    WEB -->|"invoca casos de uso"| APP
    WEB -->|"conecta puertos con adaptadores"| INFRA
    INFRA -->|"implementa puertos"| APP
    INFRA -->|"mapea a entidades"| DOM
    APP -->|"usa"| DOM
    classDef nucleo fill:#2563eb,stroke:#1d4ed8,color:#fff
    class DOM nucleo
```

`application` define los puertos (interfaces) e `infrastructure` los implementa; `apps/web` los
conecta al arrancar. Por eso se puede cambiar Supabase o Pagos360 sin tocar el dominio.

## 4. Ciclo de vida de la Postulación

Máquina de estados modelada en `domain`. Las transiciones inválidas deben ser imposibles o ser
rechazadas (constitución, Principio II).

```mermaid
stateDiagram-v2
    [*] --> PREINSCRIPTO: carga datos mínimos y acepta condiciones
    PREINSCRIPTO --> PAGO_PENDIENTE: elige medio de pago
    PAGO_PENDIENTE --> VACANTE_CONFIRMADA: pago acreditado (Tesorería o Pagos360)
    PAGO_PENDIENTE --> VENCIDO: vence el plazo
    VACANTE_CONFIRMADA --> ESPERANDO_DOCUMENTACION: se habilita el panel de carga
    ESPERANDO_DOCUMENTACION --> DOCUMENTACION_EN_REVISION: sube DNI y analítico
    DOCUMENTACION_EN_REVISION --> OBSERVADO: Secretaría TUP detecta un problema
    OBSERVADO --> DOCUMENTACION_EN_REVISION: el postulante resube
    DOCUMENTACION_EN_REVISION --> DOCUMENTACION_VALIDADA: Secretaría TUP aprueba
    DOCUMENTACION_VALIDADA --> CONFIRMADO_PARA_EXPORTAR: listo para el pase (a definir)
```

> El estado final y su nombre dependen de cómo se defina la entrega de la lista de confirmados
> (ver pendientes). `CONFIRMADO_PARA_EXPORTAR` es un nombre provisorio.

## 5. Integración con la facultad: solo por archivo

El sistema **no lee ni escribe** las bases de SysAdmin ni SysAcad (constitución, Principio V).
El archivo viaja con una persona: Tesorería baja el informe de pagos de SysAdmin y lo sube a
nuestro sistema con su login y su rol. La entrega de la lista de confirmados a SysAcad todavía no
está definida.

```mermaid
flowchart TD
    SADM["SysAdmin (facultad, sin acceso nuestro)<br/>parte económica · registra el cobro en ventanilla"]
    TES["ADMINISTRACIÓN / TESORERÍA (rol nuevo)<br/>baja el informe de pagos e inicia sesión"]
    subgraph Nuestro["NUESTRO SISTEMA"]
        IMP["Importación de pagos<br/>CSV/XLSX validado con Zod"]
        DOM["DOMINIO<br/>acredita pagos y confirma vacantes"]
        EXPC["Lista de confirmados<br/>(momento y formato a definir)"]
    end
    SACAD["SysAcad (facultad, sin acceso nuestro)<br/>parte académica"]
    SADM -->|"informe de pagos"| TES
    TES -->|"sube el archivo"| IMP
    IMP --> DOM
    DOM -.-> EXPC
    EXPC -.->|"a definir"| SACAD
    classDef pendiente stroke:#6b7280,stroke-width:2px,stroke-dasharray:4 3
    class EXPC pendiente
```

## Pendientes por definir

- **Cuándo y cómo se exporta la lista de confirmados** al sistema académico: falta hablar con el
  Director y con el encargado de Sistemas.
- **Pagos360**: el convenio y la interfaz no están confirmados. Se contempla detrás del puerto
  `PasarelaDePago` para poder cambiarlo sin tocar el dominio, pero el esfuerzo del MVP se centra
  en la comunicación con Tesorería.
- **Formato del informe de pagos de SysAdmin** que sube Tesorería: columnas, códigos y con qué dato
  se cruza cada fila con una Postulación. Falta pedírselo a Administración.
- **Alojamiento** (Vercel + Supabase): no fue consultado con Sistemas; ver constitución, sección
  Stack y restricciones técnicas.

Fuera del MVP (constitución, Principio VI): OCR de analíticos, LLM para feedback, conciliación de
transferencias con OCR, agente Go contra SQL Server, mails automáticos al pagador.
