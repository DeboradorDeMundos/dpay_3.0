# Webpay Proxy — D-PAY 3.0 (COD-04)

Proxy backend Capstone para cobros Webpay en celular genérico.

## Por qué existe

- La app **no** habla con Transbank (PCI / keys).
- El Webpay corporativo de DTemite (`/webpay/*`) está orientado a mensualidades, no al cobro POS móvil.
- Este servicio implementa el contrato que espera `WebpayPaymentGateway`:

| Método | Ruta |
|---|---|
| POST | `/payments/webpay/create` |
| POST | `/payments/webpay/:id/commit` |
| GET | `/payments/webpay/:id/status` |

## SQLite — factibilidad

**Viable y recomendado para Capstone / sandbox.**

| Criterio | SQLite aquí | PostgreSQL DTemite |
|---|---|---|
| Setup | Cero infraestructura | Requiere admin BD |
| Persistencia transacciones Webpay Capstone | Sí | Opcional sync posterior |
| Concurrent writes | Suficiente (WAL, un proceso) | Mejor a escala |
| Producción multi-tenant | No (migrar o sync) | Sí |

Uso: BD **adicional** local del proxy (`data/webpay_payments.sqlite`). No reemplaza `tbl_dpay`. Cuando exista integración productora, el commit aprobado puede sincronizarse a `POST /pos/transaccion`.

## Providers

| `PROVIDER` | Descripción |
|---|---|
| `sim` (default) | Sandbox HTML sin Transbank — demo Capstone / QA Honor |
| `chimuelo` | Reenvía a Chimuelo como el PHP legacy (requiere token) |

## Arranque

```bash
cd webpay-proxy
cp .env.example .env
npm start
```

Health: `GET http://127.0.0.1:8787/health`

## App móvil

| Dispositivo | `WEBPAY_PROXY_BASE_URL` |
|---|---|
| Emulador Android | `http://10.0.2.2:8787` |
| Honor físico (misma WiFi) | `http://<IP-PC>:8787` |

Deep link de retorno: `dtemitepos://payments/webpay/return?payment_id=...&status=...`

## Ejemplo create (simulación inmediata)

```bash
curl -s -X POST http://127.0.0.1:8787/payments/webpay/create \
  -H "Content-Type: application/json" \
  -d "{\"amount\":1000,\"sale_id\":\"demo-1\",\"simulate\":\"approved\"}"
```

## Seguridad

- Credenciales Transbank / Chimuelo **solo** en el proxy (`.env`, no en la app).
- Sin PAN/CVV.
- `PROXY_API_TOKEN` opcional para LAN.
- No exponer el puerto a Internet sin auth.
