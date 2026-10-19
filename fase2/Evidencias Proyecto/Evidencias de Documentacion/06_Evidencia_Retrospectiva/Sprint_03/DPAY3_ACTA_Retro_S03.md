# Acta de retrospectiva - Sprint 3

_Anexo técnico + constancia de asistencia - D-PAY 3.0_

- **Proyecto:** D-PAY 3.0 - POS móvil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Entregable Drive:** 06 Evidencia de Retrospectiva
- **Product Owner:** José Robles Rocha (Dtemite)
- **Docente guía:** Fabián Alcántara Guajardo
- **Documento:** DOC-06 / Retro S03 + Acta
- **Referencia técnica:** `DPAY3_Retro_S03.md` v0.5
- **Ventana sprint:** 06/10 - 17/10/2026 (semanas 9-10)
- **Estado:** **Cerrado**

> Espejo en texto del documento firmado `DPAY3_ACTA_Retro_S03.docx` (misma carpeta). Ante cualquier diferencia prevalece el `.docx` firmado (incluye imágenes de firma).

---

## 1. Datos de la sesión

| Campo | Valor |
|---|---|
| Sprint Goal (plan) | Cerrar DTE, historial con folio servidor y NC; informe de avance S10 (20 %). |
| Goal al cierre S3 | **Parcial:** HU-06 Webpay aprobado/rechazado PASS; TC-064 Kozen **Parcial** (13/10); timeout Webpay **300 s** alineado; DTE boleta 39 / folio servidor / NC 61 sin evidencia de cierre; informe 2.3 Fase 2 actualizado (Word 16/10). |
| Asistentes | Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Fecha retrospectiva | **15/10/2026** 20:30 - remota (Santiago de Chile) |


## 2. Seguimiento acciones Sprint 2

| # | Acción S2 | Responsable | Estado al cierre S3 |
|---|---|---|---|
| 1 | Comprobante D-PAY post-Transbank + TC-WP-04 declined | Reinhartd | **CERRADO** 04/10 (Celular Android) |
| 2a | Re-test DEF-NET-01/03 sin USB | Reinhartd | **Abierto** (sin evidencia post-03/10) |
| 2b | DEF-DOC-01 timeout oficial | Reinhartd | **CERRADO** 12/10 - **300 s** |
| 3 | Efectivo + boleta 39 → DTE + folio servidor | Diego / QA | **Pendiente** |
| 4 | Mock @react-navigation (D-01) | Diego | **Abierto** |


## 3. Qué funcionó (Continue)

- Evidenciar regresión TUU en Kozen el **13/10** (débito $2.000 *Pago exitoso*) y clasificar el mismo día.
- Suite **Jest 17/17** (11/10): respaldo automático de TC-RG-01 / TC-064.
- TC-064 documentado como **Parcial** (no Bloqueado) en Plan, CSY4111, RNF v1.0.2 y entregables 2.3 / 2.4 / 2.6.
- Webpay: comprobante y declined **04/10**; timeout **300 s** alineado.


## 4. Qué no funcionó (Stop)

- Declarar TC-064 **Bloqueado** cuando Diego ya ejecutó en Kozen P8 Neo (13/10).
- Mezclar **120 s** vs **300 s** en narrativa de checkout.
- Cerrar Sprint Goal de DTE sin captura de folio SII / historial servidor.
- Tratar cancelación de crédito $5.000 como rechazo emisor.


## 5. Qué empezar a hacer (Start)

- Recaptura Kozen: crédito **aprobado**; rechazo emisor si aplica.
- Re-test **DEF-NET** sin USB (TC-063).
- DTE boleta 39 + folio servidor + NC 61; decisión PO **RNF-01.3** (500 productos).


## 6. Acciones de mejora acordadas

| # | Acción | Responsable | Sprint destino |
|---|---|---|---|
| 1 | Recaptura TC-064 crédito aprobado (Kozen) | Diego Madrid | S4 |
| 2 | Re-test DEF-NET-01/03 sin USB | Reinhartd Munzenmayer | S4 |
| 3 | DTE boleta 39 + historial folio + NC 61 | Diego Madrid / Reinhartd | S4 |
| 4 | D-01 App.test.tsx en verde | Diego Madrid | S4 |
| 5 | Decisión PO: RNF-01.3 (500 productos) | José Robles Rocha / equipo | S4 |


## Acta de asistencia y conformidad (firmas)

En **Santiago de Chile**, a **15 de octubre de 2026**, siendo las **20:30** hrs., el equipo realiza la retrospectiva del Sprint 3. Modalidad: **Remota**.

**Observaciones:** Sin observaciones.

| Nombre completo | Rol | Firma | Fecha |
|---|---|---|---|
| Diego Madrid | Desarrollo (app RN + integración backend DTemite) | *(en .docx)* | 15-10-2026 |
| Pablo Gutierrez | Scrum Master / Reviews / análisis ERP | *(en .docx)* | 15-10-2026 |
| Reinhartd Munzenmayer | QA / documentación / Webpay proxy | *(en .docx)* | 15-10-2026 |
