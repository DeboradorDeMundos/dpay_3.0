# Acta de retrospectiva — Sprint 1 (para firmar)

_Anexo técnico + constancia de asistencia — D-PAY 3.0_

- **Proyecto:** D-PAY 3.0 — POS móvil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 — Duoc UC 2026-2
- **Entregable Drive:** 06 Evidencia de Retrospectiva
- **Product Owner:** José Robles Rocha (Dtemite)
- **Docente guía:** Fabián Alcántara Guajardo
- **Documento:** DOC-06 / Retro S01 + Acta
- **Referencia técnica:** DPAY3_Retro_S01.docx (misma carpeta)
- **Ventana sprint:** 08/09 — 21/09/2026 (semanas 5-6)
- **Estado:** Cerrado — pendiente firmas

---
> Este archivo reúne el contenido acordado de la retrospectiva S1 y la hoja de firmas. Cada integrante puede firmar a mano (imprimir/escanear) o enviar confirmación por correo/Discord citando este documento.


## 1. Datos de la sesión

| Campo | Valor |
|---|---|
| Sprint Goal | Base multi-pasarela: detección de dispositivo, factory y cobro Webpay sin hardware Kozen. |
| Sprint Goal cumplido | Sí — Webpay sandbox + efectivo operativos en Honor (evidencia 19/09). |
| Asistentes | Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer |
| Facilitador | Pablo Gutierrez (Scrum Master) |
| Formato | Start / Stop / Continue |
| Fecha retrospectiva | Por confirmar — cierre estimado 19–21/09/2026 |


## 2. Qué funcionó (Continue)

- Arquitectura PaymentGateway (factory + strategy) con pruebas unitarias verdes desde el inicio.
- Detección automática TUU_KOZEN vs GENERIC_MOBILE — caso Honor resuelto.
- Proxy Webpay + SQLite permitió cobrar sin terminal Kozen.
- Evidencia QA: matriz de trazabilidad y nomenclatura de capturas.
- Commits frecuentes y PRs revisados (#7, #8, #9).


## 3. Qué no funcionó (Stop)

- Trello sin actualización automática (falta codigo/.env.trello).
- Sin hardware Kozen: casos TUU bloqueados.
- App.test.tsx no carga (@react-navigation).
- Capturas acumuladas en _por-clasificar — reorden en dos sesiones.
- Priorización real: COD-00..05 vs backlog planificado HU-01..03.


## 4. Qué empezar a hacer (Start)

- Configurar .env.trello y automatizar tarjetas.
- Definir sync tbl_dpay / id_mediopago Webpay con backend.
- Clasificar capturas al momento de tomarlas.


## 5. Acciones de mejora acordadas

| # | Acción | Responsable | Sprint destino |
|---|---|---|---|
| 1 | Crear codigo/.env.trello y automatizar Trello | Reinhartd | S2 |
| 2 | TC-WP rechazo/cancelación Webpay en Honor + log Metro TC-DEV-02 | Reinhartd (QA) | S2 |
| 3 | Corregir/mockear App.test.tsx (@react-navigation) | Diego | S2 |
| 4 | Definir sync tbl_dpay/id_mediopago con backend | Diego | S2 |


## 6. Métricas del sprint

| Métrica | Valor |
|---|---|
| PRs mergeados | 3 (#7, #8, #9) |
| Tests unitarios app | 18/18 (6/7 suites; App.test.tsx con fallo import) |
| Tests proxy | 5/5 |
| COD completados | COD-00..COD-04 (COD-05 parcial) |
| Capturas QA | 16 (15/09 + 19/09) |


## 7. Evidencia de respaldo

- Evidencias_dpay/00-indice/ (clasificaciones 15/09 y 19/09).
- 07_Plan_de_Pruebas/05_Evidencias_por_sprint/Sprint_01/DPAY3_Pruebas_S01.docx
- Repositorio: https://github.com/DeboradorDeMundos/dpay_3.0 (PRs #7–#9).


---


## Acta de asistencia y conformidad (firmas)

En ____________________, a _____ de ____________________ de 2026, siendo las _____:_____ hrs., el equipo del proyecto D-PAY 3.0 realiza la retrospectiva del Sprint 1. Modalidad de la sesión: ☐ Presencial  ☐ Remota  ☐ Híbrida.

Los abajo firmantes declaran: (1) haber participado en la sesión de retrospectiva; (2) haber leído el contenido de este documento y del anexo técnico DPAY3_Retro_S01; (3) estar de acuerdo con el registro Start / Stop / Continue y las acciones de mejora, salvo observaciones escritas al pie; (4) autorizar el uso de este acta y su anexo como evidencia DOC-06 para Fase 2 e informe de avance.

Fecha sugerida de la sesión (confirmar con el equipo): 19–21/09/2026.


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

- Foto o captura de la videollamada / reunión (guardar en esta carpeta como Evidencia_S01_reunion_YYYYMMDD.jpg).
- Si imprimen este Word: escanear página de firmas como Evidencia_S01_firmas_YYYYMMDD.pdf.
