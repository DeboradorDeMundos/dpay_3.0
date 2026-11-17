# Pruebas de Integracion - Webpay Sandbox

_Flujo init -> commit -> estado de venta (proxy COD-04)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / 02_Integracion
- **Version:** 1.0
- **Fecha:** 2026-10-04
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Objetivo

Validar la integracion de cobro Webpay contra el proxy en modo sandbox (sim), cubriendo el ciclo create -> commit -> status sin exponer datos de tarjeta.


## 2. Contrato del proxy

| Paso | Endpoint | Verificacion |
|---|---|---|
| Init | POST /payments/webpay/create | 201; payment_id; buy_order <=26; idempotencia (reuse=true) |
| Commit | POST /payments/webpay/:id/commit | AUTHORIZED->approved (auth_code,last4); FAILED->declined; sin PAN |
| Estado | GET /payments/webpay/:id/status | status=approved; amount correcto |


## 3. Resultado automatico

| Campo | Valor |
|---|---|
| Suite | webpay-proxy/src/proxy.test.js + webpayplus.test.js |
| Resultado | 5 tests PASS (create+simulate+status, buy_order, clasificacion retorno, commit AUTHORIZED/FAILED) |
| Evidencia | 02_Integracion (este doc) + 01_Unitarias/jest-proxy-output.txt |


## 4. Verificacion manual (Celular Android)

Celular Android: aprobado 19/09 ($7k / $1.2M); 03/10 QR+cancel; 04/10 VISA $2.000 -> comprobante D-PAY (TC-WP-TBK OK), MC 5186 rechazada (TC-WP-04 + mensaje app). Evidencia: CLASIFICACION-CAPTURAS-2026-10-04.md.


## 5. Seguridad de la integracion

- Credenciales Transbank/Chimuelo solo en el proxy (.env, no en la app).
- El commit mapea solo last4; el PAN nunca se persiste (test 'no el PAN').
- PROXY_API_TOKEN opcional para LAN; no exponer el puerto a Internet sin auth.
