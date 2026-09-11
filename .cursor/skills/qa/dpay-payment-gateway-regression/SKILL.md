---
name: dpay-payment-gateway-regression
description: Plan de regresión específico D-PAY 3.0 tras cambios en PaymentGateway, TUU, Webpay o detección de dispositivo. Usar después de merges en paymentHubService, tuuPayment, IPaymentGateway, o cuando el usuario pide regresión de pasarelas o cobro con terminal Kozen.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
paths:
  - "**/payment/**"
  - "**/*PaymentGateway*"
  - "**/tuuPayment*"
  - "**/paymentHubService*"
---

# D-PAY 3.0 — Regresión PaymentGateway

## Disparadores

- PR que toca `IPaymentGateway`, factory, `tuuPayment.ts`, `paymentHubService.ts`
- Cambio en `SalePaymentScreen` (debe ser mínimo — alerta si no lo es)
- Merge HU-03 / HU-04

## Smoke (obligatorio post-merge)

| # | Verificación | Gateway | Dispositivo |
|---|---|---|---|
| 1 | Detección Kozen vs genérico (HU-01) | — | Ambos |
| 2 | Cobro TUU terminal | TUU | Kozen |
| 3 | Inicio flujo Webpay | Webpay | Genérico |

## Regresión focalizada

Re-ejecutar TC-061 a TC-064 de `dpay-hu06-execution`.

## Puntos frágiles (prioridad Crítica)

1. **Intent Android TUU** — no alterar invocación nativa al refactorizar
2. **`salesStore`** — estado consistente para ambos gateways
3. **Factory PaymentGateway** — instancia correcta según dispositivo
4. **Logs** — sin PAN, CVV, commerce codes ni API keys (RNF-02.4)

## Veredicto de merge

- ❌ **Bloquear** si falla TC-064 (regresión TUU)
- ❌ **Bloquear** si credenciales aparecen en diff o logs de prueba
- ✅ **Aprobar** smoke + TCs críticos Pass con evidencia

## Referencia de archivos clave

- `paymentHubService.ts`
- `tuuPayment.ts`
- `authStore.ts`, `salesStore.ts`
- `apiClient.ts`

(No modificar sin PR y revisión de par.)
