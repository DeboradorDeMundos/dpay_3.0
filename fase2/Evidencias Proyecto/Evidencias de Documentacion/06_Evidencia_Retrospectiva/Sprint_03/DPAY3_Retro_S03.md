# Retrospectiva - Sprint 3 (pre-sesion)

_D-PAY 3.0 - Semanas 9-10 (06/10 - 17/10/2026)_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-06 / Retrospectiva S03
- **Version:** 0.2 (plan + seguimiento de acuerdos)
- **Fecha:** 2026-10-11
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Planificado
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Datos de la sesion

| Campo | Valor |
|---|---|
| Sprint | 3 (semanas 9-10) |
| Ventana | 06/10 - 17/10/2026 |
| Hito | Informe avance S10 (20%) |
| Fecha retrospectiva | por completar (en la Review) |
| Asistentes | por completar (registrar solo quienes asistan) |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Sprint Goal (plan) | Cerrar DTE, historial y NC. Informe de avance S10 (20%). |
| Goal cumplido | por completar (Si / Parcial / No) |

> Plantilla de entrada: se llena en la Review. Arrastre real desde S2.


## 2. Seguimiento acciones Sprint 2 (acta firmada 04/10/2026)

Estado verificado al 11/10/2026 contra evidencia local. Confirmar en la sesion.

| # | Accion S2 | Responsable | Estado al 11/10 | Evidencia |
|---|---|---|---|---|
| 1 | Comprobante D-PAY post-Transbank + TC-WP-04 declined Celular Android | Reinhartd Munzenmayer (QA) | CERRADO 04/10 (sesion QA posterior a la retro) | TC-WP-TBK_OK_comprobante-debito_2000_20261004_CelularAndroid.jpg; TC-WP-04_DECLINED_pago-no-completado_3500_20261004_CelularAndroid.jpg; CLASIFICACION-CAPTURAS-2026-10-04.md |
| 2a | Re-test DEF-NET-01/03 sin USB | Reinhartd Munzenmayer (QA) | Abierto (sin evidencia de re-test) | Solo FAIL 03/10 en capturas/defectos/TC-WP-DEF-NET-* |
| 2b | DEF-DOC-01 timeout 300 s (oficial) | Reinhartd Munzenmayer (QA) | Cerrado 12/10: timeout oficial 300 s | codigo/src/services/paymentGateway/webpayCheckoutConstants.ts |
| 3 | Efectivo + boleta 39 -> DTE + folio servidor | Diego Madrid / Reinhartd Munzenmayer | Pendiente (sin evidencia despues del 04/10) | — |
| 4 | Mock @react-navigation (D-01) | Diego Madrid | Abierto (ver 07_Plan_de_Pruebas/00_Plan_maestro/DPAY3_Listado_Defectos.md) | 01_Unitarias/jest-codigo-output.txt |


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


## 5. Start / Stop / Continue

Completar al cierre del sprint (no inventar).


## 6. Acciones de mejora

| # | Accion | Responsable | Sprint destino |
|---|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |


## 7. Evidencia adjunta

- Acta de la retrospectiva firmada por el equipo (DPAY3_ACTA_Retro_S03.docx, mismo formato que S01/S02).
