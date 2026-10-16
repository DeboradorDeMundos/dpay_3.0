# Retrospectiva - Sprint 3

_D-PAY 3.0 - Semanas 9-10 (06/10 - 17/10/2026)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-06 / Retrospectiva S03 (seguimiento tecnico)
- **Version:** 0.5 (alineado acta firmada 15/10/2026)
- **Fecha:** 2026-10-16
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** **Cerrado** — acta `DPAY3_ACTA_Retro_S03.docx` firmada 15/10/2026 (3/3, remota)
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

> Ante diferencia con el acta firmada prevalece `DPAY3_ACTA_Retro_S03.docx`. `DPAY3_Retro_S03.docx` puede quedar desfasado; preferir este `.md` + acta.

---

## 1. Datos de la sesion

| Campo | Valor |
|---|---|
| Sprint | 3 (semanas 9-10) |
| Ventana | 06/10 - 17/10/2026 |
| Hito | Informe avance S10 (20%) |
| Fecha retrospectiva | **15/10/2026** 20:30 (acta firmada; ventana S3 hasta 17/10) |
| Asistentes | Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Sprint Goal (plan) | Cerrar DTE, historial y NC. Informe de avance S10 (20%). |
| Goal cumplido | **Parcial** (Webpay HU-06 y doc S10 avanzan; DTE/folio/NC sin cierre; TC-064 Kozen Parcial) |

> Seguimiento confirmado en Retro S3 (15/10/2026). Detalle Start/Stop/Continue en acta firmada.


## 2. Seguimiento acciones Sprint 2 (acta firmada 04/10/2026)

Estado verificado al 14/10/2026; confirmado en sesion Retro S3 del 15/10/2026.

| # | Accion S2 | Responsable | Estado al 11/10 | Evidencia |
|---|---|---|---|---|
| 1 | Comprobante D-PAY post-Transbank + TC-WP-04 declined Celular Android | Reinhartd Munzenmayer (QA) | CERRADO 04/10 (sesion QA posterior a la retro) | TC-WP-TBK_OK_comprobante-debito_2000_20261004_CelularAndroid.jpg; TC-WP-04_DECLINED_pago-no-completado_3500_20261004_CelularAndroid.jpg; CLASIFICACION-CAPTURAS-2026-10-04.md |
| 2a | Re-test DEF-NET-01/03 sin USB | Reinhartd Munzenmayer (QA) | Abierto (sin evidencia de re-test) | Solo FAIL 03/10 en capturas/defectos/TC-WP-DEF-NET-* |
| 2b | DEF-DOC-01 timeout 300 s (oficial) | Reinhartd Munzenmayer (QA) | Cerrado 12/10: timeout oficial 300 s | codigo/src/services/paymentGateway/webpayCheckoutConstants.ts |
| 3 | Efectivo + boleta 39 -> DTE + folio servidor | Diego Madrid / Reinhartd Munzenmayer | Pendiente (sin evidencia despues del 04/10) | — |
| 4 | Mock @react-navigation (D-01) | Diego Madrid | Abierto (ver 07_Plan_de_Pruebas/00_Plan_maestro/DPAY3_Listado_Defectos.md) | 01_Unitarias/jest-hu06Tuu-factory-deteccion-output-20261011.txt |


## 3. Acciones Sprint 1 aun abiertas (segun acta S2)

| Accion S1 | Responsable | Estado al 11/10 | Nota |
|---|---|---|---|
| .env.trello + automatizacion (D-02) | Reinhartd Munzenmayer | Abierto (workaround manual) | — |
| Log Metro TC-DEV-02 | Reinhartd Munzenmayer | Abierto | No hay log en COD-01-HU01-deteccion/logs/ |
| Sync tbl_dpay / id_mediopago Webpay | Diego Madrid | Por iniciar | MATRIZ-TRAZABILIDAD.md: fila Sync tbl_dpay sin implementar |


## 4. Arrastre desde Sprint 2 (backlog de pruebas)

- Cerrar TC-WP-TBK (comprobante D-PAY / VISA aprobado): cerrado 04/10.
- MTC-13 medicion E2E redireccion Webpay: medido 04/10 (~10 s, en el borde del criterio < 10 s).
- TC-03 DTE boleta 39 + historial con folio servidor.
- D-01 App.test.tsx; DEF-DOC-01 cerrado (timeout oficial 300 s); re-test DEF-NET.
- TC-064 / TC-RG-01: **ya no Bloqueado**. Parcial 13/10 (Kozen P8 Neo): debito $2.000 aprobado; credito $5.000 cancelado. Falta credito aprobado. Ver `07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_03/`.


## 5. Start / Stop / Continue

Técnica Scrum: **tres listas**. Acordado en acta 15/10/2026 (copia literal en `DPAY3_ACTA_Retro_S03.docx`).

### Continue (qué funcionó)

- Clasificar capturas Kozen **13/10** el mismo día; índice `CLASIFICACION-CAPTURAS-2026-10-13.md`.
- Jest **17/17** (11/10) para regresión TUU en código.
- TC-064 documentado como **Parcial** (coherente con capturas), no Bloqueado.
- Webpay declined + comprobante **04/10**; timeout oficial **300 s** en doc y código.

### Stop (qué dejar de hacer)

- Narrar TC-064 bloqueado tras sesión Kozen de Diego Madrid (13/10).
- Mezclar timeout **120 s** en informes (oficial **300 s**).
- Confundir cancelación en terminal con rechazo del emisor.

### Start (qué empezar)

- Recaptura Kozen: crédito **aprobado**; rechazo emisor si aplica al plan.
- Re-test DEF-NET sin USB; cerrar DTE boleta 39 + folio + NC 61.
- Decisión PO sobre **RNF-01.3** (500 productos en QA).


## 6. Acciones de mejora

| # | Accion | Responsable | Sprint destino |
|---|---|---|---|
| 1 | Recaptura TC-064 crédito aprobado (Kozen) | Diego Madrid | S4 |
| 2 | Re-test DEF-NET-01/03 sin USB | Reinhartd Munzenmayer | S4 |
| 3 | DTE boleta 39 + historial folio + NC 61 | Diego Madrid / Reinhartd | S4 |
| 4 | Mock @react-navigation (D-01) | Diego Madrid | S4 |
| 5 | Decisión RNF-01.3 / MTC-12 (500 productos) | PO / equipo | S4 |


## 7. Evidencia adjunta

- Acta firmada: `DPAY3_ACTA_Retro_S03.docx` (15/10/2026, 3/3). Espejo: `DPAY3_ACTA_Retro_S03.md`.
- Indice pre-acta: `ANEXO_Evidencias_Retro_S03.md`.
- Pruebas S3 v0.3: `07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_03/DPAY3_Pruebas_S03.md`.
- 8 JPG Kozen 13/10: `.../Sprint_03/capturas_20261013/`.
