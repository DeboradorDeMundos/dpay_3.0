# Listado de defectos - D-PAY 3.0

_Plantilla CSY4111 2.3.4 / 2.3.6 + skill qa-defect-report_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / Defectos
- **Version:** 1.2
- **Fecha:** 2026-10-11
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Abierto
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## Control

| Severidad | Abiertos / mitigados | Cerrados |
|---|---|---|
| Critico | 0 | 0 |
| Alto | 3 (DEF-NET-01/02/03 mitigados en codigo; re-test S3) | 0 |
| Medio | 2 (D-01, DEF-NET-04) | 0 |
| Bajo | 2 (D-02, DEF-QA-01) | 1 (DEF-DOC-01) |


## D-01 - App.test.tsx no carga

| Campo | Valor |
|---|---|
| ID caso | Codigo / Jest |
| Fecha | 2026-10-04 |
| Ambiente | PC Windows, npx jest --ci |
| Nivel de impacto | Medio |
| Modulo | Arranque app / Jest |
| Titulo | App.test.tsx falla al importar @react-navigation |
| Descripcion | La suite no llega a ejecutar asserts. 18 tests de pago pasan; npm test no queda 100% verde. |
| Pasos | 1. cd codigo  2. npx jest --ci  3. Observar FAIL App.test.tsx |
| Resultado actual | Jest failed to parse: SyntaxError: Unexpected token 'export' en node_modules/@react-navigation/native/lib/module/index.js (falta transformIgnorePatterns/mock) |
| Resultado esperado | Suite de arranque PASS o excluida con motivo |
| Estado | Abierto (re-verificado 11/10/2026: mismo fallo) |
| Tester | Reinhartd Munzenmayer |


## D-02 - Trello CLI sin .env

| Campo | Valor |
|---|---|
| ID caso | Proceso QA |
| Fecha | 2026-09-19 |
| Nivel de impacto | Bajo |
| Titulo | No se actualiza Trello automaticamente |
| Descripcion | Falta codigo/.env.trello en el entorno de automatizacion. |
| Estado | Abierto (workaround manual) |
| Tester | Reinhartd Munzenmayer |


## DEF-NET-01 - Solo efectivo sin USB

| Campo | Valor |
|---|---|
| HU / TC | HU-03 / TC-WP-err |
| Fecha | 2026-10-04 |
| Ambiente | Celular Android, Vo LTE, proxy no alcanzable (127.0.0.1) |
| Nivel de impacto | Alto |
| Titulo | Sin USB no aparecen credito/debito |
| Descripcion | La app apuntaba a 127.0.0.1 (solo adb reverse). UI queda solo Efectivo. |
| Evidencia | TC-WP-DEF-NET-01_FAIL_solo-efectivo_13500_20261003_CelularAndroid.jpg |
| Estado | Mitigado (LAN 192.168.1.4 + overrides); re-test S3 |


## DEF-NET-03 - Procesando eterno

| Campo | Valor |
|---|---|
| HU / TC | HU-03 |
| Fecha | 2026-10-04 |
| Nivel de impacto | Alto |
| Titulo | Credito/debito quedan en Procesando... sin modal QR |
| Descripcion | Proxy apagado + fetch sin timeout. $13.500 credito y debito. |
| Evidencia | TC-WP-DEF-NET-03_FAIL_procesando-*-13500_20261003_CelularAndroid.jpg |
| Estado | Mitigado (proxy :8787 + timeout 8 s); re-test S3 |


## DEF-CFG-01 - Proxy no configurado

| Campo | Valor |
|---|---|
| HU / TC | HU-03 / sesion QA |
| Fecha | 2026-10-04 |
| Ambiente | Celular Android, debito $1.000 |
| Nivel de impacto | Medio |
| Titulo | Webpay proxy no configurado |
| Evidencia | TC-WP-DEF-CFG-01_FAIL_proxy-no-config_1000_20261004_CelularAndroid.jpg |
| Estado | Mitigado (configurar overrides + IP LAN antes de cobrar) |


## DEF-CFG-02 - QR sin URL LAN

| Campo | Valor |
|---|---|
| HU / TC | HU-03 |
| Fecha | 2026-10-04 |
| Titulo | WEBPAY_QR_NETWORK: falta URL LAN del proxy |
| Evidencia | TC-WP-DEF-CFG-02_FAIL_QR-sin-LAN_1000_20261004_CelularAndroid.jpg |
| Estado | Mitigado (misma correccion que DEF-CFG-01) |


## DEF-NET-02 / 04 y DEF-QA / DOC

| ID | Sintoma | Severidad | Estado |
|---|---|---|---|
| DEF-NET-02 | WWAN tratado como offline (NetInfo) | Alto | Corregido en codigo |
| DEF-NET-04 | Metro/JS viejo (bundler no en :8081) | Medio | Mitigado (Metro levantado) |
| DEF-QA-01 | Formulario pide fecha futura (12/29) | Bajo | Uso; no es bug de codigo |
| DEF-DOC-01 | Timeout checkout 300 s (oficial) | Bajo | Cerrado 12/10: timeout oficial 300 s; código y documentos alineados |
