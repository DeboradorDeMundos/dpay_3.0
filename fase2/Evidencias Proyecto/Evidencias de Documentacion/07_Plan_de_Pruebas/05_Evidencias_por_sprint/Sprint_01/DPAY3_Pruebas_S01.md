# Evidencias de Pruebas - Sprint 1

_D-PAY 3.0 - Semanas 5-6 (08/09 - 21/09/2026)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / Evidencias S01
- **Version:** 1.0
- **Fecha:** 2026-10-04
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Cerrado
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Resumen del sprint

| Campo | Valor |
|---|---|
| Objetivo | Base de la arquitectura multi-pasarela: deteccion de dispositivo, factory y cobro Webpay sin hardware. |
| Ventana | 08/09 - 21/09/2026 |
| PRs mergeados | #7, #8, #9 |
| COD entregados | COD-00, COD-01, COD-02, COD-03, COD-04; COD-05 parcial |


## 2. Pruebas unitarias

Jest en verde para deteccion de dispositivo y factory (18/18 tests; 6/7 suites). Proxy 5/5. Salidas en 07_Plan_de_Pruebas/01_Unitarias/.


## 3. Casos manuales ejecutados (Celular Android)

| TC | Escenario | Resultado | Evidencia |
|---|---|---|---|
| TC-WP-01 | Webpay credito $7.000 aprobado | PASS | TC-WP-01_OK_comprobante-credito-7000_20260919_CelularAndroid.jpg |
| TC-WP-01b | Webpay debito $1.200.000 aprobado | PASS | TC-WP-01_OK_comprobante-debito-1200000_20260919_CelularAndroid.jpg |
| TC-EF-01 | Efectivo $4.000 + comprobante | PASS | TC-DEV-03_OK_comprobante-efectivo-4000_20260919_CelularAndroid.jpg |
| TC-DEV-02 | Perfil GENERIC_MOBILE (metodos de pago) | PASS | TC-DEV-02_metodos-pago_8000_20260919_CelularAndroid.jpg |
| TC-DEV-04 | Legacy TUU-not-found (post-fix) | PASS | TC-DEV-04_LEGACY_TUU-NOT-FOUND_debito-sin-seleccion_20260919_CelularAndroid.jpg |


## 4. Defectos y bloqueos

| ID | Descripcion | Severidad | Estado |
|---|---|---|---|
| D-01 | App.test.tsx falla al importar @react-navigation | Medio | Abierto -> S2 |
| D-02 | Trello no se actualiza sin codigo/.env.trello | Bajo | Workaround manual |
| B-01 | TC-06/07/TC-RG-01 TUU bloqueados por falta de Kozen | - | Bloqueado (HW) |


## 5. Casos que pasaron a S2

- Cancelacion Webpay en app: CERRADO 03/10 (TC-WP-05).
- Rechazo Webpay (TC-WP-04) y log Metro TC-DEV-02: siguen abiertos.


## 6. Trazabilidad

Ver Evidencias_dpay/00-indice/MATRIZ-TRAZABILIDAD.md (COD-00..COD-05).
