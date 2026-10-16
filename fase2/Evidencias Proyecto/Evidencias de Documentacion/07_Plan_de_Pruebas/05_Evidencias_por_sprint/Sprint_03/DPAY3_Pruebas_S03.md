# Evidencias de Pruebas - Sprint 3 (en curso)

_D-PAY 3.0 - Semanas 9-10 (06/10 - 17/10/2026)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / Evidencias S03
- **Version:** 0.3 (TC-064 manual 13/10)
- **Fecha:** 2026-10-14
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** En curso
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Objetivo del sprint

| Campo | Valor |
|---|---|
| Goal | Cerrar DTE, historial y NC. Informe de avance S10 (20%). |
| Ventana | 06/10 - 17/10/2026 |
| Hito | Informe avance S10 (20%) |


## 2. Casos a ejecutar (arrastre S2 + DTE)

| TC | Escenario | Prioridad | Estado |
|---|---|---|---|
| TC-WP-04 | Webpay declined (MC 5186) | Alta | OK — cerrado en S2 (04/10), ver DPAY3_Pruebas_S02 §3b |
| TC-WP-TBK | Comprobante Celular Android aprobado | Alta | OK — cerrado en S2 (04/10) |
| TC-03 / HU-07 | Efectivo + boleta 39 -> DTE + tbl_dpay | Alta | Pendiente |
| TC-08 hist. DTE | Historial con folio servidor (no folio 0) | Alta | Pendiente |
| TC-09 | NC 61 | Media | Pendiente |
| WWAN/tunel | QR alcanzable fuera de LAN casa (HTTPS) | Media | Analisis 03/10 |
| RNF-01.4 | Emision DTE < 15 s | Media | Pendiente |
| TC-WP-03 / DEF-NET re-test | Error de conexion sin USB tras mitigacion (TC-063) | Alta | Pendiente |
| TC-064 / TC-RG-01 manual | Cobro TUU/Kozen credito y debito en terminal | Alta | **Parcial** 13/10 — debito aprobado $2.000 + credito cancelado $5.000; falta credito aprobado y rechazo emisor |
| TC-WP-TIMEOUT | Captura 03/10 alineada al timeout oficial 300 s | Media | OK — timeout oficial 300 s (captura 03/10) |


## 3. Casos ejecutados en S3

| Fecha | TC | Escenario | Resultado | Evidencia |
|---|---|---|---|---|
| 11/10 | TC-RG-01 (unit) / TC-064 | hu06Tuu CA-06.1..06.5 + factory + deteccion | PASS 17/17 | 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt |
| 11/10 | D-01 | App.test.tsx (re-verificacion) | FAIL (sigue abierto) | Listado de defectos D-01 |
| 13/10 | TC-064 debito | TUU *Pago exitoso* Tarjeta de Debito $2.000 (P8 Neo, 10:32) | PASS | capturas_20261013/TC-RG-01c_OK_pago-exitoso-debito_2000_20261013_KozenP8Neo.jpg |
| 13/10 | TC-064 credito cancel | TUU credito $5.000: Opera → Cancelar → *Transaccion cancelada* (14:18) | PASS (negativo; no es declined emisor) | capturas_20261013/TC-RG-01e_OK_transaccion-cancelada_5000_20261013_KozenP8Neo.jpg |
| 13/10 | HU-01 en Kozen | Selector *Pasarela: TUU / Kozen* $5.000 y $2.000 | PASS | capturas_20261013/TC-RG-01_selector-tuu-kozen_5000_* y TC-RG-01c_selector-tuu-kozen_2000_* |
| 13/10 | TC-064 conjunto | Credito aprobado + rechazo emisor | Sin evidencia | CLASIFICACION-CAPTURAS-2026-10-13.md |


## 4. Defectos a verificar

- DEF-NET-01/02/03 mitigados en codigo (LAN + NetInfo + timeout 8 s): re-probar sin USB.
- DEF-DOC-01: cerrado (timeout oficial 300 s).
- D-01 App.test.tsx: abierto.

Indice de capturas Kozen: `Evidencias_dpay/00-indice/CLASIFICACION-CAPTURAS-2026-10-13.md`.

> No inventar resultados de DTE, Retro S03 ni re-test USB.
