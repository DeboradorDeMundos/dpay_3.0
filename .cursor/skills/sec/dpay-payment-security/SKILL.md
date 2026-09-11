---
name: dpay-payment-security
description: Aplica controles de seguridad D-PAY 3.0 en pagos — PCI-DSS, no PAN/CVV en dispositivo, MMKV, Webpay sandbox, TUU Intent, PaymentGateway. Usar al tocar tuuPayment, paymentHubService, stores de pago, Webpay/Transbank, o RNF-02.4.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
paths:
  - "**/payment/**"
  - "**/*PaymentGateway*"
  - "**/tuuPayment*"
  - "**/paymentHubService*"
  - "**/salesStore*"
  - "**/authStore*"
  - "**/apiClient*"
---

# D-PAY 3.0 — Seguridad en pagos

## RNF duros (no negociables)

- **RNF-02.4 / PCI-DSS:** no almacenar PAN ni CVV en dispositivo
- **MMKV** para tokens sensibles — **no** AsyncStorage para credenciales
- **Sin hardcode** de API keys, commerce codes, credenciales Transbank
- **PaymentGateway:** nuevas pasarelas vía contrato; no lógica en `SalePaymentScreen`

## Superficie de ataque — archivos críticos

| Archivo | Riesgo |
|---|---|
| `tuuPayment.ts` | Intent Android, datos de terminal |
| `paymentHubService.ts` | Orquestación multi-gateway |
| `salesStore.ts` | Estado de venta post-pago |
| `authStore.ts` | Tokens de sesión |
| `apiClient.ts` | Headers, interceptors, logs |

## Checklist Webpay (Transbank sandbox)

- [ ] Credenciales solo en env/backend — no en repo ni MMKV del cliente si no es necesario
- [ ] Flujo redirect/confirmación valida estado server-side cuando aplique
- [ ] Tarjetas de prueba solo desde [transbankdevelopers.cl](https://www.transbankdevelopers.cl)
- [ ] Logs de SDK sanitizados (sin PAN, CVV, API secret)
- [ ] Manejo de timeout/error sin dejar venta en estado ambiguo

## Checklist TUU / Kozen

- [ ] Intent nativo Android no expone extras sensibles a apps terceras
- [ ] Refactor a `PaymentGateway` no amplía superficie de permisos
- [ ] Regresión TC-064 obligatoria tras cambios (`dpay-payment-gateway-regression`)

## Threats específicos (STRIDE resumido)

| Amenaza | Mitigación |
|---|---|
| Log con token Transbank | Redactar; revisar en PR con `sec-secrets-hygiene` |
| Man-in-the-middle | TLS; no downgrade |
| Estado venta manipulado en cliente | Validación backend / idempotencia |
| App en dispositivo rooteado | Documentar riesgo residual (MASVS L1+) |

## Al proponer código

1. Señalar si el cambio toca datos de pago
2. Sugerir TC de seguridad → `qa-test-case-design`
3. No implementar almacenamiento de track data "para debug"

## Skills globales complementarios

- `sec-threat-model` — integraciones nuevas (Flow, Mercado Pago)
- `sec-pr-review` — antes de merge
- `sec-secrets-hygiene` — escaneo de diff
