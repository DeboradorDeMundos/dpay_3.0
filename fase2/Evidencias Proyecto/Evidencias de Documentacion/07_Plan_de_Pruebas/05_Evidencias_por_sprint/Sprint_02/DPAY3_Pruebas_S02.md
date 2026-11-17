# Evidencias de Pruebas - Sprint 2

_D-PAY 3.0 - Semanas 7-8 (22/09 - 05/10/2026)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / Evidencias S02
- **Version:** 1.1
- **Fecha:** 2026-10-04
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Cerrado (arrastre TBK/DTE a S3)
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Resumen del sprint

| Campo | Valor |
|---|---|
| Objetivo | Cerrar Webpay (rechazo/cancelacion), cobro efectivo + inicio de emision DTE. |
| Ventana | 22/09 - 05/10/2026 |
| Estado al 2026-10-04 | 27/09 efectivo; 03/10 QR/cancel/TBK parcial; 04/10 MTC-10 + TC-WP-04 MC + DEF-CFG. |


## 2. Casos ejecutados (27/09)

| TC | Escenario | Resultado | Evidencia |
|---|---|---|---|
| TC-RNF03 | Solo efectivo $100.000 + PDF + historial local | PASS | CLASIFICACION-CAPTURAS-2026-09-27.md |
| TC-08 offline | Network request failed; venta folio 0 visible | PASS | TC-RNF03_06_historial-offline_100000_20260927_CelularAndroid.jpg |
| TC-14 / RNF-01.1 | Login 1.5 s WiFi / 2.5 s 4G | PASS | 03_Rendimiento/metricas-celular-android-20260927.txt |


## 3. Casos ejecutados (03/10 Webpay QR)

| TC | Escenario | Resultado | Evidencia |
|---|---|---|---|
| TC-WP-QR-01 | Modal QR $20.500, timer 289 s restantes, Cancelar cobro | PASS | TC-WP-QR-01_OK_modal-monto-timer_20500_20261003_CelularAndroid.jpg |
| TC-WP-QR-02 | QR + tarjetas prueba Transbank + orden DP | PASS | TC-WP-QR-02_OK_tarjetas-prueba-orden_20261003_CelularAndroid.jpg |
| TC-WP-QR-03 | Modal QR $5.000, countdown 109 s restantes (de 120 s) | PASS | TC-WP-QR-03_OK_modal-timer-120s_5000_20261003_CelularAndroid.jpg |
| TC-WP-05 | Cancelar cobro: dialogo Cobro cancelado + toast WEBPAY | PASS | TC-WP-05_CANCEL_dialogo_20500_20261003_CelularAndroid.jpg |
| TC-WP-TIMEOUT | Tiempo agotado (texto 300 s; build previo a 120 s) | PARCIAL | TC-WP-TIMEOUT_dialogo-300s_20500_20261003_CelularAndroid.jpg |
| TC-WP-TBK | VISA $2.000 -> comprobante electronico Celular Android 04/10 | PASS | TC-WP-TBK_OK_comprobante-debito_2000_20261004_CelularAndroid.jpg |
| TC-WP-TBK (03/10) | LAN parcial $4.165 sin comprobante | PARCIAL hist. | CLASIFICACION-CAPTURAS-2026-10-03-noche.md |
| DEF-NET-01/03 | Proxy caido: solo Efectivo / Procesando eterno $13.500 | FAIL doc. | capturas/defectos/TC-WP-DEF-NET-*.jpg |


## 3b. Casos ejecutados (04/10 rechazo + auth + config)

| TC | Escenario | Resultado | Evidencia |
|---|---|---|---|
| TC-02 / MTC-10 | Clave incorrecta login D-PAY | PASS | TC-02_OK_clave-incorrecta_20261004_CelularAndroid.jpg |
| TC-WP-04 | MC rechazada: TBK final + Pago no completado $3.500 en app | PASS | TC-WP-04_DECLINED_pago-no-completado_3500_20261004_CelularAndroid.jpg + cliente |
| DEF-CFG-01 | Webpay proxy no configurado $1.000 | FAIL doc. | defectos/TC-WP-DEF-CFG-01_FAIL_proxy-no-config_1000_20261004_CelularAndroid.jpg |
| DEF-CFG-02 | WEBPAY_QR_NETWORK sin URL LAN | FAIL doc. | defectos/TC-WP-DEF-CFG-02_FAIL_QR-sin-LAN_1000_20261004_CelularAndroid.jpg |
| TC-TBK-AUTH | RUT/clave incorrecta simulador banco (informativo) | OK doc. | TC-WP-04_04..05_banco-*_2000_20261004_cliente.jpg |
| MTC-13 | QR escaneo -> formulario Transbank | PASS (~10 s) | 03_Rendimiento/metricas-celular-android-webpay-20261004.txt |

Indices: CLASIFICACION 03/10 AM+noche y CLASIFICACION-CAPTURAS-2026-10-04.md.


## 4. Pendiente (Sprint 3)

| TC | Escenario | Estado |
|---|---|---|
| TC-03 | Efectivo + boleta 39 -> DTE | S3 |
| D-01 | App.test.tsx @react-navigation | Abierto |
