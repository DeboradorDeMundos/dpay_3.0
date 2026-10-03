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

Al cobrar con pasarela **Webpay**, la app muestra un **modal con QR** (`GET …/qr.json`) mientras hace polling de `/status` (máx. **5 min**). Botón **Cancelar cobro** o tiempo agotado → `POST …/cancel` en el proxy y vuelta a la pantalla de cobro (nuevo QR al reintentar). Rechazo Transbank: alerta y mismo retorno al cobro.

## Pendiente

- `PUBLIC_BASE_URL` HTTPS público para cierre en datos móviles (sin LAN).
- Evidencias fotográficas TC-WP-03/04/05 con formulario Transbank real.
