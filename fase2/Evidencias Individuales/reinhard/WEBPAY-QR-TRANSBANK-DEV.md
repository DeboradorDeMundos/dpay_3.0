# Webpay Plus — checkout QR + tarjetas Developers

Fecha: 2026-09-27. Complemento COD-04 / HU-03.

## Qué es (y qué no)

Transbank **no** entrega un producto “QR nativo” en Webpay Plus REST como reemplazo del formulario. El flujo oficial es:

1. `POST` crear transacción → `token` + `url`
2. Cliente abre el formulario Transbank (POST `token_ws`)
3. Ingresa tarjeta (en integración: **tarjetas de prueba** publicadas en [Transbank Developers](https://transbankdevelopers.cl/documentacion/como_empezar))
4. `PUT` commit en el proxy vía retorno `tbk-return`

**Capstone:** generamos un **QR** que apunta al checkout (`/go` en webpayplus o sandbox `sim`). El cajero muestra la pantalla; el cliente escanea y paga en Transbank con tarjetas virtuales de integración.

## Configuración proxy

```powershell
cd webpay-proxy
copy .env.example .env
# Editar:
# PROVIDER=webpayplus
# PUBLIC_BASE_URL=http://<IP-LAN-PC>:8787
npm start
```

Credenciales de integración (públicas): comercio `597055555532`, secret en `.env.example`.

## Endpoints QR

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/payments/webpay/{id}/qr` | HTML con QR + tabla de tarjetas de prueba |
| GET | `/payments/webpay/{id}/qr.json` | Mismo payload para integrar UI en la app |
| GET | `/payments/webpay/{id}/go` | Salto al formulario Transbank |

El `create` devuelve `qr_page_url` y `qr_checkout_url`.

## Tarjetas de prueba (integración)

| Resultado | Tarjeta | CVV | Notas |
|-----------|---------|-----|--------|
| Aprobada | 4051 8856 0044 6623 (VISA) | 123 | Fecha futura cualquiera |
| Rechazada | 5186 0595 5959 0568 (MC) | 123 | Para TC-WP-04 |
| Banco (si pide) | RUT 11.111.111-1 | clave 123 | Paso autenticación |

## App móvil

Al cobrar con pasarela **Webpay**, la app muestra un **modal con QR** (`GET …/qr.json`) mientras hace polling de `/status` (máx. **120 s** / 2 min; commit `2706c96`). Una captura 03-10 AM aún muestra el texto *5 minutos* (build previo). Botón **Cancelar cobro** o tiempo agotado → `POST …/cancel` en el proxy y vuelta a la pantalla de cobro (nuevo QR al reintentar). Rechazo Transbank: alerta y mismo retorno al cobro.

En el formulario Transbank: fecha de vencimiento **cualquier mes/año futuro** (ej. **12/29**), no una fecha fija de la tarjeta. Evidencia 03-10 noche: VISA `4051…6623` + 12/29 + RUT banco `11.111.111-1` → *Estamos procesando tu pago* (`Evidencias_dpay/00-indice/CLASIFICACION-CAPTURAS-2026-10-03-noche.md`).

Tras escanear el QR, Chrome puede mostrar *The information you're about to submit is not secure* porque `PUBLIC_BASE_URL` es **HTTP** LAN (`192.168.1.4:8787`). En QA pulsar **Send anyway**. En WWAN/túnel usar HTTPS.

## Red: WLAN, LAN y WWAN (4G/5G)

La app detecta el tipo de red (`@react-native-community/netinfo`) y elige la URL del proxy:

| Red | App (`webpayProxyConfig.overrides.ts`) | Proxy (`.env` `PUBLIC_BASE_URL`) |
|-----|----------------------------------------|----------------------------------|
| **WLAN** (Wi‑Fi) | `WEBPAY_PROXY_DEV_LAN_URL=http://IP-PC:8787` | Misma IP LAN (QR escaneable en la red) |
| **LAN** (ethernet) | Igual que WLAN | Igual |
| **WWAN** (4G/5G) | `WEBPAY_PROXY_PUBLIC_URL=https://túnel...` | Mismo HTTPS (ngrok / Cloudflare Tunnel) |

Copiar `webpayProxyConfig.overrides.example.ts` → `webpayProxyConfig.overrides.ts` (gitignored).

Sin cable USB: desactivar solo datos si pruebas Wi‑Fi; el log `[WebpayProxy] red=…` confirma el perfil.

**Metro sin USB:** menú dev del APK → *Debug server host* = `IP-PC:8081`.

## Hotspot WWAN del Honor (compartir Internet)

No es “dos celulares en 4G”. El Honor crea una **WLAN** (p. ej. `192.168.43.x`). El PC y el celular del cliente deben unirse a ese Wi‑Fi.

1. `ipconfig` en el PC **después** de unirse al hotspot (la IP **no** es la del router de casa).
2. `PUBLIC_BASE_URL` y `WEBPAY_PROXY_DEV_LAN_URL` = `http://<esa-IP>:8787`.
3. Reiniciar proxy y generar **QR nuevo**.
4. Si el Honor (dueño del hotspot) no alcanza al PC, dejar USB + `adb reverse` para la app; el cliente sigue usando el hotspot.

WWAN + WWAN (cada uno con su operador, sin hotspot ni túnel) **no** abre el QR.

Análisis y fallas de sesión: `Evidencias_dpay/00-indice/ANALISIS-QR-RED-WWAN-HOTSPOT-2026-10-03.md`.

## Pendiente

- Evidencias E2E WWAN con túnel HTTPS, o prueba hotspot con IPs actualizadas.
- Evidencia fotográfica del **cierre** en D-PAY (comprobante aprobado) y TC-WP-04 (MC rechazada). Formulario + banco $4.165 ya archivados 03-10 noche.
