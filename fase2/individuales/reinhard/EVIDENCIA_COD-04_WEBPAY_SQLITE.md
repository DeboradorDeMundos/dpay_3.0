# Evidencia COD-04 — Webpay proxy + SQLite

**Fecha:** 2026-09-13  
**Rama:** `feature/COD-04-webpay-sqlite-proxy`  
**Alcance:** Webpay entra al Capstone como pasarela; arquitectura extensible; BD adicional SQLite.

## Decisión

Ver [ADR-002-webpay-sqlite-proxy.md](./ADR-002-webpay-sqlite-proxy.md).

## Entregables

| Pieza | Ubicación | Estado |
|---|---|---|
| Proxy HTTP Node | `webpay-proxy/` | ✅ |
| SQLite `payment_transactions` | `webpay-proxy/data/*.sqlite` | ✅ |
| Provider `sim` (sandbox HTML) | `webpay-proxy/src/providers/sim.js` | ✅ |
| Provider `chimuelo` (opcional) | `webpay-proxy/src/providers/chimuelo.js` | ✅ |
| App `WebpayPaymentGateway` | `codigo/src/.../WebpayPaymentGateway.ts` | ✅ |
| Deep link Android | `AndroidManifest.xml` `dtemitepos://payments/webpay` | ✅ |
| Perfil GENERIC_MOBILE | `webpay` + `mock` en `__DEV__` | ✅ |

## Contrato API

### POST `/payments/webpay/create`

```json
{ "amount": 1000, "sale_id": "demo", "method": "credit", "simulate": "approved" }
```

**201:** `{ payment_id, status, redirect_url, auth_code, ... }`

### GET `/payments/webpay/:id/status`

**200:** estado `pending|redirected|approved|declined|cancelled`

### POST `/payments/webpay/:id/commit`

Idempotente si ya está finalizado.

## Factibilidad SQLite

| Pregunta | Respuesta |
|---|---|
| ¿Suficiente para Capstone? | **Sí** — demo, QA Honor, defensa |
| ¿Reemplaza PostgreSQL DTemite? | **No** — BD adicional del proxy |
| ¿Migrable? | Sí — exportar filas a `tbl_dpay` / PG |
| ¿Riesgo concurrente? | Bajo (un proceso Node + WAL) |

## Cómo probar

```bash
# Terminal 1 — proxy
cd webpay-proxy
npm start

# Terminal 2 — test proxy
cd webpay-proxy
npm test

# App — emulador: http://10.0.2.2:8787
# Honor por USB: http://127.0.0.1:8787 con adb reverse tcp:8787 (dev-mobile.ps1)
# Datos móviles: WEBPAY_PROXY_PUBLIC_URL
```

### Casos QA Honor

| ID | Caso | Esperado |
|---|---|---|
| TC-WP-01 | Proxy `/health` | `ok: true` |
| TC-WP-02 | Create + simulate approved | `status=approved` |
| TC-WP-03 | Checkout HTML → Aprobar → deep link | App recibe pago OK |
| TC-WP-04 | Checkout → Rechazar | `success=false` |
| TC-WP-05 | Checkout → Cancelar | error cancelado |
| TC-WP-06 | Efectivo / Mock regresión | Sin regresión |

## Pendiente post-merge

- [x] Persistencia `provider`, `token`, `buy_order`, `status` (COD-06, 2026-09-26). Ver [DOC-04](DOC-04-diseno-payment-gateway.md).
- [ ] Capturas de la app para TC-WP-04 y TC-WP-05 (la API del sandbox ya pasó; log en `Evidencias_dpay`)
- [ ] Definir `id_mediopago` Webpay y sync a `POST /pos/transaccion`
- [ ] Activar `PROVIDER=chimuelo` en QA con token Diego
- [x] Selector UI multi-gateway en código (COD-05). Falta captura en dispositivo.

## Seguridad

- Sin PAN/CVV en app ni SQLite.
- Keys Chimuelo solo en `.env` del proxy (no commit).
- `usesCleartextTraffic` ya habilitado (LAN HTTP QA).
