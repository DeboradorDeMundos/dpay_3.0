# Checklist de cumplimiento — Capstone APT122

**Proyecto:** D-PAY 3.0 — POS móvil de DTemite  
**Docente:** Fabián Alcántara Guajardo  
**Metodología:** Scrum (Opción 2)  
**Revisión:** 9 septiembre 2026

---

## 1. Resumen

| Dimensión | Estado | Comentario |
|---|---|---|
| **Fase 1 (20%)** | En entrega | Vision/Backlog del **producto completo** |
| **Fase 2 (50%)** | En curso | App POS en `codigo/`; evidencias formales pendientes |
| **Fase 3 (30%)** | Por iniciar | Defensa S17 |
| **GitHub** | Parcial | README + docs; commits de los 3 |
| **Guía oficial** | En alineación | Este checklist |

---

## 2. Resultados de aprendizaje

| RA | Evidencia | Estado |
|---|---|---|
| **RA1** Diseña propuesta | Vision: DTemite abre rubro POS; D-PAY es el producto | Listo docs |
| **RA2** Desarrolla APT | App: login, venta, cobro, DTE, historial | En curso |
| **RA3** Presenta APT | Defensa, video del flujo de caja | Pendiente |

---

## 3. Hitos oficiales

| Hito | Fechas | % | Estado |
|---|---|---|---|
| Fase 1 exposición | 31/08 – 05/09/2026 | 20% | Docs v2.0; falta 1.5 + oral |
| Informe avance | 12/10 – 17/10/2026 | 20% | Pendiente |
| Producto final | ~16/11/2026 | 30% | Pendiente |
| Defensa | 30/11 – 05/12/2026 | 30% | Pendiente |

---

## 4. Artefactos Scrum

| Artefacto | Ubicación | Estado |
|---|---|---|
| Ecosistema DTemite / D-PAY | `docs/00-ecosistema-dtemite.md` | Listo v2 |
| Product Vision | `docs/01-vision.md` + docx v3.0 | Listo v2 |
| Product Backlog | `docs/02-backlog.md` + docx v3.0 | Listo v2 |
| Sprint Backlog | `docs/10-sprint-backlog.md` | Listo v2 |
| DoR / DoD | `docs/02-backlog.md` | Listo |
| Diseño (arq + BD) | `docs/05`, `docs/06` | Listo v2 |
| Retrospectivas | `docs/13` | Plantilla |
| Plan de pruebas | `docs/11` | Listo v2 (evidencias pendientes) |
| Manual técnico | `docs/12` | Listo |
| Historias | `docs/03` | Listo v2 |
| RF/RNF | `docs/04` | Listo v2 |
| Metodología | `docs/07` | Listo v2 |
| Gantt | `docs/08` | Listo v2 |
| Innovación | `docs/14` | Listo v2 |
| UML | `docs/15` | Listo v2 |

---

## 5. Obligatorios de la guía

| Elemento | Dónde | Notas |
|---|---|---|
| Arquitectura | `docs/05` | App + plataforma DTemite |
| Modelo de datos | `docs/06` | `tbl_dpay` + tenant |
| UML CU / secuencia / componentes / clases | `docs/15` | Flujo venta + DTE |
| RNF | `docs/04` | 9 categorías |
| Docker | `codigo/docker-compose.yml` | Entorno dev Node; deploy = APK |
| Pruebas | `docs/11` | Matriz del POS |
| Innovación (3 preguntas) | `docs/14` | Rubro nuevo, no pasarela |
| README 7 puntos | `README.md` | Sí |
| Repo público | GitHub | Verificar |

---

## 6. README Duoc (7 puntos)

| # | Requisito | Cumple |
|---|---|---|
| 1 | Nombre | D-PAY 3.0 — POS móvil de DTemite |
| 2 | Problema y público | ERP no llega al mostrador |
| 3 | Tecnologías | RN, API DTemite, TUU, SII |
| 4 | Cómo ejecutar | `codigo/` |
| 5 | Integrantes | Diego, Pablo, Reinhartd |
| 6 | Metodología | Scrum |
| 7 | Arquitectura | App ↔ API ↔ SII / TUU |

---

## 7. Estado del producto (código)

| Componente | En `codigo/` |
|---|---|
| Login, sesión, PIN | Sí |
| Venta, catálogo, scanner | Sí |
| Efectivo y TUU | Sí |
| DTE, TED, PDF | Sí |
| Historial, NC | Sí |
| Impresión Bluetooth | Sí |
| Payment Hub | Sí |
| Settings / tema | Sí |

Fase 2 se concentra en **estabilizar, evidenciar y defender** este POS, no en inventar otro alcance.

---

## 8. Decisiones a validar con el docente

| Tema | Postura del equipo |
|---|---|
| Docker | Compose para dev; el producto se instala como APK |
| Backend | Plataforma de la empresa (`nuevodtemite`); el Capstone es D-PAY |
| Empresa real | DTemite manda el nuevo rubro POS |

---

## 9. Acción inmediata

- [ ] Regenerar docx Vision/Backlog v3.0 con narrativa v2
- [ ] Presentación Fase 1: “DTemite emprende POS; D-PAY es el producto”
- [ ] Repo público, commits de los 3
- [ ] Capturas del flujo de caja en `fase1/`

---

**Revisión:** v2.0 — 9 septiembre 2026
