# Acta de retrospectiva — Sprint 3 (para firmar)

_Borrador de cierre + constancia de asistencia — D-PAY 3.0_

- **Proyecto:** D-PAY 3.0 — POS móvil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 — Duoc UC 2026-2
- **Entregable Drive:** 06 Evidencia de Retrospectiva
- **Product Owner:** José Robles Rocha (Dtemite)
- **Docente guía:** Fabián Alcántara Guajardo
- **Documento:** DOC-06 / Retro S03 + Acta
- **Referencia técnica:** `06_Evidencia_Retrospectiva/Sprint_03/DPAY3_Retro_S03.md` (v0.4)
- **Ventana sprint:** 06/10 — 17/10/2026 (semanas 9-10)
- **Estado:** Borrador — pendiente fecha de sesión y firmas

---
> Anclado a evidencia 04/10, 11/10, 13/10 y 14/10/2026. Completar fecha exacta y firmas en la Sprint Review. Si acuerdan cambios en Start / Stop / Continue, anótenlos en Observaciones antes de firmar.


## 1. Datos de la sesión

| Campo | Valor |
|---|---|
| Sprint Goal (plan) | Cerrar DTE, historial con folio servidor y NC; informe de avance S10 (20 %). |
| Goal al cierre S3 | **Parcial:** HU-06 Webpay aprobado/rechazado PASS; TC-064 Kozen **Parcial** (13/10); timeout Webpay **300 s** alineado; DTE boleta 39 / folio servidor / NC 61 sin evidencia de cierre; informe 2.3 Fase 2 actualizado (Word 16/10). |
| Asistentes | Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Fecha retrospectiva | Al cierre del sprint — sugerida **17/10/2026** (confirmar en Review) |


## 2. Seguimiento acciones Sprint 2

| # | Acción S2 | Responsable | Estado al cierre S3 |
|---|---|---|---|
| 1 | Comprobante D-PAY post-Transbank + TC-WP-04 declined | Reinhartd | **CERRADO** 04/10 (Celular Android) |
| 2a | Re-test DEF-NET-01/03 sin USB | Reinhartd | **Abierto** (sin evidencia post-03/10) |
| 2b | DEF-DOC-01 timeout oficial | Reinhartd | **CERRADO** 12/10 — **300 s** (`WEBPAY_CHECKOUT_TIMEOUT_SEC`) |
| 3 | Efectivo + boleta 39 → DTE + folio servidor | Diego / QA | **Pendiente** |
| 4 | Mock @react-navigation (D-01) | Diego | **Abierto** |


## 3. Qué funcionó (Continue)

- Evidenciar regresión TUU en Kozen el **13/10** (débito $2.000 *Pago exitoso*) y clasificar el mismo día (`CLASIFICACION-CAPTURAS-2026-10-13.md`, 8 JPG en `Sprint_03/capturas_20261013/`).
- Suite **Jest 17/17** (11/10): `hu06Tuu`, factory y detección — respaldo automático de TC-RG-01 / TC-064.
- Cierre documental TC-064 como **Parcial** (no Bloqueado) en Plan v1.2.1, CSY4111, RNF v1.0.2 (16/10) y entregables 2.3 / 2.4 / 2.6.
- Webpay: comprobante y declined **04/10**; cancelación ya cerrada en S2.
- Publicación coordinada **Pablo + Diego** (Git: actas, Word Fase 2, README `fase2`, 06/07).


## 4. Qué no funcionó (Stop)

- Declarar TC-064 **Bloqueado** cuando Diego ya ejecutó en Kozen P8 Neo (13/10).
- Mezclar **120 s** vs **300 s** en narrativa de checkout (valor oficial: **300 s**).
- Cerrar Sprint Goal de DTE sin captura de folio SII / historial servidor.
- Tratar cancelación de crédito $5.000 como “rechazo emisor” (es *Transacción cancelada* en terminal).


## 5. Qué empezar a hacer (Start)

- Recaptura Kozen: **crédito aprobado** (*Pago exitoso*) y, si el plan lo exige, rechazo emisor.
- Re-test **DEF-NET** sin USB (TC-063) con proxy LAN y proxy apagado.
- Estabilizar flujo **DTE boleta 39 + folio servidor + NC 61** (TC-03 / TC-08 / TC-09) y medir RNF-01.4.
- Decidir con PO volumen **RNF-01.3** (500 productos en comercio QA vs criterio ajustado) — MTC-12 sigue Parcial.
- Facilitar Retro S04 con Trello/backlog alineado al corte real.


## 6. Acciones de mejora acordadas

| # | Acción | Responsable | Sprint destino |
|---|---|---|---|
| 1 | Recaptura TC-064 crédito aprobado (Kozen) | Diego Madrid | S4 |
| 2 | Re-test DEF-NET-01/03 sin USB | Reinhartd Munzenmayer | S4 |
| 3 | DTE boleta 39 + historial folio + NC 61 | Diego Madrid / Reinhartd | S4 |
| 4 | D-01 App.test.tsx en verde | Diego Madrid | S4 |
| 5 | Decisión PO: RNF-01.3 (500 productos) | José Robles Rocha / equipo | S4 |


## 7. Métricas (al 16/10/2026)

| Métrica | Valor |
|---|---|
| TC-064 / TC-RG-01 manual | **Parcial** — débito OK + crédito cancelado; falta crédito aprobado |
| Jest HU-06 + factory | 17/17 PASS (11/10) |
| CSY4111 (15 MTC) | 15 OK, 2 parciales (MTC-12, MTC-13), 1 NOK, **0 bloqueados** |
| Webpay E2E | Aprobado + declined PASS (04/10); timeout doc **300 s** |
| DTE / folio servidor | Sin cierre en S3 |


## 8. Evidencia de respaldo

- `07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_03/DPAY3_Pruebas_S03.md` v0.3
- `Sprint_03/capturas_20261013/` (Kozen 13/10)
- `Sprint_03/CLASIFICACION-CAPTURAS-2026-10-13.md`
- `ANEXO_Evidencias_Retro_S03.md`
- Plan maestro §14.1; catálogo RNF v1.0.2 (16/10)


---

## Acta de asistencia y conformidad (firmas)

En ____________________, a _____ de ____________________ de 2026, siendo las _____:_____ hrs., el equipo del proyecto D-PAY 3.0 realiza la retrospectiva del Sprint 3. Modalidad de la sesión: ☐ Presencial  ☐ Remota  ☐ Híbrida.

Los abajo firmantes declaran: (1) haber participado en la sesión de retrospectiva; (2) haber leído el contenido de este documento y del anexo técnico `DPAY3_Retro_S03`; (3) estar de acuerdo con el registro **Start / Stop / Continue** y las acciones de mejora, salvo observaciones escritas al pie; (4) autorizar el uso de este acta y su anexo como evidencia DOC-06 para Fase 2 e informe de avance.

Fecha sugerida de la sesión (confirmar con el equipo): **17/10/2026** (cierre ventana S3).


### Observaciones del equipo (opcional)

_______________________________________________________________________________

_______________________________________________________________________________


### Firmas de los integrantes

| Nombre completo | Rol en el proyecto | Firma | Fecha |
|---|---|---|---|
| Diego Madrid | Desarrollo (app RN + integración backend DTemite) |  |  |
| Pablo Gutierrez | Scrum Master / Reviews / análisis ERP |  |  |
| Reinhartd Munzenmayer | QA / documentación / Webpay proxy |  |  |


### Evidencia complementaria (opcional)

- Foto o captura de la videollamada / reunión (`Evidencia_S03_reunion_YYYYMMDD.jpg`).
- Página de firmas escaneada (`Evidencia_S03_firmas_YYYYMMDD.pdf`).
