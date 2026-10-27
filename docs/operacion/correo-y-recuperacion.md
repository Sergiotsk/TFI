# Correo y recuperación de contraseña

Cómo se manda el email que permite elegir una contraseña nueva (y el de confirmar la cuenta), y qué
hay que configurar en Supabase. El código está en `apps/web` (borde), `packages/application`
(casos de uso) e `infrastructure` (adaptador de Supabase Auth).

## El recorrido

1. En `/login`, **Olvidé mi contraseña** lleva a `/recuperar-contrasena`.
2. Esa pantalla pide el email y llama a `POST /api/auth/recuperar-contrasena`. La respuesta es
   siempre la misma, exista o no la cuenta: no se puede usar para averiguar qué emails están
   registrados.
3. Supabase Auth manda el email con un enlace que vuelve a `GET /auth/confirmar`.
4. Ese endpoint canjea el enlace por una sesión y redirige a `/recuperar-contrasena/nueva`.
5. Ahí se ingresa dos veces la contraseña nueva y `POST /api/auth/cambiar-contrasena` la cambia en
   la cuenta de la sesión. Después cierra las demás sesiones de esa cuenta.
6. Quien ya tiene sesión abierta llega a la misma pantalla desde **Cambiar contraseña** en la barra
   lateral (personal) o en el encabezado (aspirante).

La recuperación asistida del personal (`POST /api/perfiles/:id/contrasena`, contraseña inicial
`nombre` + `dni`) sigue existiendo para quien no tiene acceso al email.

## Configuración en Supabase

### Estado de la app

- **Email confirmation**: si se activa, el registro deja de abrir sesión y muestra el aviso de
  confirmar la cuenta. El enlace de confirmación usa el mismo `/auth/confirmar`, así que no hace
  falta nada más en el código.
- **Site URL** y **Redirect URLs** (Authentication → URL Configuration): el `redirectTo` que manda
  la app es `<NEXT_PUBLIC_APP_URL>/auth/confirmar?destino=...`. Hay que permitir el dominio:

  ```
  http://localhost:3000/**
  https://tfi.vadonedev.com.ar/**
  ```

  Sin la entrada correspondiente, Supabase descarta el `redirectTo` y el enlace vuelve al Site URL.

### Envío de emails (Resend)

Authentication → Emails → SMTP Settings:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) o `587` (STARTTLS) |
| Username | `resend` |
| Password | la API key de Resend (`re_...`) |
| Sender email | una dirección del dominio verificado en Resend |
| Sender name | por ejemplo `UTN FRH Inscripción` |

El dominio del remitente se verifica en Resend (registros DNS SPF/DKIM). Sin eso, Resend rechaza el
envío y la app devuelve `ENVIO_FALLIDO` (HTTP 503).

### Plantillas

Con las plantillas por defecto (`{{ .ConfirmationURL }}`) el enlace vuelve con `?code=` y funciona
con el flujo PKCE de `@supabase/ssr`: el verificador queda en una cookie del navegador que pidió el
enlace. **El enlace tiene que abrirse en el mismo navegador y en el mismo dominio** que pidió el
email; si se abre en otro dispositivo o con otro host (por ejemplo, se pidió en
`http://localhost:3000` y `NEXT_PUBLIC_APP_URL` apunta a un túnel de ngrok), el canje falla y la app
pide pedir uno nuevo. Por eso `NEXT_PUBLIC_APP_URL` tiene que ser el host que se está usando: si el
túnel de ngrok cambia, hay que actualizarlo, volver a compilar (es `NEXT_PUBLIC_*`) y agregar el
dominio nuevo a las Redirect URLs.

Para que el enlace funcione en cualquier dispositivo, cambiar la plantilla (Recovery y Confirm
signup) para que apunte a la app con `{{ .TokenHash }}`:

```html
<a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery&destino=recuperar">
  Elegir una contraseña nueva
</a>
```

El endpoint `GET /auth/confirmar` acepta las dos formas (`code` y `token_hash` + `type`).

### Límites

Supabase limita los emails por hora (por proyecto y por dirección). Si se agota, el pedido devuelve
`ENVIO_FALLIDO`; se puede revisar en Authentication → Rate Limits y en los logs de Auth.

## Entorno

- `NEXT_PUBLIC_APP_URL`: URL pública de la app, sin barra final. Es la base de los enlaces de los
  emails y de las `back_urls` de MercadoPago. Si falta, se usa `http://localhost:3000`.
- No hay claves nuevas para el correo: el envío lo hace Supabase con el SMTP configurado arriba.
  `SUPABASE_SERVICE_ROLE_KEY` sigue siendo solo para el restablecimiento asistido del personal.

## Cómo probarlo

Desde `/pruebas` (sección **Recuperar y cambiar contraseña**):

- **Probar el pedido de recuperación** verifica que un email inválido dé 400 y que un email sin
  cuenta dé 200 (misma respuesta que uno con cuenta).
- **POST /api/auth/recuperar-contrasena** manda el email a la dirección elegida.
- **POST /api/auth/cambiar-contrasena** cambia la contraseña de la cuenta con la que está abierto el
  panel; sin sesión responde 401.

El enlace del email solo se puede probar de verdad desde la casilla: abrirlo, elegir la contraseña
dos veces y verificar que después el login entra con la nueva.
