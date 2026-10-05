# Acta de retrospectiva — Sprint 2 (para firmar)

_Borrador de cierre + constancia de asistencia — D-PAY 3.0_

- **Proyecto:** D-PAY 3.0 — POS móvil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 — Duoc UC 2026-2
- **Entregable Drive:** 06 Evidencia de Retrospectiva
- **Product Owner:** José Robles Rocha (Dtemite)
- **Docente guía:** Fabián Alcántara Guajardo
- **Documento:** DOC-06 / Retro S02 + Acta
- **Referencia técnica:** DPAY3_Retro_S02.docx (misma carpeta)
- **Ventana sprint:** 22/09 — 05/10/2026 (semanas 7-8)
- **Estado:** Cierre ~05/10 — pendiente firmas

---
> Borrador anclado a evidencia 27/09 y 03/10/2026. Completar fecha exacta y firmas en la Sprint Review. Si acuerdan cambios en Start/Stop/Continue, anótenlos en Observaciones antes de firmar.


## 1. Datos de la sesión

| Campo | Valor |
|---|---|
| Sprint Goal | Cerrar Webpay (rechazo/cancelación), efectivo + inicio emisión DTE. |
| Goal al 03/10/2026 | Parcial: cancelación y QR cerrados; rechazo y DTE no; Transbank sin comprobante en Honor. |
| Asistentes | Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Fecha retrospectiva | Al cierre del sprint — estimada 05/10/2026 |


## 2. Seguimiento acciones Sprint 1

| Acción S1 | Responsable | Estado |
|---|---|---|
| .env.trello + automatización | Reinhartd | Abierto (manual) |
| TC-WP-05 cancelación Honor | Reinhartd | CERRADO 03/10 |
| TC-WP-04 rechazo Honor | Reinhartd | Abierto → S3 |
| Log Metro TC-DEV-02 | Reinhartd | Abierto |
| App.test.tsx (D-01) | Diego | Abierto |
| Sync tbl_dpay/id_mediopago | Diego | Por iniciar |


## 3. Qué funcionó (Continue)

- Clasificar capturas el mismo día (índices 27/09 y 03/10; _por-clasificar vacío).
- Modal QR in-app (monto, timer, tarjetas integración, Cancelar cobro) — COD-04/PR #14.
- Efectivo $100.000 + PDF + historial local (TC-RNF03).
- DEF-NET documentado (proxy caído / loopback / NetInfo).
- QR LAN → webpay3gint (formulario + banco $4.165) en misma Wi‑Fi.


## 4. Qué no funcionó (Stop)

- Tarjeta sin proxy: Procesando… o solo Efectivo (DEF-NET-01/03).
- Doc timeout 5 min vs 120 s en código (DEF-DOC-01).
- ID TC-WP-03 usado para escenarios distintos — usar TC-WP-TBK / DEF-NET.
- HU-03 incompleto: sin comprobante D-PAY post-banco ni TC-WP-04 en app.
- WWAN sin túnel HTTPS: QR no alcanzable fuera de LAN.


## 5. Qué empezar a hacer (Start)

- Cerrar TC-WP-TBK (comprobante/alerta en Honor) y TC-WP-04 (MC 5186…).
- Re-probar DEF-NET sin USB; alinear doc timeout a 120 s.
- Túnel HTTPS o hotspot con IP actualizada para cliente fuera de LAN.


## 6. Acciones de mejora acordadas

| # | Acción | Responsable | Sprint destino |
|---|---|---|---|
| 1 | Comprobante D-PAY post-Transbank + TC-WP-04 declined Honor | Reinhartd (QA) | S3 |
| 2 | Re-test DEF-NET-01/03; DEF-DOC-01 timeout 120 s | Reinhartd | S3 |
| 3 | Efectivo + boleta 39 → DTE + folio servidor | Diego / QA | S3 |
| 4 | Mock @react-navigation (D-01) | Diego | S3 |


## 7. Métricas (al 03/10/2026)

| Métrica | Valor |
|---|---|
| Capturas 03/10 | 7 AM + 14 noche |
| Webpay app | QR OK; cancel OK; TBK parcial; declined pendiente |
| Efectivo/historial | TC-RNF03 PASS (27/09) |
| Defectos | DEF-NET mitigados en código; pendiente re-test |


## 8. Evidencia de respaldo

- CLASIFICACION-CAPTURAS-2026-09-27.md y 2026-10-03*.md
- 07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_02/DPAY3_Pruebas_S02.docx
- Evidencias_dpay/COD-04-HU03-webpay/


---


## Acta de asistencia y conformidad (firmas)

En ____________________, a _____ de ____________________ de 2026, siendo las _____:_____ hrs., el equipo del proyecto D-PAY 3.0 realiza la retrospectiva del Sprint 2. Modalidad de la sesión: ☐ Presencial  ☐ Remota  ☐ Híbrida.

Los abajo firmantes declaran: (1) haber participado en la sesión de retrospectiva; (2) haber leído el contenido de este documento y del anexo técnico DPAY3_Retro_S02; (3) estar de acuerdo con el registro Start / Stop / Continue y las acciones de mejora, salvo observaciones escritas al pie; (4) autorizar el uso de este acta y su anexo como evidencia DOC-06 para Fase 2 e informe de avance.

Fecha sugerida de la sesión (confirmar con el equipo): 05/10/2026 (Sprint Review).


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

- Foto o captura de la videollamada / reunión (guardar en esta carpeta como Evidencia_S02_reunion_YYYYMMDD.jpg).
- Si imprimen este Word: escanear página de firmas como Evidencia_S02_firmas_YYYYMMDD.pdf.
