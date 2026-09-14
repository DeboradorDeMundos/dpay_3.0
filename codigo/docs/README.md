# Documentación Capstone — D-PAY 3.0

**Institución:** Duoc UC — Escuela de Informática y Telecomunicaciones — Sede San Bernardo  
**Asignatura:** DSY1102 / PTY4614-001V — Capstone  
**Docente:** Fabián Alcántara Guajardo · f.alcantara@profesor.duoc.cl  
**Semestre:** 2026-2  
**Empresa mandante:** DTemite  
**Repositorio:** [github.com/DeboradorDeMundos/dpay_3.0](https://github.com/DeboradorDeMundos/dpay_3.0)

---

## Qué se documenta

**D-PAY** es el POS móvil de DTemite: vender, cobrar y emitir DTE desde el celular. El Capstone crea y documenta **ese producto completo**, no un módulo de pasarelas.

DTemite aporta la plataforma cloud (ERP + API). D-PAY es el nuevo rubro (punto de venta).

**Leer primero:** [00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md)

---

## Equipo

| Integrante | Rol principal |
|---|---|
| Diego Madrid | Desarrollo / integración mobile–backend |
| Pablo Gutiérrez | Arquitectura / **Scrum Master** |
| Reinhartd Munzenmayer | QA / documentación |

**Product Owner:** José Robles Rocha — DTemite  
**Metodología:** Scrum (Opción 2 — Marco Ágil, guía APT122)

---

## Índice de documentos

### Producto y gestión

| # | Documento | Descripción |
|---|---|---|
| **0** | **[00-ecosistema-dtemite.md](./00-ecosistema-dtemite.md)** | DTemite (ERP) vs D-PAY (POS móvil) |
| ★ | **[09-checklist-capstone-apt122.md](./09-checklist-capstone-apt122.md)** | Matriz de cumplimiento de la guía oficial |
| 1 | [01-vision.md](./01-vision.md) | Product Vision |
| 2 | [02-backlog.md](./02-backlog.md) | Product Backlog del POS completo |
| 3 | [03-historias-usuario.md](./03-historias-usuario.md) | Historias con criterios de aceptación |
| 10 | [10-sprint-backlog.md](./10-sprint-backlog.md) | Sprint Backlog |
| 7 | [07-metodologia.md](./07-metodologia.md) | Ceremonias Scrum |
| 13 | [13-retrospectivas-scrum.md](./13-retrospectivas-scrum.md) | Retrospectivas |
| 8 | [08-carta-gantt.md](./08-carta-gantt.md) | Gantt alineado a hitos oficiales |

### Diseño técnico

| # | Documento | Descripción |
|---|---|---|
| 4 | [04-requerimientos.md](./04-requerimientos.md) | RF + RNF del producto D-PAY |
| 5 | [05-arquitectura.md](./05-arquitectura.md) | Arquitectura app + plataforma DTemite |
| 6 | [06-base-datos.md](./06-base-datos.md) | Modelo ER / `tbl_dpay` |
| 15 | [15-diagramas-uml.md](./15-diagramas-uml.md) | Casos de uso, secuencia, clases, componentes |

### Calidad, despliegue e innovación

| # | Documento | Descripción |
|---|---|---|
| 11 | [11-plan-pruebas-evidencias.md](./11-plan-pruebas-evidencias.md) | Plan de pruebas del flujo POS |
| 12 | [12-manual-tecnico-despliegue.md](./12-manual-tecnico-despliegue.md) | Instalación, Docker, APK |
| 14 | [14-innovacion-y-propuesta-valor.md](./14-innovacion-y-propuesta-valor.md) | Tres preguntas de innovación |

### Entregables Word Fase 1

- `fase1/grupales/Product_Vision_DPAYv3.0.docx`
- `fase1/grupales/Product_Backlog_DPAYv3.0.docx`

---

## Carpetas de fases

| Carpeta | Contenido |
|---|---|
| [fase1/](../fase1/README.md) | Vision, Backlog, individuales Semanas 1–4 |
| [fase2/](../fase2/README.md) | Desarrollo del POS, pruebas, informe S10 |
| [fase3/](../fase3/README.md) | Defensa, video, cierre |

---

## Hitos académicos

| Hito | Fecha | Acción |
|---|---|---|
| **Fase 1 (20%)** | 31/08 – 05/09/2026 | `1.5_APT122` + presentación |
| Informe avance (20%) | 12/10 – 17/10/2026 | Código + evidencias en GitHub |
| Producto final (30%) | ~Semana 15 | APK + flujos core del POS |
| Defensa (30%) | 30/11 – 05/12/2026 | `3.4_APT122` |

---

## Estado (09-09-2026)

| Área | % estimado |
|---|---|
| Documentación del producto completo | En reescritura v2.0 |
| App D-PAY (flujos core en `codigo/`) | Operativa (login, venta, cobro, DTE, historial) |
| Evidencias formales de pruebas | Plan listo; capturas pendientes |

**Revisión:** v2.0 — 9 septiembre 2026
