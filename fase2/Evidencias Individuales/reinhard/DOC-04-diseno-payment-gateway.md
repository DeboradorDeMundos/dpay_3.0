# DOC-04 — Diseño PaymentGateway y Webpay

Fecha: 2026-09-26. Alcance: capa de pasarelas de la app y proxy Capstone. Decisión de base: [ADR-002](ADR-002-webpay-sqlite-proxy.md).

## 1. Objetivo

Cobrar con tarjeta en un celular genérico (Honor) sin credenciales Transbank en el APK, y dejar el mismo contrato para el terminal Kozen (TUU).

## 2. Restricciones

- No hay Docker ni compose. El proxy es un proceso Node en el PC.
- La app no recibe ni guarda PAN ni CVV. El formulario de tarjeta, cuando existe, lo muestra Transbank.
- `tbl_dpay` de DTemite no recibe pagos Webpay ni Mock hasta que exista un `id_mediopago` oficial.

## 3. Componentes

| Pieza | Rol |
|---|---|
| `devicePaymentProfileService` | Honor y celulares de consumo → `GENERIC_MOBILE` con `webpay` y, en `__DEV__`, `mock`. Kozen con TUU → `TUU_KOZEN`. |
| `PaymentGatewayFactory` | Elige la pasarela. Una sola opción se preselecciona. Webpay tiene prioridad sobre Mock. TUU tiene prioridad en Kozen. |
| `PaymentGatewayBadge` | Con dos o más pasarelas disponibles, el cajero elige. La elección se conserva mientras esa pasarela siga disponible (COD-05). |
| `WebpayPaymentGateway` | Crea el pago en el proxy, abre el checkout y espera el estado final. |
| `webpay-proxy` | Node 22. Providers: `sim` (sandbox HTML), `webpayplus` (REST integración Transbank), `chimuelo` (opcional). |

URL del proxy en la app (`webpayProxyConfig.ts`):

- Emulador: `http://10.0.2.2:8787`
- Honor por USB: `http://127.0.0.1:8787` con `adb reverse tcp:8787`
- Datos móviles: `WEBPAY_PROXY_PUBLIC_URL` con HTTPS público
- Release sin URL pública: Webpay queda apagado; efectivo y DTE siguen

## 4. Modelo de datos

### Proxy — tabla `payment_transactions` (SQLite)

Campos de negocio que COD-06 exige persistir: `provider`, `token`, `buy_order`, `status`.

También se guardan `id`, `sale_id`, `amount`, `currency`, `method`, `tip`, `redirect_url`, `return_url`, `auth_code`, `last4`, `response_code`, `idempotency_key`, `request_json`, `response_json`, `created_at`, `updated_at`, `committed_at`.

`buy_order` cabe en 26 caracteres alfanuméricos (`DP` + id compacto). En bases ya creadas, el proxy agrega la columna con `ALTER TABLE` al arrancar.

La respuesta pública de create y status incluye esos campos. `last4` son solo los últimos cuatro dígitos.

### App — venta local (`tuuPaymentData`)

En un cobro aprobado se copian `paymentProvider`, `gatewayToken`, `buyOrder` y `gatewayStatus`, junto con el `payment_id` en `response.sequenceNumber`. Mock y Webpay quedan con `syncedToBackend: true` para no reenviarlos a `tbl_dpay`.

### App — fallos (MMKV `card-payment-attempts`)

Rechazo, cancelación y timeout se agregan al inicio de una lista local (máximo 50). Cada intento guarda fecha, `provider`, `status`, `paymentId`, `token`, `buyOrder` y monto. No se llama a `registrarTransaccionTuu` para `webpay` ni `mock`.

## 5. Runtime

1. La app pide `POST /payments/webpay/create`.
2. El proxy deja la fila en `redirected` con token y `buy_order`.
3. Provider `sim`: la app abre el HTML del sandbox. Aprobar, Rechazar o Cancelar hace `POST /sandbox/checkout/:id/decide` y redirige a `dtemitepos://payments/webpay/return?payment_id&status`.
4. Provider `webpayplus`: Transbank muestra el formulario. El retorno `tbk-return` hace commit o marca `cancelled`.
5. La app consulta `GET /payments/webpay/:id/status` hasta `approved`, `declined` o `cancelled`.
6. `approved` sigue a la venta completada. `declined` muestra «Pago no completado» y registra el intento. `cancelled` y timeout lanzan error controlado y también registran el intento.

## 6. Fuera de este diseño

NFC SoftPOS, ingreso de tarjeta dentro de la app, afiliación productiva de Transbank y sincronización a `tbl_dpay`.
