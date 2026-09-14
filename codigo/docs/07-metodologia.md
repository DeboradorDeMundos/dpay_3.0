# Metodología Scrum — D-PAY 3.0

---

## 1. Marco

El Capstone se gestiona con **Scrum**, alineado a DSY1102 / PTY4614-001V.

| Factor | Por qué Scrum |
|---|---|
| Empresa mandante | Incrementos que DTemite puede probar en un POS real |
| Producto completo (varios flujos) | Backlog por épicas de caja, no un único spike |
| Equipo de 3 | Ceremonias cortas |
| Evaluación por fases Duoc | Fase 1 = definición; Fase 2 = producto; Fase 3 = defensa |

---

## 2. Equipo

| Rol | Persona | Responsabilidad |
|---|---|---|
| **Product Owner** | José Robles Rocha (DTemite) | Priorizar, aceptar el POS |
| **Scrum Master** | Pablo Gutiérrez | Ceremonias e impedimentos |
| **Developers** | Diego Madrid, Pablo Gutiérrez, Reinhartd Munzenmayer | App, integración, pruebas, docs |
| **Docente guía** | Fabián Alcántara Guajardo | Evaluación |
| **Stakeholder** | Equipo técnico DTemite | API, QA, hardware |

En Fase 1 el equipo priorizó en ausencia de PO formal. Desde v2.0 el PO es José Robles Rocha.

---

## 3. Tiempo — 18 semanas

| Fase | Semanas | Sprints | Objetivo |
|---|---|---|---|
| **Fase 1 — Definición** | 1–4 | Sprint 0 | Vision del producto D-PAY, backlog, arquitectura |
| **Fase 2 — Desarrollo** | 5–15 | Sprint 1–5 | POS usable: venta, cobro, DTE, post-venta |
| **Fase 3 — Cierre** | 16–18 | Sprint 6–7 | Informe, video, defensa |

Sprints de **2 semanas**. Capacidad ~18–22 pts.

---

## 4. Artefactos

| Artefacto | Documento |
|---|---|
| Product Vision | [01-vision.md](./01-vision.md) |
| Product Backlog | [02-backlog.md](./02-backlog.md) |
| Historias | [03-historias-usuario.md](./03-historias-usuario.md) |
| Sprint Backlog | [10-sprint-backlog.md](./10-sprint-backlog.md) |
| Incremento | `main` + APK |
| Diseño | [04](./04-requerimientos.md), [05](./05-arquitectura.md), [06](./06-base-datos.md) |
| Gantt | [08-carta-gantt.md](./08-carta-gantt.md) |
| DoR / DoD | [02-backlog.md](./02-backlog.md) |

---

## 5. Ceremonias

### Sprint Planning

Inicio de sprint, ≤ 2 h. Entrada: backlog. Salida: Sprint Goal + tareas.

### Daily Scrum

≤ 15 min. Qué hice / qué haré / impedimentos. Discord o WhatsApp + acta semanal para el docente.

### Sprint Review

1 h. Demo del flujo de caja (no solo slides). PO acepta o pide cambios.

### Retrospectiva

45 min. Start / Stop / Continue. Registro: [13-retrospectivas-scrum.md](./13-retrospectivas-scrum.md).

### Refinement

1 h a mitad de sprint. Estimar y partir historias grandes (DTE, Hub).

---

## 6. Métricas

| Sprint | Comprometido | Completado | Notas |
|---|---|---|---|
| 0 | — | — | Definición del producto |
| 1 | ~21 | — | Login + venta |
| 2 | ~31 | — | Cobro + DTE (partir HU-07) |
| 3 | ~15 | — | Post-venta + informe S10 |
| 4 | ~16 | — | Impresión, Hub, settings |
| 5 | 8 | — | Pruebas + APK |
| 6–7 | — | — | Defensa |

---

## 7. Impedimentos

| ID | Impedimento | Mitigación |
|---|---|---|
| IMP-01 | Kozen / TUU no disponible | Demo con efectivo + DTE |
| IMP-02 | QA DTemite caído | Documentar contrato; reintentar en QA |
| IMP-03 | PO ocupado | Equipo prioriza; Review asíncrono |

---

## 8. Configuración

| Práctica | Implementación |
|---|---|
| GitHub público | `dpay_3.0` |
| Rama | `main` desplegable |
| Features | `feature/HU-XX-descripcion` |
| PR | Revisión de a pares |
| Secretos | `.gitignore` |

---

## 9. Calidad

| Actividad | Quién |
|---|---|
| Code review | Par |
| Prueba manual de historia | Autor + Reinhartd |
| Regresión efectivo + DTE | Cada Review |
| TUU | Cuando hay Kozen |
| Docs | Pablo + Reinhartd |

---

## 10. Comunicación con DTemite

| Canal | Uso |
|---|---|
| Sprint Review | Demo del POS |
| WhatsApp / mail | API, credenciales, hardware |
| GitHub | Código y docs |

---

## 11. Mapeo a evaluación Duoc

| Criterio | Evidencia |
|---|---|
| Situación real | Empresa DTemite + rubro POS nuevo |
| Ágil | Este documento + ceremonias |
| Documentación | `docs/` |
| Producto | APK con flujo venta → DTE |
| Defensa | Semanas 16–18 |

---

## 12. Política de cambios

1. Cambiar el MVP (quitar DTE, quitar cobro, etc.) requiere PO.
2. No se meten historias mid-sprint sin acuerdo.
3. Lo incompleto vuelve al backlog.
4. La doc se actualiza en el mismo sprint que el código.

---

**Revisión:** v2.0 — 9 septiembre 2026
