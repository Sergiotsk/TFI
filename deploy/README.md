# Despliegue en el home server

Esta rama trae la app Next.js dockerizada para correr en un servidor Linux con Docker y
publicarla en `https://tfi.vadonedev.com.ar` mediante un Cloudflare Tunnel.

La base de datos, Auth y Storage **siguen en Supabase cloud**. El contenedor no levanta Postgres.

## Requisitos

- Docker Engine con el plugin `docker compose`.
- Git.
- El dominio `vadonedev.com.ar` administrado por Cloudflare (para el tunnel).

## 1. Clonar y configurar

```bash
sudo mkdir -p /opt/tfi
sudo chown "$USER":"$USER" /opt/tfi

git clone https://github.com/Sergiotsk/TFI.git /opt/tfi
cd /opt/tfi
git checkout feature/despliegue

cp .env.example .env
chmod 600 .env
nano .env
```

Completá como mínimo:

```dotenv
NEXT_PUBLIC_APP_URL=https://tfi.vadonedev.com.ar
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
PAGOS_PASARELA=mercadopago
MP_ACCESS_TOKEN=APP_USR-...
```

No commitees `.env`. No pongas `SUPABASE_SERVICE_ROLE_KEY` como `NEXT_PUBLIC_*`.

## 2. Primer arranque

```bash
docker compose up -d --build
docker compose logs -f tfi-web
```

La app escucha en `3100`, pero solo en `127.0.0.1` del host. El 3000 y el 9000 quedan libres.

Verificá que responda:

```bash
curl http://127.0.0.1:3100/api/health
```

## 3. Cloudflare Tunnel

1. En Cloudflare Zero Trust: **Networks → Tunnels → Create a tunnel**.
2. Elegí **Cloudflared**.
3. En **Public Hostnames** agregá:
   - Subdomain: `tfi`
   - Domain: `vadonedev.com.ar`
   - Service: `http://tfi-web:3100`
4. Copiá el token del tunnel.
5. En el server, agregalo al `.env`:

```dotenv
CLOUDFLARE_TUNNEL_TOKEN=eyJ...
```

6. Levantá el perfil del tunnel:

```bash
docker compose --profile tunnel up -d
docker compose logs -f cloudflared
```

Cloudflare crea el DNS de `tfi.vadonedev.com.ar`. No hace falta abrir los puertos 80/443 ni
exponer el 3100 a internet.

Comprobación final:

```bash
curl https://tfi.vadonedev.com.ar/api/health
```

## 4. Configuración externa

### Supabase

En **Authentication → URL Configuration**:

- Site URL: `https://tfi.vadonedev.com.ar`
- Redirect URLs: `https://tfi.vadonedev.com.ar/**`

Asegurate de que el proyecto Supabase tenga aplicadas las migraciones de la rama. Las de
MercadoPago son:

- `20261024224548_intenciones_de_pago_y_proveedor_mp.sql`
- `20261024224550_confirmar_vacante_por_webhook.sql`

### MercadoPago

En la configuración de webhooks de MercadoPago:

```text
https://tfi.vadonedev.com.ar/api/pagos/webhook/mercadopago
```

Evento: `payment`.

El `notification_url` y las back URLs se generan a partir de `NEXT_PUBLIC_APP_URL`.

## 5. Actualizar

```bash
cd /opt/tfi
git pull
docker compose up -d --build
```

Si el cambio toca el tunnel:

```bash
docker compose --profile tunnel up -d
```

## Notas

- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` y la publishable key se graban al construir
  la imagen. Si cambiás alguna, hay que rebuildear.
- `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` y `PAGOS_PASARELA` se leen en runtime; alcanza
  con recrear el contenedor.
- El contenedor corre como usuario no root y tiene healthcheck en `/api/health`.
- Los logs de Docker están limitados a 10 MB por archivo y 3 archivos.
