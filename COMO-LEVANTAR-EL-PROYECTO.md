# Cómo levantar el proyecto TFI

## Requisitos previos

- **Node.js 24.x** (exacto; el proyecto rechaza otras versiones). Verificar con:

  ```bat
  node -v
  ```

  Tiene que mostrar `v24...`.

- **pnpm** (versión 12.11.2). Verificar con:

  ```bat
  pnpm -v
  ```

  Si no está instalado:

  ```bat
  corepack enable
  corepack prepare pnpm@12.11.2 --activate
  ```

  O bien:

  ```bat
  npm install -g pnpm@12.11.2
  ```

- **Git**. Verificar con:

  ```bat
  git --version
  ```

## Levantar en local

```bat
git clone https://github.com/Sergiotsk/TFI.git
cd TFI
git checkout develop

cd src\apps\web
copy .env.example .env.local
cd ..\..

pnpm install
pnpm dev
```

Abrir `http://localhost:3000`.

> El `.env.local` se crea copiando `.env.example` y no se versiona. En local se puede ver la landing y verificar que la app levanta. Las pantallas que usan base de datos (registro, login, paneles y pagos) necesitan Supabase; para probarlas, usar el link de producción.

## Probar todo: base de datos + Mercado Pago

Link de producción: `https://sistemagiu.com.ar/`

| Rol        | Correo                       | Contraseña             |
| ---------- | ---------------------------- | ---------------------- |
| Aspirante  | `Crear Cuenta`               | `Crear Contraseña`     |
| Secretaría | `secretaria@prueba.tfi.test` | `Contraseñadeprueba02` |
| Dirección  | `direccion@prueba.tfi.test`  | `Contraseñadeprueba02` |
| Tesorería  | `tesoreria@prueba.tfi.test`  | `Contraseñadeprueba02` |

Con esas cuentas se puede probar el circuito completo: login, postulación, paneles de personal y pago.

Para el checkout de Mercado Pago, usar una **cuenta de prueba** de Mercado Pago (no una cuenta real ni una tarjeta real).

## Si algo falla

- `pnpm` no existe: ejecutar `corepack enable` o `npm install -g pnpm@12.11.2`.
- Error de versión de Node: instalar Node 24.
- El puerto 3000 está ocupado: desde `apps\web`, ejecutar `pnpm dev -- -p 3001`.
