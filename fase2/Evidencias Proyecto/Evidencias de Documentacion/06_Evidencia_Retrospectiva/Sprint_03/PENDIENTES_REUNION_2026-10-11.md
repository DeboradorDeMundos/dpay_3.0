# Pendientes para la reunión del equipo - 11/10/2026

D-PAY 3.0 · Sprint 3 (06/10 – 17/10/2026) · Preparado por Reinhartd Munzenmayer (QA).

Todos los tiempos están en segundos (s).

## 1. Decisiones ya tomadas (solo informar)

- **Publicación de actas firmadas:** se suben a GitHub, con las imágenes de firma, para dar continuidad al proyecto académico de titulación. Aplica también a los sprints siguientes. Quedó en `LEEME_FIRMAS_RETROS.md` y en el [PR #17](https://github.com/DeboradorDeMundos/dpay_3.0/pull/17) (rama `docs/fase2-actas-retro-reinhartd`). El PR #16 se cerró al renombrar la rama.
- **Quién publica en Git:** **Pablo Gutiérrez y Diego Madrid** publican, revisan y actualizan (actas firmadas PR #17, 2.2/2.3/2.4/2.6, README de fase2, carpeta `reinhard/`, retiro Docker pendiente de commit si aplica). Reinhartd no mergea, no sube Word al repo ni reparte commits.
- **Sin exposición oral:** la evaluación de esta entrega de Fase 2 es documental + GitHub. No se prepara pptx ni ensayo oral. El indicador 8 de las planillas (equipo / exposición oral) se conserva; si el docente igual evalúa oral, el equipo lo confirmará. No es un riesgo pendiente de Reinhartd.
- **Dispositivo QA:** en documentos y nombres de evidencia se llama «Celular Android» (sufijo `CelularAndroid`). Las actas firmadas S01/S02 dicen «Honor» y no se tocan.
- **TC-064 / TC-RG-01:** **Parcial** (13/10/2026, Kozen P8 Neo, Diego Madrid): débito $2.000 aprobado; crédito $5.000 cancelado (no declined emisor); Jest 17/17 (11/10). Falta crédito aprobado (y rechazo emisor si el plan lo exige). No es «Bloqueado»: D-PAY 2.0 sigue en producción y la regresión manual ya tiene capturas en `Sprint_03/capturas_20261013/`.
- **Timeout de checkout Webpay:** valor oficial **300 s** (`WEBPAY_CHECKOUT_TIMEOUT_SEC`). DEF-DOC-01 cerrado al alinear la documentación. La captura TC-WP-TIMEOUT del 03/10 coincide con 300 s; no se recaptura.

## 2. Decisiones pendientes

| # | Decisión | Opciones | Qué depende de ella |
|---|----------|----------|---------------------|
| 2 | Umbral RNF-01.5 (apertura del checkout Webpay) | «< 10 s» estricto o «≤ 10 s» | La medición del 04/10 dio ~10 s (2 muestras). Con «<» hay que repetir con cronómetro preciso. |
| 3 | Umbral RNF-01.4 (emisión DTE) | «< 15 s» (DoD y `04-requerimientos`) o «hasta 15 s» (DAS EC-RNF-02) | Criterio de MTC DTE en Sprint 3 |
| 4 | RNF-04.3 / EC-RNF-01 en segundos | «< 120 s» (hoy dice «2 minutos») | Catálogo RNF y DAS |
| 5 | RNF de plataforma (RNF-02.6, RNF-07.x) | Mantener como «Must (plataforma)» / N/A o sacarlos del catálogo | Conteo de Must cumplidos |
| 6 | RNF-06.4 (ESLint y Jest en verde antes de merge) | Aprobar o descartar | Hoy está NOK por D-01 |
| 7 | Incorporar EC-RNF-06…09 y las correcciones del DAS en la versión 1.0.3 | Sí / No / parcial | Ver ver Seccion 4 |
| 8 | Volumen de catálogo para RNF-01.3 | Cargar 500 productos en QA o rebajar el criterio | MTC-12 queda Parcial hasta resolverlo |

## 3. Preguntas por persona

### Diego Madrid (arquitectura, Webpay, línea base TUU/Kozen)

1. TC-064 / TC-RG-01: sesión Kozen del **13/10** registrada (débito aprobado + crédito cancelado). ¿Puede recapturar **crédito aprobado** (*Pago exitoso*) y, si aplica, rechazo emisor, con la build actual?
2. Versión de Android del celular QA: ¿la puede confirmar con «Ajustes → Acerca del teléfono» o `adb shell getprop ro.build.version.release`? Hoy figura «por confirmar».
3. D-01 (`App.test.tsx` no carga por `@react-navigation`): ¿lo toma en este sprint (mock o `transformIgnorePatterns`)?
4. DAS 1.0.3: ¿acepta las correcciones de ver Seccion 4 (RNF-01.2 y RNF-01.5 en la meta de desempeño, escenarios de portabilidad y de pagos fallidos, restricciones sin Docker / sin NFC, HU del MVP, CU-04 tipo 0, metadatos)?
5. Túnel HTTPS para Webpay por red móvil (WWAN): ¿se hace en Sprint 3 o queda solo LAN?
6. Sincronización `tbl_dpay` / `id_mediopago` Webpay: ¿sigue «por iniciar»?
7. RNF-06.3: ¿la colección Postman de `codigo/docs/postman/` está vigente?
8. APK release firmada (RNF-09.3): ¿fecha estimada?
9. Con Pablo Gutiérrez: publicar, revisar y actualizar en Git (PR #17, Word 2.2/2.3/2.4/2.6, README de fase2, carpeta `reinhard/`, retiro Docker pendiente de commit si aplica).

### Pablo Gutiérrez (Scrum Master, desarrollo)

1. Fecha y hora de la Review y la Retro S03, y quién facilita.
2. Con Diego Madrid: publicar, revisar y actualizar en Git las actas firmadas ([PR #17](https://github.com/DeboradorDeMundos/dpay_3.0/pull/17)), los Word 2.2/2.3/2.4/2.6, el README de fase2, la carpeta `reinhard/` y el retiro Docker pendiente de commit si aplica. No se hace push directo a `main`. Reinhartd no mergea ni sube Word.
3. TC-03 (efectivo + boleta 39 → DTE + folio servidor), TC-08 (historial con folio servidor) y TC-09 (NC 61): ¿cuándo está estable el flujo DTE para medir RNF-01.4?
4. Aprobación del DAS: la tabla dice «aprobado por Pablo Gutierrez» sin fecha de aprobación. ¿Lo aprueba con la versión 1.0.3?
5. Carpetas individuales de Diego y Pablo en `fase2/individuales/` (indicador de aporte equitativo): las publican, revisan y actualizan Pablo y Diego.
6. Diario 2.1 de Fase 2: estado por integrante.

### Reinhartd Munzenmayer (QA) - compromisos propios

1. Re-test DEF-NET-01/03 (TC-063) sin USB, con proxy en LAN y con proxy apagado. Es lo que falta para cerrar el criterio «error de conexión» de HU-06.
2. Captura TC-WP-TIMEOUT del 03/10 coincide con el timeout oficial 300 s; no se recaptura.
3. Completar MTC-11 con 5 muestras de login en 4G y MTC-13 con 5 muestras de apertura Webpay.
4. Log Metro TC-DEV-02 (acción S1 abierta).
5. Proponer al equipo la corrección del catálogo RNF (ver ver Seccion 4: nombres de evidencia renombrados y «Honor» en observaciones).

### José Robles Rocha (Product Owner, Dtemite)

1. ¿Acepta **TC-064 Parcial** (13/10 Kozen + Jest 17/17) hasta recaptura de crédito aprobado, o exige cierre total antes de declarar HU-06 regresión TUU cerrada?
2. RNF-01.5: ¿«< 10 s» o «≤ 10 s» es aceptable para el negocio?
3. ¿Hay un comercio QA con 500 productos para validar RNF-01.3?
4. UAT / Review formal: no hay registro de aceptación del PO. ¿Puede validar en la Review S03?
5. RNF de plataforma (RNF-02.6, RNF-07.x): ¿DTemite los mantiene como requisitos del Capstone?

## 4. Inconsistencias RNF ↔ DAS que requieren aprobación

No se editó el DAS ni el catálogo RNF. Ver el detalle en el informe QA del 11/10.

| # | Dónde | Problema | Propuesta |
|---|-------|----------|-----------|
| 1 | DAS, Metas, fila Desempeño | No menciona RNF-01.2 (TUU < 2 s) ni RNF-01.5 (Webpay < 10 s) | Agregar ambos |
| 2 | DAS, Metas vs EC-RNF-02 | Meta «menor a 15 s»; escenario «hasta 15 s» | Unificar según la decisión 3 |
| 3 | DAS EC-RNF-01 y RNF-04.3 | «2 minutos» | «120 s» |
| 4 | DAS, Tamaño y desempeño | «HU-01–HU-12 … HU-13–HU-14» | El MVP del semestre es HU-01…HU-06 |
| 5 | DAS, CU-04 | «33, 39, exentas y tipo 0» | 33, 34, 39, 41 y NC 61 (RNF-08.1); tipo 0 no es DTE |
| 6 | DAS, Restricciones | No dice «sin Docker» ni «sin NFC/SoftPOS» | Agregar |
| 7 | DAS, Escenarios | Sin escenario de portabilidad (Kozen vs celular), pagos fallidos (RNF-03.2) ni fallo del proxy | Agregar EC-RNF-06…09 |
| 8 | DAS, Metadatos | Portada 1.0, tabla 1.0.2; revisión 04-10 pero historial solo 01-10; sin fecha de aprobación; «Gutierrez» sin tilde; Anexos «1-» vacío | Corregir en 1.0.3 |
| 9 | Catálogo RNF (CSV/XLSX) | Evidencias `metricas-honor-*.txt` ya se llaman `metricas-celular-android-*.txt`; observaciones dicen «Honor» | Regenerar el catálogo con los nombres nuevos |
| 10 | Catálogo RNF, RNF-01.2 / RNF-05.2 | Decía «Bloqueado» | **Parcial** v1.0.2 (16/10): evidencia Kozen 13/10 + Jest 11/10; falta crédito aprobado |
| 11 | Catálogo RNF, RNF-01.5 | Columna DAS «No figura en el DAS» | Se resuelve con el punto 1 |

## 5. Cierre de documentos 06 y 07

| Documento | Estado | Qué falta | Quién |
|-----------|--------|-----------|-------|
| 06 · `DPAY3_ACTA_Retro_S01.docx` + anexo | Finalizado | - (firmada 04/10; Pablo y Diego publican, revisan y actualizan vía PR #17) | Pablo y Diego |
| 06 · `DPAY3_ACTA_Retro_S02.docx` + anexo | Finalizado | - (firmada 04/10; Pablo y Diego publican, revisan y actualizan vía PR #17) | Pablo y Diego |
| 06 · `DPAY3_Retro_S03` + acta | **Cerrado** 15/10/2026 | Acta firmada 3/3 (remota); seguimiento técnico en `DPAY3_Retro_S03.md` v0.5 | - |
| 06 · `DPAY3_Retro_S04…S07` | Falta sesión (plantillas) | Se llenan en cada sprint | Equipo |
| 06 · `LEEME_FIRMAS_RETROS.md` | Finalizado | - | - |
| 07 · `DPAY3_Plan_Pruebas_v1.0` | Falta | TC-063 re-test, TC-064, TC-03/08/09 DTE, RNF-01.4; RNF-01.5 | Reinhartd, Diego, Pablo |
| 07 · `DPAY3_Catalogo_CSY4111_por_tipo` | Falta | MTC-12 (volumen 500) y MTC-13 (5 muestras / umbral) Parciales; UAT no ejecutado | Reinhartd, PO |
| 07 · `DPAY3_Listado_Defectos` | Falta | Cerrar o re-testear D-01, DEF-NET-01/03; D-02. DEF-DOC-01 cerrado (timeout 300 s) | Diego (D-01), Reinhartd (re-test) |
| 07 · `01_Unitarias` | Falta | D-01 en verde; captura de la terminal | Diego, Reinhartd |
| 07 · `02_Integracion` | Falta | Re-test TC-063 sin USB; túnel WWAN si se decide | Reinhartd, Diego |
| 07 · `03_Rendimiento` | Falta | RNF-01.4 DTE; 5 muestras RNF-01.1 y RNF-01.5; volumen RNF-01.3 | Reinhartd, Pablo (flujo DTE) |
| 07 · `04_Seguridad` | Finalizado | - (proxy HTTP LAN fuera de RNF-02.3; WWAN requiere HTTPS) | - |
| 07 · `DPAY3_Pruebas_S01` | Finalizado | - | - |
| 07 · `DPAY3_Pruebas_S02` | Finalizado | - (arrastre a S3 declarado) | - |
| 07 · `DPAY3_Pruebas_S03` | Falta | Ejecución de TC-03/08/09, RNF-01.4, TC-063; TC-064 **Parcial** (13/10 Kozen) | Reinhartd, Diego, Pablo |
| 07 · `DPAY3_Pruebas_S04…S07` | Falta (plantillas) | Se llenan en cada sprint | Equipo |
| Ambos · Versión de Android del celular QA | Falta dato | Confirmar la versión de Android del celular QA | Diego o Reinhartd |
