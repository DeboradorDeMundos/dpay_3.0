# COD-00 — Inventario baseline (capa de pagos)

**Proyecto:** D-PAY 3.0 Capstone · **Fecha:** 2026-09-09 · **Responsable:** Equipo (baseline Diego / implementación Reinhartd)

---

## 1. Objetivo

Mapa del código **antes** de la capa `PaymentGateway`: qué existe, qué no, y dónde se acopla TUU hoy.

---

## 2. Módulos existentes (sin tocar Payment Hub)

| Módulo | Ruta | Rol |
|---|---|---|
| Servicio TUU | `codigo/src/services/tuuPayment.ts` | Intent Android → app TUU; tipos `TuuPaymentRequest/Response` |
| Bridge nativo TUU | `codigo/android/.../TuuPaymentModule.java` | `isTuuAppInstalled`, `startPayment` |
| UI cobro en venta | `codigo/src/components/payment/PaymentsMethods.tsx` | **Import directo** a `tuuPaymentService` |
| Pantalla cobro externo | `codigo/src/screens/ExternalPaymentScreen.tsx` | Idem (Hub) — fuera de alcance Sprint 1 |
| Serial / POS | `codigo/src/utils/deviceInfo.ts` | `getTerminalSerial`, `isPOSDevice` (huérfana) |
| Nativo serial Kozen | `codigo/android/.../PosDeviceInfoModule.java` | SDK `com.pos.sdk`, getprop |
| Settings | `codigo/src/stores/settingsStore.ts` | Métodos de pago globales; **sin perfil de dispositivo** |
| Sync backend | `codigo/src/services/api.ts` | `registrarTransaccionTuu`, comisiones |
| Modelo venta | `codigo/src/types/common.ts` | `Sale.tuuPaymentData` |

---

## 3. Flujo actual (venta in-app)

```
SalePayment → PaymentMethodScreen → PaymentsMethods
  ├─ Efectivo → SaleCompleted
  └─ Tarjeta → tuuPaymentService.startPayment() → TUU app → SaleCompleted → registrarTransaccionTuu
```

**Violación AR-01:** la UI conoce el SDK TUU (`tuuMethod`, payload Intent).

---

## 4. Payment Hub (concepto distinto)

| Pieza | Ruta |
|---|---|
| Agente polling | `paymentHubAgent.ts` |
| Store | `paymentHubStore.ts` (`gatewayModeEnabled` = cobros remotos, **no** multi-gateway) |
| Listener UI | `PaymentHubListener.tsx` |

No confundir con `PaymentGatewayFactory`.

---

## 5. Gaps vs HU-01 / HU-02 (Capstone pagos)

| Requerido | Estado pre-COD-01/02 |
|---|---|
| `DevicePaymentProfile` (TUU_KOZEN / GENERIC_MOBILE) | ❌ |
| Persistir perfil en `settingsStore` | ❌ |
| `IPaymentGateway` | ❌ |
| `TuuPaymentGateway` (adapter) | ❌ |
| `PaymentGatewayFactory` | ❌ |
| UI desacoplada de TUU | ❌ |
| Webpay adapter | ❌ (Sprint 2) |
| Mock gateway | ❌ (COD-03) |

---

## 6. Entregables COD-00 → COD-02 (esta iteración)

| COD | Entregable |
|---|---|
| COD-00 | Este documento |
| COD-01 | `devicePaymentProfileService.ts` + campos en `settingsStore` + init en `App.tsx` |
| COD-02 | `types/paymentGateway.ts`, `TuuPaymentGateway`, `PaymentGatewayFactory`, refactor `PaymentsMethods` |

---

## 7. Riesgos / notas

- `isPOSDevice()` existía pero no se usaba — se integra en detección Kozen.
- `processPayments` en settings no gatea el flujo (pendiente producto).
- Refactor Hub (`ExternalPaymentScreen`) queda para sprint posterior.
- Producción: tarjeta solo en Kozen con TUU instalado; celular genérico → efectivo hasta Webpay.

---

*Baseline cerrado — base para COD-01 y COD-02.*
