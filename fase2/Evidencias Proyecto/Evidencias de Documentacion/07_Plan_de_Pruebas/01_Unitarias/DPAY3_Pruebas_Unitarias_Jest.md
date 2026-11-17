# Pruebas Unitarias (Jest) - D-PAY 3.0

_Factory de pasarelas y deteccion de dispositivo_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / 01_Unitarias
- **Version:** 1.1
- **Fecha:** 2026-10-11
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Objetivo

Evidenciar en verde las pruebas unitarias de la factory de pasarelas y de la deteccion de dispositivo, mas las suites de soporte del modulo de pago.


## 2. Comando ejecutado

- codigo/: npx jest --ci
- webpay-proxy/: npm test (node --test src/**/*.test.js)


## 3. Resultado

| Campo | Valor |
|---|---|
| Fecha | 2026-10-04 |
| App (Jest) | Test Suites: 6 passed, 1 failed, 7 total \| Tests: 18 passed, 18 total |
| Proxy (node:test) | tests 5 \| pass 5 \| fail 0 |
| Salida app | 01_Unitarias/jest-codigo-output.txt |
| Salida proxy | 01_Unitarias/jest-proxy-output.txt |

| Suite | Casos | Resultado |
|---|---|---|
| devicePaymentProfile.test.ts | 3 | PASS |
| PaymentGatewayFactory.test.ts | 7 | PASS |
| WebpayPaymentGateway.test.ts | 2 | PASS |
| webpayProxyConfig.test.ts | 2 | PASS |
| MockPaymentGateway.test.ts | 3 | PASS |
| cardPaymentAttempts.test.ts | 1 | PASS |
| App.test.tsx | - | FALLA carga (import @react-navigation) - defecto D-01 |


## 3b. Re-ejecucion focalizada HU-06 / factory / deteccion (11/10/2026)

| Campo | Valor |
|---|---|
| Comando | npx jest __tests__/hu06Tuu.test.ts __tests__/PaymentGatewayFactory.test.ts __tests__/devicePaymentProfile.test.ts --ci --verbose |
| Rama / commit | feature/HU-03-webpay-red-qr / 405b8db |
| Resultado | Test Suites: 3 passed, 3 total \| Tests: 17 passed, 17 total |
| Salida | 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt |

| Caso hu06Tuu.test.ts | Resultado |
|---|---|
| CA-06.1 el modulo nativo abre com.haulmer.paymentapp y deja .dev solo para pruebas | PASS |
| CA-06.2 credito es 101 y debito es 104 | PASS |
| CA-06.3 el adapter conserva authCode y last4 | PASS |
| CA-06.4 un rechazo HP y una cancelacion ICE quedan clasificados para detalle_error | PASS |
| CA-06.5 un celular generico no recibe la pasarela TUU | PASS |

La corrida del 27/09 (jest-codigo-output.txt) no incluia hu06Tuu.test.ts; esta es la primera salida archivada de esa suite. Es la evidencia automatica de la regresion TUU (TC-RG-01 / TC-064). El cobro real en Kozen P8 Neo se evidencio el 13/10 (TC-064 Parcial: debito aprobado $2.000 + credito cancelado $5.000; ver Sprint_03/capturas_20261013/). App.test.tsx se re-verifico el 11/10 y sigue fallando (D-01).


## 4. Interpretacion

Las 18 pruebas unitarias que cubren el nucleo de pago pasan. La unica suite en rojo (App.test.tsx) falla al importar @react-navigation por configuracion de transform de Jest; no ejercita logica de pago. Se registra como defecto Medio D-01.


## 5. Adjuntar

- Captura de la terminal con el resumen en verde (agregar junto a este documento).
- Los .txt de salida ya estan en esta carpeta.
