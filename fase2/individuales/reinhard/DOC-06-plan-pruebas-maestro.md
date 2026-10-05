# DOC-06 — Plan de pruebas maestro (PaymentGateway)

Fecha de corte: 2026-10-03. Base: HU-01 a HU-04 de pasarela, ADR-002 y DOC-04. Los planes por sprint (DOC-07) salen de esta tabla; no se inventan aquí sprints ya cerrados.

## Enfoque

- Unitarias: Jest en `codigo` y `node --test` en `webpay-proxy`.
- Integración: HTTP contra el proxy `sim` en el PC.
- Manual: Honor NLA-LX3 `AFMGBB6413102097` o emulador, con captura o log nombrado `TC-…_fecha`.
- Seguridad: buscar PAN/CVV en SQLite, MMKV y logs. Solo se aceptan últimos 4 y token de pasarela.

## Matriz

| Criterio | TC | Tipo | Última ejecución | Evidencia | Estado |
|---|---|---|---|---|---|
| Perfil Honor = `GENERIC_MOBILE` | TC-DEV-02 | Manual | — | Falta log Metro | No cubierto |
| Factory prioriza Webpay sobre Mock | TC-FAC-01 | Unitaria | 2026-09-26 Pass | Jest `PaymentGatewayFactory` | Cubierto |
| El cajero conserva la pasarela elegida | TC-FAC-02 | Unitaria | 2026-09-26 Pass | Jest `keepUserSelection` | Cubierto |
| Selector visible con 2+ pasarelas, tema claro/oscuro | TC-SEL-01 | Manual | — | Código en `PaymentGatewayBadge`; falta captura | Parcial |
| Webpay aprobado en sandbox | TC-WP-03 | Manual | 2026-09-19 Pass | `Evidencias_dpay/COD-04-HU03-webpay/capturas/` | Cubierto |
| QR in-app (monto, timer, tarjetas) | TC-WP-QR-01..03 | Manual | 2026-10-03 Pass | `CLASIFICACION-CAPTURAS-2026-10-03.md` | Cubierto |
| QR LAN → Transbank form + banco | TC-WP-TBK | Manual | 2026-10-03 Parcial | `CLASIFICACION-CAPTURAS-2026-10-03-noche.md` | Parcial: falta comprobante POS |
| Rechazar en checkout | TC-WP-04 | Integración + manual | 2026-09-26 Pass API | `COD-04-HU03-webpay/logs/TC-WP-04-05_API_20260926_proxy-sim.log` | Parcial: falta pantalla de la app |
| Cancelar checkout | TC-WP-05 | Integración + manual | 2026-10-03 Pass app | `TC-WP-05_CANCEL_*` + log API 26/09 | Cubierto |
| `buy_order`, token, provider y status en el proxy | TC-WP-07 | Integración | 2026-09-26 Pass | `webpay-proxy` `npm test` y create en vivo | Cubierto |
| Fallo Webpay no va a `tbl_dpay` | TC-WP-08 | Unitaria de registro local | 2026-09-26 Pass | Jest `cardPaymentAttempts` | Parcial: el desvío en UI no tiene prueba de componente |
| Mock aprobado / rechazado | TC-MK-01 / TC-MK-02 | Manual | — | Selector de código listo; falta ejecución | No cubierto |
| Efectivo + comprobante | TC-DEV-03 | Manual | 2026-09-19 Pass | `regresion-efectivo-dte/capturas/` | Cubierto ($4.000). Historial: TC-RNF03 27/09 |
| Solo efectivo si no hay pasarela | TC-RNF03 | Manual | 2026-09-27 Pass | `CLASIFICACION-CAPTURAS-2026-09-27.md` | Cubierto: UI, PDF e historial local. El servidor respondió `Network request failed` |
| Intent TUU `com.haulmer.paymentapp`, medios 101/104, authCode/last4, errores HP/ICE, sin TUU en celular | TC-HU06-01…05 | Unitaria | 2026-09-27 Pass | `codigo/__tests__/hu06Tuu.test.ts` | Cubierto en código. Falta cobro real en Kozen |

## Comandos de regresión en el PC

```powershell
cd C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0\webpay-proxy
npm test

cd C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0\codigo
npx jest __tests__/PaymentGatewayFactory.test.ts __tests__/WebpayPaymentGateway.test.ts __tests__/cardPaymentAttempts.test.ts __tests__/devicePaymentProfile.test.ts --forceExit
```

## Bloquea el cierre de COD-04 y COD-05

Captura de **TC-WP-04** (MC rechazada en app), **comprobante POS** tras Transbank (cierre TC-WP-TBK), TC-SEL-01 y el log TC-DEV-02. TC-WP-05 ya tiene evidencia en app (03/10). Hacen falta el Honor o un AVD.
