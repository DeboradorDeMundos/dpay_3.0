# Pull Request — COD-00 / COD-01 / COD-02

## Título (copiar en GitHub)

```
feat(payments): COD-00/01/02 — baseline, detección dispositivo y PaymentGateway factory
```

## Cuerpo (copiar en descripción del PR)

```markdown
## Summary

Implementa la base multi-gateway del sprint de pagos Capstone:

- **COD-00:** inventario baseline de la capa de pagos (`fase2/proyecto/COD-00-inventario-baseline.md`)
- **COD-01 / HU-01:** detección `TUU_KOZEN` vs `GENERIC_MOBILE`, persistencia MMKV, init al arrancar
- **COD-02 / HU-02:** contrato `IPaymentGateway`, adapter `TuuPaymentGateway`, `PaymentGatewayFactory`, refactor de `PaymentsMethods`

## Cambios principales

| Área | Archivos | Qué hace |
|---|---|---|
| Detección | `devicePaymentProfileService.ts`, `deviceInfo.ts`, `settingsStore.ts`, `App.tsx` | Perfil de dispositivo al boot + MMKV |
| Factory | `types/paymentGateway.ts`, `paymentGateway/*` | Adapter TUU + stubs webpay/mock |
| UI venta | `PaymentsMethods.tsx` | Cobro tarjeta vía factory (no import directo TUU) |
| Selector métodos | `PaymentMethodSelectorScreen.tsx` | Celular genérico → solo efectivo (fix vs biometría) |

## Comportamiento esperado

| Dispositivo | Perfil | Tarjeta | Efectivo |
|---|---|---|---|
| Celular genérico (Honor X5c) | `GENERIC_MOBILE` | Modal “use efectivo” | OK |
| Kozen + TUU instalado | `TUU_KOZEN` | Intent TUU | OK |
| Kozen sin TUU | `TUU_KOZEN` | Modal “instale TUU” | OK |

## Tests

```powershell
cd codigo
npm test -- --testPathPattern="devicePaymentProfile|PaymentGatewayFactory"
```

- `devicePaymentProfile.test.ts` — TUU_KOZEN + GENERIC_MOBILE ✅
- `PaymentGatewayFactory.test.ts` — 3 casos ✅

## Fuera de alcance (sprint posterior)

- `ExternalPaymentScreen` — sigue import directo TUU (Payment Hub)
- `MockPaymentGateway` — COD-03
- `WebpayPaymentGateway` — COD-04 / HU-03
- `cancel()` en contrato gateway

## Evidencia QA

- `fase2/individuales/reinhard/EVIDENCIA_COD-00-02_HU01-HU02.md`
- QA manual Honor/Kozen: pendiente con build debug instalado

## Trazabilidad Trello

- COD-00 Inventario baseline
- COD-01 HU-01 Detección
- COD-02 HU-02 Contrato + factory

## Test plan

- [ ] Merge sin conflictos con `main`
- [ ] Jest: `devicePaymentProfile` + `PaymentGatewayFactory` PASS
- [ ] Honor X5c: log `GENERIC_MOBILE`, efectivo OK, tarjeta → modal
- [ ] Kozen + TUU: regresión cobro tarjeta (COD-08)
- [ ] Efectivo y DTE sin regresión
```

## Enlace para crear el PR

https://github.com/DeboradorDeMundos/dpay_3.0/compare/main...feature/COD-00-02-payment-gateway
