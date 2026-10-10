# Estructura del código — guía práctica

Cómo se organiza el código fuente y cómo se trabaja dentro de la arquitectura hexagonal. Es la
guía para el día a día: qué va en cada lugar, por qué, y cómo agregar una feature sin romper los
límites.

- Las **reglas** están en la constitución (`.specify/memory/constitution.md`, Principio I). Si esta
  guía y la constitución se contradicen, rige la constitución.
- Los **diagramas** están en [overview.md](./overview.md) y [secuencia-pago.md](./secuencia-pago.md).

> **Estado:** borrador inicial, todavía sin código. Los nombres de carpetas, puertos y casos de uso
> son de referencia y se ajustan al especificar cada feature. Lo que **no** cambia es la dirección
> de las dependencias.

## 1. La idea en una frase

El negocio (pagos, vacantes, estados de la Postulación) vive en el centro y **no sabe** que existen
Next.js, Supabase ni Pagos360. Todo lo de afuera se enchufa al centro a través de contratos
(puertos). Si mañana cambiamos Supabase por otra base, cambiamos un adaptador y el negocio ni se
entera.

## 2. El árbol

```
TFI/
├── apps/
│   └── web/                          Next.js: adaptador de ENTRADA y raíz de composición
│       └── src/
│           ├── app/                  páginas, layouts y route handlers (app/api/**/route.ts)
│           ├── components/           UI (shadcn/ui). Sin reglas de negocio
│           ├── http/                 schemas Zod de requests y mapeo de errores a respuestas HTTP
│           └── composition-root.ts   arma los casos de uso con sus adaptadores reales
│
├── packages/
│   ├── domain/                       el NEGOCIO. TypeScript puro, cero dependencias
│   │   └── src/
│   │       ├── postulacion/          entidad Postulacion, estados y transiciones
│   │       ├── pago/                 value objects del pago
│   │       └── errores.ts            errores de dominio (ej. TransicionInvalida)
│   │
│   ├── application/                  CASOS DE USO y PUERTOS. Solo depende de domain
│   │   └── src/
│   │       ├── casos-de-uso/         un archivo por caso de uso (AcreditarPagosDelInforme, ...)
│   │       └── puertos/
│   │           └── repositorio-de-postulaciones/
│   │               ├── puerto.ts     la interfaz (el contrato)
│   │               ├── fake.ts       implementación en memoria para tests
│   │               └── contrato.ts   suite de tests de contrato reutilizable
│   │
│   └── infrastructure/               ADAPTADORES de salida. Implementan los puertos
│       └── src/
│           ├── supabase/             repositorios, cliente, tipos generados y mapeos
│           ├── informe-de-pagos/     lector del CSV/XLSX de SysAdmin (+ schema Zod)
│           ├── exportacion/          exportador de confirmados (a definir)
│           ├── pagos360/             adaptador de PasarelaDePago (por confirmar)
│           └── mail/                 notificaciones (post-MVP)
│
├── supabase/migrations/              esquema de base versionado (Supabase CLI)
└── specs/                            specs de cada feature (Spec Kit, opcional)
```

## 3. La regla de dependencias

Las flechas significan "puede importar a". **Todo apunta hacia `domain`**, y `domain` no importa a
nadie.

```
apps/web ──────────► application ──────► domain
    │                     ▲                ▲
    └──► infrastructure ──┘────────────────┘
```

| Paquete | Puede importar | NO puede importar |
|---|---|---|
| `domain` | nada (solo TypeScript) | Zod, Supabase, Next.js, cualquier otro paquete |
| `application` | `domain` | `infrastructure`, `apps/web`, Supabase, Next.js |
| `infrastructure` | `application` (para implementar puertos), `domain` | `apps/web` |
| `apps/web` | todo | — (es la raíz de composición) |

**¿Por qué así?** Porque lo que más cambia (la UI, la base, la pasarela de pago) depende de lo que
menos cambia (las reglas del negocio), y nunca al revés. Es como una casa: los cimientos no saben de
qué color son las paredes.

Esto no queda librado a la buena voluntad: cada paquete solo puede importar lo que declara en su
`package.json`, y una regla de lint de límites entre capas hace fallar el CI.

## 4. Puerto no es lo mismo que tipo

Es la confusión más común, así que vale la pena detenerse.

- Un **tipo** describe la forma de un dato: `type Postulacion = { id: string; estado: ... }`.
- Un **puerto** es un **contrato de comportamiento** que el núcleo necesita del mundo exterior y que
  alguien de afuera tiene que cumplir:

```ts
// packages/application/src/puertos/repositorio-de-postulaciones/puerto.ts
import type { Postulacion } from '@tfi/domain';

export interface RepositorioDePostulaciones {
  obtenerPorId(id: string): Promise<Postulacion | null>;
  listarConPagoPendiente(): Promise<Postulacion[]>;
  guardar(postulacion: Postulacion): Promise<void>;
}
```

Lo define `application` (el que lo **necesita**) y lo implementa `infrastructure` (el que **sabe
cómo**). Ese es el truco de la inversión de dependencias: el caso de uso pide "algo que guarde
Postulaciones" sin saber si es Supabase, un archivo o un fake en memoria.

Una carpeta `interfaces/` llena de tipos de modelos **no** son puertos. Si un service importa el
repositorio concreto, no hay hexagonal, aunque las carpetas se parezcan.

## 5. Un caso de punta a punta: Tesorería sube el informe de pagos

Es el camino principal del MVP (ver [secuencia-pago.md](./secuencia-pago.md)). Los fragmentos son
ilustrativos y están recortados.

**1. Dominio: la regla.** La transición vive en la entidad. Nadie más puede cambiar el estado.

```ts
// packages/domain/src/postulacion/postulacion.ts
export class Postulacion {
  private constructor(readonly id: string, private _estado: EstadoPostulacion) {}

  get estado() { return this._estado; }

  acreditarPago(): void {
    if (this._estado !== 'PAGO_PENDIENTE') {
      throw new TransicionInvalida(this._estado, 'VACANTE_CONFIRMADA');
    }
    this._estado = 'VACANTE_CONFIRMADA';
  }
}
```

**2. Application: el caso de uso.** Orquesta: verifica el rol, pide datos a los puertos, delega la
regla al dominio y guarda. No sabe nada de HTTP ni de Supabase.

```ts
// packages/application/src/casos-de-uso/acreditar-pagos-del-informe.ts
export class AcreditarPagosDelInforme {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly autorizacion: Autorizacion,
  ) {}

  async ejecutar(usuario: Usuario, pagos: PagoInformado[]): Promise<ResultadoDeCarga> {
    this.autorizacion.exigirRol(usuario, 'TESORERIA');
    const resultado = ResultadoDeCarga.vacio();
    for (const pago of pagos) {
      const postulacion = await this.postulaciones.obtenerPorId(pago.idPostulacion);
      if (!postulacion) { resultado.sinCoincidencia(pago); continue; }
      postulacion.acreditarPago();
      await this.postulaciones.guardar(postulacion);
      resultado.acreditado(postulacion);
    }
    return resultado;
  }
}
```

> Con qué dato se cruza cada fila del informe (ID de Postulación, DNI u otro) todavía no está
> definido; `idPostulacion` es provisorio.

**3. Infrastructure: los adaptadores.** El lector del informe valida el archivo con Zod y lo
traduce a `PagoInformado`. El repositorio de Supabase mapea filas de la base a entidades.

```ts
// packages/infrastructure/src/supabase/repositorio-de-postulaciones-supabase.ts
export class RepositorioDePostulacionesSupabase implements RepositorioDePostulaciones {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async obtenerPorId(id: string) {
    const { data } = await this.db.from('postulaciones').select('*').eq('id', id).maybeSingle();
    return data ? aPostulacion(data) : null; // tipos de Supabase → entidad de dominio
  }
  // ...
}
```

**4. apps/web: la entrada y el armado.** El route handler valida el request, llama al caso de uso y
traduce el resultado a HTTP. La raíz de composición es el único lugar donde se eligen los
adaptadores concretos.

```ts
// apps/web/src/composition-root.ts
export function crearAcreditarPagosDelInforme(db: SupabaseClient<Database>) {
  return new AcreditarPagosDelInforme(
    new RepositorioDePostulacionesSupabase(db),
    new AutorizacionSupabase(db),
  );
}
```

Un Server Component que necesita datos hace lo mismo: llama a un caso de uso armado en la raíz de
composición. **Nunca** consulta Supabase directo ni llama a un repositorio.

## 6. ¿Dónde va esto?

| Necesito... | Va en |
|---|---|
| Una regla del negocio (transición, validación de cupo, vencimiento) | `domain` |
| Coordinar varios pasos (buscar, aplicar regla, guardar, notificar) | caso de uso en `application` |
| Algo que el núcleo necesita de afuera (guardar, leer un archivo, cobrar, avisar) | un puerto en `application/puertos` |
| Hablar con Supabase, leer un CSV, llamar a Pagos360 | adaptador en `infrastructure` |
| Validar un request, un formulario o un archivo | schema Zod en el borde (`apps/web/http` o el adaptador) |
| Los tipos generados por Supabase | solo en `infrastructure/supabase`, mapeados a entidades |
| Verificar el rol del usuario | el caso de uso (RLS es la segunda barrera) |
| Un componente visual | `apps/web/components`, usando tokens del tema |
| Variables de entorno | validadas con Zod en `apps/web`, inyectadas al armar adaptadores |
| Cambiar el esquema de la base | una migración en `supabase/migrations` |

## 7. Errores comunes

- **Regla de negocio en un service, controller o componente.** Si la regla "solo se acredita lo que
  está en `PAGO_PENDIENTE`" vive en un route handler, el día que entre el webhook de Pagos360 alguien
  la va a duplicar (o se la va a olvidar).
- **Importar Supabase en `application` o en `domain`.** Rompe todo el modelo: el caso de uso ya no se
  puede testear sin base. El lint lo frena, pero mejor entender por qué.
- **Confundir tipos con puertos.** Ver la sección 4.
- **Zod en el dominio.** El dominio usa TypeScript puro; la validación de datos externos es cosa del
  borde.
- **Usar "Legajo".** Es un concepto de SysAcad. La entidad nuestra es `Postulación`.
- **Saltear el caso de uso** desde la UI "porque es solo una lectura". Hoy es una lectura, mañana
  tiene un filtro por rol.

## 8. Cómo agregar una feature

El orden importa: de adentro hacia afuera, contratos primero (constitución, Principio III).

1. **Dominio:** modelar la regla en la entidad y testearla con Vitest, sin mocks.
2. **Puerto:** si el caso de uso necesita algo de afuera, definir la interfaz en
   `application/puertos`.
3. **Fake y contrato:** escribir el fake en memoria y la suite de contrato del puerto.
4. **Caso de uso:** implementarlo y testearlo con los fakes.
5. **Adaptador real:** implementarlo en `infrastructure` y hacerlo pasar la misma suite de contrato.
6. **Entrada:** conectar en la raíz de composición y exponer por route handler, Server Action o
   Server Component.

Con los pasos 1 a 4 el negocio ya funciona y está probado, sin haber tocado Supabase ni Next.js. Eso
permite trabajar en paralelo: mientras alguien hace el adaptador de Supabase, otro hace la UI contra
el fake.

### Cómo se reutiliza la suite de contrato

```ts
// packages/application/src/puertos/repositorio-de-postulaciones/contrato.ts
export function contratoRepositorioDePostulaciones(crear: () => RepositorioDePostulaciones) {
  it('guarda y recupera una Postulación', async () => { /* ... */ });
  it('devuelve null si no existe', async () => { /* ... */ });
}

// application: describe('fake', () => contratoRepositorioDePostulaciones(() => new RepositorioFake()));
// infrastructure: describe('supabase', () => contratoRepositorioDePostulaciones(() => crearConDbDeTest()));
```

Si el fake y el adaptador real pasan la misma suite, los tests de los casos de uso que usan el fake
son confiables.

## 9. Revisión

Los cambios en `packages/domain` o en los puertos requieren dos aprobaciones y, si cambian un
contrato existente, un ADR en `docs/decisions/` (constitución, Flujo de desarrollo y calidad).
