# ADR-002 — Webpay sandbox vía proxy Capstone + SQLite

- **Status:** Accepted (Capstone COD-04)
- **Date:** 2026-09-13
- **Deciders:** Equipo D-PAY / Capstone (PO: Webpay entra al Capstone)

## Context

Se requiere cobro con tarjeta en celular genérico (`GENERIC_MOBILE`) y un diseño extensible de pasarelas (`IPaymentGateway` + Factory). El Webpay de DTemite legacy (`/webpay/*`) está orientado a mensualidades corporativas y retornos HTML, no al flujo POS móvil. No se pueden poner credenciales Transbank en la app (PCI).

## Decision

1. Mantener el contrato `IPaymentGateway` en la app (TUU / Webpay / Mock).
2. Crear un **proxy Node** (`webpay-proxy/`) con endpoints:
   - `POST /payments/webpay/create`
   - `POST /payments/webpay/:id/commit`
   - `GET /payments/webpay/:id/status`
3. Persistencia Capstone en **SQLite** (`payment_transactions`) como BD adicional del proxy.
4. Provider default `sim` (sandbox HTML sin Transbank) + provider opcional `chimuelo`.
5. Retorno a la app vía deep link `dtemitepos://payments/webpay/return`.

## Consequences

### Positive

- Extensible: nueva pasarela = nuevo adapter + registro en factory.
- SQLite: cero infra, portable para demo/defensa Capstone.
- Sin keys Transbank en el APK.
- Compatible con el stub COD-04 ya existente en la app.

### Negative / Trade-offs

- SQLite no es multi-tenant de producción; a escala migrar a PostgreSQL o sync a `tbl_dpay`.
- Dispositivo físico requiere IP LAN del PC donde corre el proxy.
- Sync a `tbl_dpay` DTemite queda pendiente de `id_mediopago` Webpay oficial.

## Alternatives considered

| Opción | Resultado |
|---|---|
| A) SDK Transbank en app | Rechazada (PCI / keys) |
| B) Reusar `/webpay/iniciartransaccion` PHP sin cambios | Parcial; retorno no es deep link D-PAY |
| C) Proxy Capstone + SQLite | **Elegida** |
| D) Solo Mock | Insuficiente: PO exige Webpay en Capstone |

## Links

- Código: `webpay-proxy/`
- App: `codigo/src/services/paymentGateway/WebpayPaymentGateway.ts`
- Evidencia: `fase2/individuales/reinhard/EVIDENCIA_COD-04_WEBPAY_SQLITE.md`
