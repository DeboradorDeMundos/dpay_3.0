---
name: dpay-payment-gateway-dev
description: Implementa PaymentGateway en D-PAY 3.0 — interfaz, factory, adapter TUU/Webpay, HU-01 a HU-04. Usar al desarrollar pasarelas, tuuPayment, paymentHubService, IPaymentGateway, o refactor multi-gateway.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
paths:
  - "**/payment/**"
  - "**/*PaymentGateway*"
  - "**/tuuPayment*"
  - "**/paymentHubService*"
  - "**/SalePayment*"
---

# D-PAY — Desarrollo PaymentGateway

## Objetivo arquitectónico

Multi-gateway desacoplado del hardware vía **Adapter + Strategy + Factory**.

## Contrato (HU-02)

```typescript
// Conceptual — alinear con tipos reales del repo
interface PaymentGateway {
  initiatePayment(context: PaymentContext): Promise<PaymentResult>;
  // métodos según diseño acordado del equipo
}
```

- TUU/Kozen: primera implementación (adapter sobre legacy)
- Webpay: segunda implementación (sandbox)
- UI consume factory, **no** SDKs directos

## Factory (HU-01 + HU-02)

1. Leer detección dispositivo (`settingsStore` / HU-01)
2. Devolver gateway(s) disponibles
3. Una sola opción → preselección (HU-04)

## Reglas duras

- **No** lógica Webpay/TUU en `SalePaymentScreen`
- **No** hardcode de lista de pasarelas en componente
- **No** credenciales Transbank en app
- Refactor TUU **incremental** — ver `eng-refactoring`

## Implementación Webpay (HU-03)

Flujo app:

1. POST backend `/payments/webpay/create` con `sale_id`
2. Redirect / WebView según diseño
3. Return → commit backend → actualizar `salesStore`

Backend: SDK Transbank solo servidor (rule `02-dev-backend`).

## Archivos de referencia

| Archivo | Rol |
|---|---|
| `tuuPayment.ts` | Legacy TUU — adaptar, no reescribir de golpe |
| `paymentHubService.ts` | Orquestación |
| `salesStore.ts` | Estado post-pago |
| `paymentHubStore.ts` | Estado hub si aplica |
| `apiClient.ts` | HTTP |

## Checklist por PR

- [ ] Nuevo gateway implementa contrato completo
- [ ] Factory registra gateway correctamente
- [ ] UI sin `if (webpay)` disperso
- [ ] Regresión TUU planificada (TC-064)
- [ ] Seguridad: `dpay-payment-security`

## Skills complementarias

- `eng-architecture`, `eng-refactoring`, `eng-api-design`
- `dpay-rn-stack` (cliente)
- `qa-*`, `sec-*` para cierre
